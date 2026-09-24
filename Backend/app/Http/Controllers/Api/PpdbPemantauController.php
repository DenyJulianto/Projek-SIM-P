<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PpdbHelpers;
use App\Http\Controllers\Controller;
use App\Models\PpdbDokumen;
use App\Models\PpdbJalur;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

/**
 * Notifikasi PPDB (dihitung langsung dari data, tidak disimpan) dan Audit Trail
 * (dibaca dari activity log yang ditulis oleh setiap aksi penting PPDB).
 */
class PpdbPemantauController extends Controller
{
    use PpdbHelpers;

    private const URUTAN = ['mendesak' => 0, 'peringatan' => 1, 'info' => 2];

    public function notifikasi(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id']]);
        $periode = PpdbPeriode::with('jalur')->findOrFail($in['periode_id']);
        $hariIni = Carbon::today();
        $sisaHari = fn ($tanggal) => (int) $hariIni->diffInDays(Carbon::parse($tanggal), false);
        $terbit = (bool) $periode->pengumuman_terbit_at;

        $p = PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')->get();
        $items = [];
        $tambah = function (string $tingkat, string $pesan, string $tab, ?int $jumlah = null) use (&$items) {
            $items[] = ['tingkat' => $tingkat, 'pesan' => $pesan, 'tab' => $tab, 'jumlah' => $jumlah];
        };

        // Pengaturan
        if ($periode->status === 'draft') {
            $kurang = array_filter([
                $periode->jalur->where('aktif', true)->isEmpty() ? 'belum ada jalur penerimaan aktif' : null,
                $periode->kuota < 1 ? 'kuota belum diisi' : null,
            ]);
            if ($kurang) {
                $tambah('peringatan', 'Pengaturan PPDB belum lengkap: '.implode(', ', $kurang).'.', 'pengaturan');
            } else {
                $tambah('info', 'Pengaturan lengkap. PPDB masih berstatus Draft dan siap dibuka.', 'pengaturan');
            }
        }

        // Masa pendaftaran
        if ($periode->status === 'dibuka') {
            $sisa = $sisaHari($periode->tanggal_selesai);
            if ($sisa < 0) {
                $tambah('mendesak', 'Masa pendaftaran berakhir '.abs($sisa).' hari lalu, tetapi status PPDB masih “Pendaftaran Dibuka”. Tutup pendaftaran bila sudah selesai.', 'pengaturan');
            } elseif ($sisa <= 3) {
                $tambah('peringatan', $sisa === 0 ? 'Hari ini terakhir masa pendaftaran.' : "Masa pendaftaran berakhir {$sisa} hari lagi.", 'pengaturan');
            }
        }

        // Verifikasi
        $belumVerif = $p->where('status_verifikasi', 'belum')->count();
        if ($belumVerif) {
            $tambah(in_array($periode->status, ['ditutup', 'seleksi'], true) ? 'mendesak' : 'peringatan', "{$belumVerif} pendaftar belum diverifikasi.", 'verifikasi', $belumVerif);
        }
        if ($n = $p->where('status_verifikasi', 'perlu_perbaikan')->count()) {
            $tambah('info', "{$n} pendaftar menunggu perbaikan data dari pendaftar.", 'verifikasi', $n);
        }
        $dokMenunggu = PpdbDokumen::whereIn('ppdb_pendaftar_id', $p->pluck('id'))->where('status', 'menunggu')->count();
        if ($dokMenunggu) {
            $tambah('info', "{$dokMenunggu} dokumen menunggu pemeriksaan keabsahan.", 'verifikasi', $dokMenunggu);
        }

        // Seleksi
        if (! $terbit) {
            $belumSeleksi = $p->where('status_verifikasi', 'diverifikasi')->where('status_seleksi', 'belum')->count();
            if ($belumSeleksi) {
                $tambah('peringatan', "{$belumSeleksi} pendaftar terverifikasi belum memiliki hasil seleksi.", 'seleksi', $belumSeleksi);
            }
            if ($periode->jadwal_seleksi && in_array($periode->status, ['dibuka', 'ditutup', 'seleksi'], true) && ($belumSeleksi ?? 0) > 0) {
                $sisa = $sisaHari($periode->jadwal_seleksi);
                if ($sisa < 0) {
                    $tambah('mendesak', 'Jadwal seleksi terlewat '.abs($sisa).' hari dan hasil seleksi belum lengkap.', 'seleksi');
                } elseif ($sisa <= 3) {
                    $tambah('info', $sisa === 0 ? 'Seleksi dijadwalkan hari ini.' : "Seleksi dijadwalkan {$sisa} hari lagi.", 'seleksi');
                }
            }
        }
        foreach ($periode->jalur as $j) {
            /** @var PpdbJalur $j */
            $terisi = $p->where('ppdb_jalur_id', $j->id)->where('status_seleksi', 'lolos')->where('status_daftar_ulang', '!=', 'dibatalkan')->count();
            if ($terisi > $j->kuota) {
                $tambah('peringatan', "Jalur {$j->nama} melebihi kuota ({$terisi} dari {$j->kuota}).", 'seleksi');
            }
        }

        // Pengumuman
        if (! $terbit) {
            $tertunda = $p->whereIn('status_verifikasi', ['belum', 'perlu_perbaikan'])->count();
            $tanpaHasil = $p->where('status_verifikasi', 'diverifikasi')->where('status_seleksi', 'belum')->count();
            if ($tertunda === 0 && $tanpaHasil === 0 && $p->where('status_seleksi', 'lolos')->isNotEmpty()) {
                $tambah('info', 'Semua pendaftar sudah diputuskan. Hasil seleksi siap diumumkan.', 'pengumuman');
            }
            if ($periode->jadwal_pengumuman && in_array($periode->status, ['ditutup', 'seleksi'], true)) {
                $sisa = $sisaHari($periode->jadwal_pengumuman);
                if ($sisa < 0) {
                    $tambah('mendesak', 'Jadwal pengumuman terlewat '.abs($sisa).' hari dan hasil belum diterbitkan.', 'pengumuman');
                } elseif ($sisa <= 3) {
                    $tambah('peringatan', $sisa === 0 ? 'Pengumuman dijadwalkan hari ini.' : "Pengumuman dijadwalkan {$sisa} hari lagi.", 'pengumuman');
                }
            }
        }

        // Daftar ulang & penerimaan
        if ($terbit) {
            $lolos = $p->where('status_seleksi', 'lolos');
            $belumDu = $lolos->where('status_daftar_ulang', 'belum')->count();
            $batas = $periode->daftar_ulang_selesai;
            $sisa = $batas ? $sisaHari($batas) : null;
            if ($belumDu) {
                $tambah($sisa !== null && $sisa < 0 ? 'mendesak' : 'peringatan', "{$belumDu} peserta lolos belum melakukan daftar ulang.", 'daftar-ulang', $belumDu);
            }
            if ($batas && ($belumDu || $sisa >= 0)) {
                if ($sisa < 0) {
                    $tambah('mendesak', 'Batas daftar ulang terlewat '.abs($sisa).' hari.', 'daftar-ulang');
                } elseif ($sisa <= 7) {
                    $tambah($sisa <= 2 ? 'mendesak' : 'peringatan', $sisa === 0 ? 'Hari ini batas terakhir daftar ulang.' : "Batas daftar ulang tersisa {$sisa} hari.", 'daftar-ulang');
                }
            }
            if ($n = $lolos->where('status_daftar_ulang', 'sudah')->where('status_penerimaan', 'belum')->count()) {
                $tambah('peringatan', "{$n} peserta sudah daftar ulang tetapi penerimaannya belum dikonfirmasi.", 'diterima', $n);
            }
            if ($n = $p->where('status_penerimaan', 'diterima')->whereNull('siswa_id')->count()) {
                $tambah('peringatan', "{$n} peserta diterima belum diimpor ke Data Siswa.", 'diterima', $n);
            }
        }

        usort($items, fn ($a, $b) => self::URUTAN[$a['tingkat']] <=> self::URUTAN[$b['tingkat']]);

        return response()->json([
            'periode_id' => $periode->id,
            'total' => count($items),
            'perlu_tindakan' => count(array_filter($items, fn ($i) => $i['tingkat'] !== 'info')),
            'per_tab' => collect($items)->where('tingkat', '!=', 'info')->groupBy('tab')->map->count()->all(),
            'data' => $items,
        ]);
    }

    /** Nilai skalar dibungkus agar sebelum/sesudah selalu berupa pasangan kolom → isi. */
    private function normal(mixed $v): ?array
    {
        return $v === null ? null : (is_array($v) ? $v : ['nilai' => $v]);
    }

    public function audit(Request $request): JsonResponse
    {
        $in = $request->validate([
            'periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'],
            'event' => ['nullable', 'string', 'max:30'],
            'pengguna_id' => ['nullable', 'integer'],
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $pendaftarIds = PpdbPendaftar::where('ppdb_periode_id', $in['periode_id'])->pluck('id');
        $dasar = fn () => Activity::where('log_name', self::LOG_PPDB)->where(function ($w) use ($pendaftarIds, $in) {
            $w->where(fn ($x) => $x->where('subject_type', PpdbPendaftar::class)->whereIn('subject_id', $pendaftarIds))
                ->orWhere(fn ($x) => $x->where('subject_type', PpdbPeriode::class)->where('subject_id', $in['periode_id']));
        });

        $halaman = $dasar()->with('causer:id,name')
            ->when(! empty($in['event']), fn ($q) => $q->where('event', $in['event']))
            ->when(! empty($in['pengguna_id']), fn ($q) => $q->where('causer_id', $in['pengguna_id']))
            ->when(! empty($in['dari']), fn ($q) => $q->whereDate('created_at', '>=', $in['dari']))
            ->when(! empty($in['sampai']), fn ($q) => $q->whereDate('created_at', '<=', $in['sampai']))
            ->when(! empty($in['search']), fn ($q) => $q->where('description', 'like', '%'.$in['search'].'%'))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate($in['per_page'] ?? 25);

        $nomor = PpdbPendaftar::whereIn('id', collect($halaman->items())->where('subject_type', PpdbPendaftar::class)->pluck('subject_id'))->get(['id', 'nomor_pendaftaran', 'nama_lengkap'])->keyBy('id');

        $halaman->getCollection()->transform(function (Activity $a) use ($nomor) {
            $prop = $a->properties?->toArray() ?? [];
            $pendaftar = $a->subject_type === PpdbPendaftar::class ? $nomor->get($a->subject_id) : null;

            return [
                'id' => $a->id,
                'waktu' => $a->created_at,
                'pengguna' => $a->causer?->name ?? 'Sistem',
                'pengguna_id' => $a->causer_id,
                'ip' => $prop['ip'] ?? null,
                'tindakan' => $a->event,
                'deskripsi' => $a->description,
                'objek' => $a->subject_type === PpdbPeriode::class ? 'Pengaturan PPDB' : ($pendaftar ? "{$pendaftar->nomor_pendaftaran} — {$pendaftar->nama_lengkap}" : 'Pendaftar'),
                'sebelum' => $this->normal($prop['sebelum'] ?? null),
                'sesudah' => $this->normal($prop['sesudah'] ?? null),
                'catatan' => $prop['catatan'] ?? ($prop['alasan'] ?? null),
            ];
        });

        $penggunaIds = $dasar()->whereNotNull('causer_id')->distinct()->pluck('causer_id');

        return response()->json($halaman->toArray() + [
            'opsi' => [
                'pengguna' => DB::table('users')->whereIn('id', $penggunaIds)->orderBy('name')->get(['id', 'name']),
                'tindakan' => $dasar()->distinct()->orderBy('event')->pluck('event')->values(),
            ],
        ]);
    }
}

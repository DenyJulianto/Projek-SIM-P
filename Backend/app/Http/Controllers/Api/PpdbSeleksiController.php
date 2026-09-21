<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PpdbHelpers;
use App\Http\Controllers\Controller;
use App\Models\PpdbJalur;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

/**
 * Seleksi. Mekanismenya sepenuhnya dikonfigurasi sekolah: tiap jalur punya kuota,
 * kriteria berbobot (nama, bobot, nilai maksimum), dan nilai minimal opsional.
 * Skor = Σ(nilai/maks × bobot) ÷ Σbobot × 100. Sistem tidak menetapkan aturan
 * jarak, prestasi, dsb. — semuanya kriteria yang Anda beri nama sendiri.
 */
class PpdbSeleksiController extends Controller
{
    use PpdbHelpers;

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'jalur_id' => ['nullable', 'integer']]);
        $periode = PpdbPeriode::findOrFail($in['periode_id']);

        $peserta = PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')->get();
        $jalur = $periode->jalur()->when(! empty($in['jalur_id']), fn ($q) => $q->where('id', $in['jalur_id']))->get();

        return response()->json([
            'periode_id' => $periode->id,
            'pengumuman_terbit' => (bool) $periode->pengumuman_terbit_at,
            'belum_diverifikasi' => $peserta->where('status_verifikasi', '!=', 'diverifikasi')->count(),
            'jalur' => $jalur->map(function (PpdbJalur $j) use ($peserta) {
                $g = $peserta->where('ppdb_jalur_id', $j->id);

                return [
                    'id' => $j->id, 'nama' => $j->nama, 'aktif' => $j->aktif, 'kuota' => $j->kuota, 'kriteria' => $j->kriteria ?? [],
                    'nilai_minimal' => $j->nilai_minimal !== null ? (float) $j->nilai_minimal : null,
                    'terisi' => $this->terisi($g),
                    'pendaftar' => $g->count(),
                    'belum_diverifikasi' => $g->where('status_verifikasi', '!=', 'diverifikasi')->count(),
                    'peserta' => $this->ranking($g->where('status_verifikasi', 'diverifikasi')),
                ];
            })->values(),
        ]);
    }

    public function nilai(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $in = $request->validate(['nilai' => ['required', 'array'], 'nilai.*' => ['nullable', 'numeric']]);
        $this->pastikanBolehSeleksi($pendaftar);
        $jalur = $pendaftar->jalur;

        $nilai = [];
        foreach ($jalur->kriteria ?? [] as $k) {
            $v = $in['nilai'][$k['nama']] ?? null;
            if ($v === null || $v === '') {
                continue;
            }
            if ((float) $v < 0 || (float) $v > (float) $k['maks']) {
                throw ValidationException::withMessages(["nilai.{$k['nama']}" => "Nilai {$k['nama']} harus antara 0 dan {$k['maks']}."]);
            }
            $nilai[$k['nama']] = (float) $v;
        }
        $skor = $this->hitungSkor($jalur, $nilai);
        $sebelum = ['nilai' => $pendaftar->nilai_seleksi, 'skor' => $pendaftar->skor];
        $pendaftar->update(['nilai_seleksi' => $nilai ?: null, 'skor' => $skor]);
        $this->logPpdb($request, $pendaftar, 'seleksi_nilai', "Nilai seleksi {$this->labelPendaftar($pendaftar)} diperbarui (skor ".($skor ?? 'belum lengkap').').', ['sebelum' => ($sebelum['nilai'] ?? []) + ['skor' => $sebelum['skor']], 'sesudah' => $nilai + ['skor' => $skor]]);

        return response()->json($this->barisPeserta($pendaftar->fresh()));
    }

    /**
     * Proses seleksi otomatis per jalur sesuai kuota, kriteria, dan nilai minimal.
     * simpan=false hanya menghitung usulan; simpan=true menerapkannya.
     */
    public function proses(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'jalur_id' => ['nullable', 'integer'], 'simpan' => ['nullable', 'boolean']]);
        $periode = PpdbPeriode::findOrFail($in['periode_id']);
        $simpan = (bool) ($in['simpan'] ?? false);
        if ($simpan) {
            $this->pastikanPengumumanBelumTerbit($periode, 'menyimpan hasil seleksi');
        }

        $hasil = [];
        $peringatan = [];
        $ubah = 0;
        $jalurList = $periode->jalur()->where('aktif', true)->when(! empty($in['jalur_id']), fn ($q) => $q->where('id', $in['jalur_id']))->get();

        foreach ($jalurList as $jalur) {
            $semua = PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where('ppdb_jalur_id', $jalur->id)->where('status_pendaftaran', 'terdaftar')->where('status_verifikasi', 'diverifikasi')->get();
            // Yang sudah daftar ulang/diterima terkunci dan tetap memakai kuota.
            $terkunci = $semua->filter(fn ($p) => $p->status_daftar_ulang === 'sudah' || $p->status_penerimaan === 'diterima');
            $dinilai = $semua->diff($terkunci)->filter(fn ($p) => $p->skor !== null);
            $tanpaSkor = $semua->diff($terkunci)->filter(fn ($p) => $p->skor === null);
            if ($tanpaSkor->isNotEmpty()) {
                $peringatan[] = "Jalur {$jalur->nama}: {$tanpaSkor->count()} pendaftar terverifikasi belum memiliki skor lengkap dan tidak diproses.";
            }
            if (($jalur->kriteria ?? []) === []) {
                $peringatan[] = "Jalur {$jalur->nama}: belum memiliki kriteria seleksi, tidak dapat dihitung otomatis.";
                continue;
            }

            $sisa = max(0, $jalur->kuota - $terkunci->where('status_seleksi', 'lolos')->count());
            $urut = $dinilai->sortBy([['skor', 'desc'], ['created_at', 'asc'], ['id', 'asc']])->values();
            $lolos = 0;
            foreach ($urut as $i => $p) {
                $lulus = ($jalur->nilai_minimal === null || $p->skor >= (float) $jalur->nilai_minimal) && $lolos < $sisa;
                if ($lulus) {
                    $lolos++;
                }
                $baru = $lulus ? 'lolos' : 'tidak_lolos';
                $alasan = $lulus ? 'Masuk kuota' : ($jalur->nilai_minimal !== null && $p->skor < (float) $jalur->nilai_minimal ? 'Di bawah nilai minimal' : 'Di luar kuota');
                $sama = ($lolos === $sisa && $sisa > 0 && $i + 1 < $urut->count() && $urut[$i + 1]->skor === $p->skor && $lulus) ? true : false;
                if ($sama) {
                    $peringatan[] = "Jalur {$jalur->nama}: skor sama pada batas kuota ({$p->skor}); urutan ditentukan oleh waktu pendaftaran.";
                }
                $hasil[] = ['id' => $p->id, 'nomor_pendaftaran' => $p->nomor_pendaftaran, 'nama_lengkap' => $p->nama_lengkap, 'jalur' => $jalur->nama, 'skor' => $p->skor, 'peringkat' => $i + 1, 'status_lama' => $p->status_seleksi, 'status_baru' => $baru, 'alasan' => $alasan, 'berubah' => $p->status_seleksi !== $baru];

                if ($simpan && $p->status_seleksi !== $baru) {
                    $lama = $p->status_seleksi;
                    $p->update(['status_seleksi' => $baru, 'seleksi_oleh' => $request->user()?->id, 'tanggal_seleksi' => now(), 'catatan_seleksi' => "Seleksi otomatis: {$alasan}"]);
                    $this->logPpdb($request, $p, 'seleksi', "Hasil seleksi {$this->labelPendaftar($p)}: ".self::LABEL_SELEKSI[$baru]." ({$alasan}, skor {$p->skor}).", ['sebelum' => ['status_seleksi' => $lama], 'sesudah' => ['status_seleksi' => $baru, 'skor' => $p->skor], 'cara' => 'otomatis']);
                    $ubah++;
                }
            }
        }

        if ($simpan) {
            $this->logPpdb($request, $periode, 'seleksi', "Menyimpan hasil seleksi otomatis PPDB \"{$periode->nama}\" ({$ubah} perubahan).", ['perubahan' => $ubah]);
        }

        return response()->json([
            'disimpan' => $simpan,
            'jumlah' => count($hasil),
            'lolos' => collect($hasil)->where('status_baru', 'lolos')->count(),
            'tidak_lolos' => collect($hasil)->where('status_baru', 'tidak_lolos')->count(),
            'berubah' => collect($hasil)->where('berubah', true)->count(),
            'peringatan' => array_values(array_unique($peringatan)),
            'hasil' => $hasil,
        ]);
    }

    public function tandai(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $in = $request->validate([
            'status' => ['required', 'in:lolos,tidak_lolos,belum'],
            'catatan' => ['nullable', 'string', 'max:500'],
            'izinkan_melebihi_kuota' => ['nullable', 'boolean'],
        ]);
        $this->pastikanBolehSeleksi($pendaftar);
        if ($pendaftar->status_daftar_ulang === 'sudah') {
            throw ValidationException::withMessages(['status' => 'Pendaftar sudah daftar ulang. Batalkan daftar ulang terlebih dahulu untuk mengubah hasil seleksi.']);
        }

        $baru = $in['status'];
        if ($baru === 'lolos' && empty($in['izinkan_melebihi_kuota'])) {
            $jalur = $pendaftar->jalur;
            $g = PpdbPendaftar::where('ppdb_periode_id', $pendaftar->ppdb_periode_id)->where('status_pendaftaran', 'terdaftar')->where('id', '!=', $pendaftar->id)->get();
            $terisiJalur = $this->terisi($g->where('ppdb_jalur_id', $jalur->id));
            $terisiTotal = $this->terisi($g);
            if ($terisiJalur + 1 > $jalur->kuota) {
                throw ValidationException::withMessages(['status' => "Kuota jalur {$jalur->nama} ({$jalur->kuota}) sudah terisi. Konfirmasi untuk tetap meloloskan melebihi kuota."]);
            }
            if ($terisiTotal + 1 > $pendaftar->periode->kuota) {
                throw ValidationException::withMessages(['status' => "Kuota penerimaan PPDB ({$pendaftar->periode->kuota}) sudah terisi. Konfirmasi untuk tetap meloloskan melebihi kuota."]);
            }
        }

        $lama = $pendaftar->status_seleksi;
        $pendaftar->update([
            'status_seleksi' => $baru, 'catatan_seleksi' => $in['catatan'] ?? null,
            'seleksi_oleh' => $baru === 'belum' ? null : $request->user()?->id, 'tanggal_seleksi' => $baru === 'belum' ? null : now(),
        ]);
        $this->logPpdb($request, $pendaftar, 'seleksi', "Hasil seleksi {$this->labelPendaftar($pendaftar)}: ".self::LABEL_SELEKSI[$lama].' → '.self::LABEL_SELEKSI[$baru].'.', ['sebelum' => ['status_seleksi' => $lama], 'sesudah' => ['status_seleksi' => $baru], 'cara' => 'manual', 'catatan' => $in['catatan'] ?? null]);

        return response()->json($this->barisPeserta($pendaftar->fresh()));
    }

    public function riwayat(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id']]);
        $ids = PpdbPendaftar::where('ppdb_periode_id', $in['periode_id'])->pluck('id');

        return response()->json(
            Activity::where('log_name', self::LOG_PPDB)->whereIn('event', ['seleksi', 'seleksi_nilai'])
                ->where(fn ($q) => $q->where(fn ($w) => $w->where('subject_type', PpdbPendaftar::class)->whereIn('subject_id', $ids))->orWhere(fn ($w) => $w->where('subject_type', PpdbPeriode::class)->where('subject_id', $in['periode_id'])))
                ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(200)->get()
                ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at])
        );
    }

    // ------------------------------------------------------------- pembantu

    private function pastikanBolehSeleksi(PpdbPendaftar $p): void
    {
        $this->pastikanPengumumanBelumTerbit($p->periode, 'mengubah hasil seleksi');
        if ($p->status_pendaftaran !== 'terdaftar') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftaran ini dibatalkan.']);
        }
        if ($p->status_verifikasi !== 'diverifikasi') {
            throw ValidationException::withMessages(['pendaftar' => 'Hanya pendaftar yang sudah terverifikasi yang dapat diseleksi.']);
        }
        if ($p->status_penerimaan === 'diterima') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftar sudah diterima.']);
        }
    }

    /** Jumlah kursi terpakai: lolos yang daftar ulangnya tidak dibatalkan. */
    private function terisi(Collection $g): int
    {
        return $g->where('status_seleksi', 'lolos')->where('status_daftar_ulang', '!=', 'dibatalkan')->count();
    }

    private function ranking(Collection $peserta): array
    {
        $urut = $peserta->sortBy([[fn ($p) => $p->skor === null ? 1 : 0, 'asc'], ['skor', 'desc'], ['created_at', 'asc']])->values();
        $no = 0;

        return $urut->map(function (PpdbPendaftar $p) use (&$no) {
            $baris = $this->barisPeserta($p);
            $baris['peringkat'] = $p->skor !== null ? ++$no : null;

            return $baris;
        })->all();
    }

    private function barisPeserta(PpdbPendaftar $p): array
    {
        return [
            'id' => $p->id, 'nomor_pendaftaran' => $p->nomor_pendaftaran, 'nama_lengkap' => $p->nama_lengkap, 'jenis_kelamin' => $p->jenis_kelamin, 'sekolah_asal' => $p->sekolah_asal,
            'ppdb_jalur_id' => $p->ppdb_jalur_id, 'nilai_seleksi' => $p->nilai_seleksi ?? (object) [], 'skor' => $p->skor,
            'status_seleksi' => $p->status_seleksi, 'status_seleksi_label' => self::LABEL_SELEKSI[$p->status_seleksi], 'catatan_seleksi' => $p->catatan_seleksi,
            'status_daftar_ulang' => $p->status_daftar_ulang, 'terkunci' => $p->status_daftar_ulang === 'sudah' || $p->status_penerimaan === 'diterima',
        ];
    }
}

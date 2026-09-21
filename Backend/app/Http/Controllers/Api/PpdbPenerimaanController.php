<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PpdbHelpers;
use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use App\Models\PpdbPersyaratan;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

/**
 * Daftar ulang dan peserta diterima (konversi menjadi Data Siswa).
 * Syarat diterima: lolos seleksi + daftar ulang sudah dikonfirmasi.
 */
class PpdbPenerimaanController extends Controller
{
    use PpdbHelpers;

    // ------------------------------------------------------------ daftar ulang

    public function daftarUlang(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'status' => ['nullable', 'in:belum,sudah,dibatalkan'], 'jalur_id' => ['nullable', 'integer'], 'search' => ['nullable', 'string', 'max:100']]);
        $periode = PpdbPeriode::findOrFail($in['periode_id']);
        $lolos = PpdbPendaftar::with(['jalur:id,nama'])->where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')->where('status_seleksi', 'lolos')->orderBy('nomor_pendaftaran')->get();
        $persyaratan = PpdbPersyaratan::where('ppdb_periode_id', $periode->id)->where('tahap', 'daftar_ulang')->orderBy('urutan')->orderBy('id')->get();
        $petugas = DB::table('users')->whereIn('id', $lolos->pluck('petugas_daftar_ulang_id')->filter())->pluck('name', 'id');

        $baris = $lolos
            ->when(! empty($in['status']), fn ($c) => $c->where('status_daftar_ulang', $in['status']))
            ->when(! empty($in['jalur_id']), fn ($c) => $c->where('ppdb_jalur_id', (int) $in['jalur_id']))
            ->when(! empty($in['search']), fn ($c) => $c->filter(fn ($p) => str_contains(mb_strtolower($p->nama_lengkap.' '.$p->nomor_pendaftaran), mb_strtolower($in['search']))))
            ->map(function (PpdbPendaftar $p) use ($persyaratan, $petugas) {
                $butir = $this->persyaratanDaftarUlang($persyaratan, $p);
                $cek = $p->checklist_daftar_ulang ?? [];

                return [
                    'id' => $p->id, 'nomor_pendaftaran' => $p->nomor_pendaftaran, 'nama_lengkap' => $p->nama_lengkap, 'jalur' => $p->jalur?->nama, 'no_hp' => $p->no_hp ?: $p->telepon_orang_tua,
                    'status_seleksi_label' => self::LABEL_SELEKSI[$p->status_seleksi],
                    'status_daftar_ulang' => $p->status_daftar_ulang, 'status_daftar_ulang_label' => self::LABEL_DAFTAR_ULANG[$p->status_daftar_ulang],
                    'tanggal_daftar_ulang' => $p->tanggal_daftar_ulang, 'petugas' => $petugas[$p->petugas_daftar_ulang_id] ?? null, 'catatan' => $p->catatan_daftar_ulang,
                    'checklist' => $cek, 'persyaratan' => $butir->map(fn ($r) => ['id' => $r->id, 'nama' => $r->nama, 'wajib' => $r->wajib, 'terpenuhi' => (bool) ($cek[$r->id] ?? false)])->values(),
                    'kelengkapan' => ['terpenuhi' => $butir->filter(fn ($r) => ! empty($cek[$r->id]))->count(), 'total' => $butir->count()],
                    'diterima' => $p->status_penerimaan === 'diterima',
                ];
            })->values();

        $batas = $periode->daftar_ulang_selesai ? Carbon::parse($periode->daftar_ulang_selesai) : null;

        return response()->json([
            'terbit' => (bool) $periode->pengumuman_terbit_at,
            'mulai' => $periode->daftar_ulang_mulai ? substr((string) $periode->daftar_ulang_mulai, 0, 10) : null,
            'batas' => $batas?->toDateString(),
            'terlambat' => $batas ? Carbon::today()->gt($batas) : false,
            'sisa_hari' => $batas ? (int) Carbon::today()->diffInDays($batas, false) : null,
            'ringkasan' => [
                'lolos' => $lolos->count(), 'sudah' => $lolos->where('status_daftar_ulang', 'sudah')->count(),
                'belum' => $lolos->where('status_daftar_ulang', 'belum')->count(), 'dibatalkan' => $lolos->where('status_daftar_ulang', 'dibatalkan')->count(),
            ],
            'persyaratan' => $persyaratan->map(fn ($r) => ['id' => $r->id, 'nama' => $r->nama, 'wajib' => $r->wajib, 'ppdb_jalur_id' => $r->ppdb_jalur_id])->values(),
            'data' => $baris,
        ]);
    }

    public function konfirmasiDaftarUlang(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $in = $request->validate(['checklist' => ['nullable', 'array'], 'checklist.*' => ['boolean'], 'catatan' => ['nullable', 'string', 'max:500'], 'izinkan_terlambat' => ['nullable', 'boolean']]);
        $periode = $this->pastikanBolehDaftarUlang($pendaftar);
        if ($pendaftar->status_daftar_ulang === 'sudah') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftar ini sudah daftar ulang.']);
        }
        if ($periode->daftar_ulang_selesai && Carbon::today()->gt(Carbon::parse($periode->daftar_ulang_selesai)) && empty($in['izinkan_terlambat'])) {
            throw ValidationException::withMessages(['pendaftar' => 'Batas waktu daftar ulang ('.substr((string) $periode->daftar_ulang_selesai, 0, 10).') sudah lewat. Konfirmasi untuk tetap menerima daftar ulang terlambat.']);
        }

        $butir = $this->persyaratanDaftarUlang(PpdbPersyaratan::where('ppdb_periode_id', $periode->id)->where('tahap', 'daftar_ulang')->get(), $pendaftar);
        $cek = [];
        foreach ($butir as $r) {
            $cek[$r->id] = (bool) ($in['checklist'][$r->id] ?? false);
        }
        $kurang = $butir->where('wajib', true)->filter(fn ($r) => ! $cek[$r->id])->pluck('nama');
        if ($kurang->isNotEmpty()) {
            throw ValidationException::withMessages(['checklist' => 'Dokumen wajib belum lengkap: '.$kurang->implode(', ').'.']);
        }

        $terlambat = $periode->daftar_ulang_selesai && Carbon::today()->gt(Carbon::parse($periode->daftar_ulang_selesai));
        $lamaDu = $pendaftar->status_daftar_ulang;
        $pendaftar->update([
            'status_daftar_ulang' => 'sudah', 'checklist_daftar_ulang' => $cek, 'tanggal_daftar_ulang' => now(),
            'catatan_daftar_ulang' => $in['catatan'] ?? null, 'petugas_daftar_ulang_id' => $request->user()?->id,
        ]);
        $this->logPpdb($request, $pendaftar, 'daftar_ulang', "Daftar ulang {$this->labelPendaftar($pendaftar)} dikonfirmasi".($terlambat ? ' (terlambat).' : '.'), ['checklist' => $cek, 'catatan' => $in['catatan'] ?? null, 'terlambat' => (bool) $terlambat, 'sebelum' => ['status_daftar_ulang' => $lamaDu], 'sesudah' => ['status_daftar_ulang' => 'sudah']]);

        return response()->json(['message' => 'Daftar ulang dikonfirmasi.']);
    }

    public function batalDaftarUlang(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $in = $request->validate(['catatan' => ['required', 'string', 'min:3', 'max:500']]);
        $this->pastikanBolehDaftarUlang($pendaftar);
        if ($pendaftar->status_daftar_ulang === 'dibatalkan') {
            throw ValidationException::withMessages(['pendaftar' => 'Daftar ulang sudah dibatalkan.']);
        }
        $lama = $pendaftar->status_daftar_ulang;
        $pendaftar->update(['status_daftar_ulang' => 'dibatalkan', 'catatan_daftar_ulang' => $in['catatan'], 'petugas_daftar_ulang_id' => $request->user()?->id]);
        $this->logPpdb($request, $pendaftar, 'daftar_ulang', "Daftar ulang {$this->labelPendaftar($pendaftar)} dibatalkan (sebelumnya: ".self::LABEL_DAFTAR_ULANG[$lama].'). Kursi dilepas.', ['catatan' => $in['catatan'], 'sebelum' => ['status_daftar_ulang' => $lama], 'sesudah' => ['status_daftar_ulang' => 'dibatalkan']]);

        return response()->json(['message' => 'Daftar ulang dibatalkan. Kursi tersedia kembali untuk peserta lain.']);
    }

    public function bukaKembaliDaftarUlang(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $this->pastikanBolehDaftarUlang($pendaftar);
        if ($pendaftar->status_daftar_ulang !== 'dibatalkan') {
            throw ValidationException::withMessages(['pendaftar' => 'Hanya daftar ulang yang dibatalkan yang dapat dibuka kembali.']);
        }
        $pendaftar->update(['status_daftar_ulang' => 'belum', 'checklist_daftar_ulang' => null, 'tanggal_daftar_ulang' => null]);
        $this->logPpdb($request, $pendaftar, 'daftar_ulang', "Daftar ulang {$this->labelPendaftar($pendaftar)} dibuka kembali (belum daftar ulang).", ['sebelum' => ['status_daftar_ulang' => 'dibatalkan'], 'sesudah' => ['status_daftar_ulang' => 'belum']]);

        return response()->json(['message' => 'Status kembali menjadi belum daftar ulang.']);
    }

    /** Pesan pengingat daftar ulang (siap kirim). */
    public function pengingat(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $periode = $this->pastikanBolehDaftarUlang($pendaftar);
        $sekolah = tenant()->nama_sekolah ?: 'sekolah';
        $fmt = fn ($d) => $d ? Carbon::parse($d)->locale('id')->translatedFormat('d F Y') : '-';
        $pesan = "Yth. Orang tua/wali {$pendaftar->nama_lengkap},\n\nPengingat daftar ulang {$periode->nama} {$sekolah}. Batas daftar ulang: ".$fmt($periode->daftar_ulang_selesai).".\nMohon membawa dokumen persyaratan daftar ulang.\n\nTerima kasih.";
        $this->logPpdb($request, $pendaftar, 'notifikasi', "Pengingat daftar ulang {$this->labelPendaftar($pendaftar)} disiapkan.");
        $d = preg_replace('/\D+/', '', (string) ($pendaftar->no_hp ?: $pendaftar->telepon_orang_tua));
        $wa = $d === '' ? null : (str_starts_with($d, '0') ? '62'.substr($d, 1) : $d);

        return response()->json([
            'pesan' => $pesan,
            'whatsapp' => $wa ? 'https://wa.me/'.$wa.'?text='.rawurlencode($pesan) : null,
            'email' => $pendaftar->email ? 'mailto:'.$pendaftar->email.'?subject='.rawurlencode('Pengingat Daftar Ulang').'&body='.rawurlencode($pesan) : null,
        ]);
    }

    public function riwayatDaftarUlang(Request $request): JsonResponse
    {
        return $this->riwayat($request, ['daftar_ulang']);
    }

    // -------------------------------------------------------------- penerimaan

    public function penerimaan(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'status' => ['nullable', 'in:belum,diterima,diimpor'], 'search' => ['nullable', 'string', 'max:100']]);
        $periode = PpdbPeriode::with('tahunAjaran:id,nama')->findOrFail($in['periode_id']);
        $layak = PpdbPendaftar::with(['jalur:id,nama', 'kelas:id,nama_kelas'])->where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')
            ->where('status_seleksi', 'lolos')->where('status_daftar_ulang', 'sudah')->orderBy('nomor_pendaftaran')->get();

        $baris = $layak
            ->when(($in['status'] ?? null) === 'belum', fn ($c) => $c->where('status_penerimaan', 'belum'))
            ->when(($in['status'] ?? null) === 'diterima', fn ($c) => $c->where('status_penerimaan', 'diterima')->whereNull('siswa_id'))
            ->when(($in['status'] ?? null) === 'diimpor', fn ($c) => $c->whereNotNull('siswa_id'))
            ->when(! empty($in['search']), fn ($c) => $c->filter(fn ($p) => str_contains(mb_strtolower($p->nama_lengkap.' '.$p->nomor_pendaftaran), mb_strtolower($in['search']))))
            ->map(fn (PpdbPendaftar $p) => [
                'id' => $p->id, 'nomor_pendaftaran' => $p->nomor_pendaftaran, 'nama_lengkap' => $p->nama_lengkap, 'jenis_kelamin' => $p->jenis_kelamin, 'jalur' => $p->jalur?->nama,
                'nisn' => $p->nisn, 'tanggal_daftar_ulang' => $p->tanggal_daftar_ulang,
                'status_penerimaan' => $p->status_penerimaan, 'tanggal_diterima' => $p->tanggal_diterima, 'nis_terbit' => $p->nis_terbit, 'tahun_masuk_terbit' => $p->tahun_masuk_terbit,
                'kelas_id' => $p->kelas_id, 'kelas' => $p->kelas?->nama_kelas, 'siswa_id' => $p->siswa_id, 'tanggal_import' => $p->tanggal_import,
                'status_akhir' => $p->siswa_id ? 'diimpor' : ($p->status_penerimaan === 'diterima' ? 'diterima' : 'belum'),
            ])->values();

        return response()->json([
            'tahun_masuk_default' => (int) (substr((string) $periode->tahunAjaran?->nama, 0, 4) ?: date('Y')),
            'ringkasan' => [
                'layak' => $layak->count(), 'diterima' => $layak->where('status_penerimaan', 'diterima')->count(),
                'diimpor' => $layak->whereNotNull('siswa_id')->count(), 'belum' => $layak->where('status_penerimaan', 'belum')->count(),
            ],
            'kelas' => $this->opsiKelas($periode),
            'data' => $baris,
        ]);
    }

    /**
     * Konfirmasi penerimaan: tetapkan tahun masuk, NIS, dan penempatan rombel.
     * penempatan: tanpa | manual (kelas_id) | otomatis (mengisi kelas_ids berurutan sampai kapasitas).
     */
    public function terima(Request $request): JsonResponse
    {
        $in = $request->validate([
            'periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'],
            'ids' => ['required', 'array', 'min:1', 'max:1000'], 'ids.*' => ['integer'],
            'tahun_masuk' => ['required', 'integer', 'min:1990', 'max:2100'],
            'penempatan' => ['required', 'in:tanpa,manual,otomatis'],
            'kelas_id' => ['nullable', 'integer', 'required_if:penempatan,manual'],
            'kelas_ids' => ['nullable', 'array', 'required_if:penempatan,otomatis'], 'kelas_ids.*' => ['integer'],
        ]);
        $periode = PpdbPeriode::findOrFail($in['periode_id']);
        $peserta = PpdbPendaftar::where('ppdb_periode_id', $periode->id)->whereIn('id', $in['ids'])->where('status_pendaftaran', 'terdaftar')
            ->where('status_seleksi', 'lolos')->where('status_daftar_ulang', 'sudah')->where('status_penerimaan', 'belum')->orderBy('nomor_pendaftaran')->get();
        if ($peserta->isEmpty()) {
            throw ValidationException::withMessages(['ids' => 'Tidak ada peserta yang memenuhi syarat (lolos seleksi, sudah daftar ulang, belum diterima).']);
        }

        // Rencana penempatan sebelum menulis apa pun, agar gagal secara utuh.
        $penempatan = [];
        if ($in['penempatan'] !== 'tanpa') {
            $daftarKelas = $this->opsiKelas($periode)->keyBy('id');
            $ids = $in['penempatan'] === 'manual' ? [(int) $in['kelas_id']] : array_map('intval', $in['kelas_ids']);
            foreach ($ids as $kid) {
                if (! $daftarKelas->has($kid)) {
                    throw ValidationException::withMessages(['kelas_id' => 'Rombel tidak termasuk tahun ajaran PPDB ini.']);
                }
            }
            $sisa = collect($ids)->mapWithKeys(fn ($kid) => [$kid => $daftarKelas[$kid]['sisa']])->all();
            $i = 0;
            foreach ($peserta as $p) {
                while ($i < count($ids) && $sisa[$ids[$i]] !== null && $sisa[$ids[$i]] <= 0) {
                    $i++;
                }
                if ($i >= count($ids)) {
                    throw ValidationException::withMessages(['kelas_id' => 'Kapasitas rombel terpilih tidak cukup untuk '.$peserta->count().' peserta.']);
                }
                $penempatan[$p->id] = $ids[$i];
                if ($sisa[$ids[$i]] !== null) {
                    $sisa[$ids[$i]]--;
                }
            }
        }

        DB::transaction(function () use ($peserta, $in, $penempatan, $request) {
            $urutan = $this->urutanNisTerakhir((int) $in['tahun_masuk']);
            foreach ($peserta as $p) {
                $nis = sprintf('%d%04d', $in['tahun_masuk'], ++$urutan);
                while (Siswa::where('nis', $nis)->exists() || PpdbPendaftar::where('nis_terbit', $nis)->exists()) {
                    $nis = sprintf('%d%04d', $in['tahun_masuk'], ++$urutan);
                }
                $p->update([
                    'status_penerimaan' => 'diterima', 'tanggal_diterima' => now(), 'nis_terbit' => $nis,
                    'tahun_masuk_terbit' => $in['tahun_masuk'], 'kelas_id' => $penempatan[$p->id] ?? null,
                ]);
                $this->logPpdb($request, $p, 'penerimaan', "Penerimaan {$this->labelPendaftar($p)} dikonfirmasi (NIS {$nis}".(isset($penempatan[$p->id]) ? ', rombel '.Kelas::whereKey($penempatan[$p->id])->value('nama_kelas') : '').').', ['nis' => $nis, 'tahun_masuk' => $in['tahun_masuk'], 'kelas_id' => $penempatan[$p->id] ?? null, 'sebelum' => ['status_penerimaan' => 'belum', 'nis_terbit' => null, 'kelas_id' => null], 'sesudah' => ['status_penerimaan' => 'diterima', 'nis_terbit' => $nis, 'tahun_masuk' => $in['tahun_masuk'], 'kelas_id' => $penempatan[$p->id] ?? null]]);
            }
        });

        return response()->json(['message' => "{$peserta->count()} peserta dikonfirmasi diterima.", 'jumlah' => $peserta->count()]);
    }

    public function batalTerima(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer']]);
        $peserta = PpdbPendaftar::where('ppdb_periode_id', $in['periode_id'])->whereIn('id', $in['ids'])->where('status_penerimaan', 'diterima')->whereNull('siswa_id')->get();
        if ($peserta->isEmpty()) {
            throw ValidationException::withMessages(['ids' => 'Tidak ada peserta yang dapat dibatalkan (yang sudah diimpor ke Data Siswa dikelola dari Data Siswa).']);
        }
        foreach ($peserta as $p) {
            $lamaTerima = ['status_penerimaan' => 'diterima', 'nis_terbit' => $p->nis_terbit, 'kelas_id' => $p->kelas_id];
            $p->update(['status_penerimaan' => 'belum', 'tanggal_diterima' => null, 'nis_terbit' => null, 'tahun_masuk_terbit' => null, 'kelas_id' => null]);
            $this->logPpdb($request, $p, 'penerimaan', "Konfirmasi penerimaan {$this->labelPendaftar($p)} dibatalkan.", ['sebelum' => $lamaTerima, 'sesudah' => ['status_penerimaan' => 'belum', 'nis_terbit' => null, 'kelas_id' => null]]);
        }

        return response()->json(['message' => "{$peserta->count()} konfirmasi penerimaan dibatalkan."]);
    }

    /** Import peserta yang sudah diterima menjadi Data Siswa resmi. */
    public function import(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'ids' => ['required', 'array', 'min:1', 'max:1000'], 'ids.*' => ['integer']]);
        $peserta = PpdbPendaftar::where('ppdb_periode_id', $in['periode_id'])->whereIn('id', $in['ids'])->where('status_penerimaan', 'diterima')->whereNull('siswa_id')->orderBy('nomor_pendaftaran')->get();
        if ($peserta->isEmpty()) {
            throw ValidationException::withMessages(['ids' => 'Tidak ada peserta berstatus diterima yang belum diimpor.']);
        }

        $berhasil = 0;
        $gagal = [];
        foreach ($peserta as $p) {
            try {
                DB::transaction(function () use ($p, $request) {
                    if (Siswa::where('nis', $p->nis_terbit)->exists()) {
                        throw new \RuntimeException("NIS {$p->nis_terbit} sudah dipakai siswa lain.");
                    }
                    if ($p->nisn && Siswa::where('nisn', $p->nisn)->exists()) {
                        throw new \RuntimeException("NISN {$p->nisn} sudah terdaftar di Data Siswa.");
                    }
                    $siswa = Siswa::create([
                        'kelas_id' => $p->kelas_id, 'tahun_masuk' => $p->tahun_masuk_terbit, 'nis' => $p->nis_terbit, 'nisn' => $p->nisn,
                        'nama' => $p->nama_lengkap, 'jenis_kelamin' => $p->jenis_kelamin, 'tempat_lahir' => $p->tempat_lahir,
                        'tanggal_lahir' => $p->tanggal_lahir, 'alamat' => $p->alamat, 'status' => 'aktif',
                    ]);
                    $p->update(['siswa_id' => $siswa->id, 'tanggal_import' => now()]);
                    $this->logPpdb($request, $p, 'import', "{$this->labelPendaftar($p)} diimpor ke Data Siswa (NIS {$siswa->nis}).", ['siswa_id' => $siswa->id, 'nis' => $siswa->nis, 'sebelum' => ['siswa_id' => null], 'sesudah' => ['siswa_id' => $siswa->id, 'nis' => $siswa->nis]]);
                });
                $berhasil++;
            } catch (\Throwable $e) {
                $gagal[] = ['id' => $p->id, 'nama' => $p->nama_lengkap, 'alasan' => $e->getMessage()];
            }
        }

        return response()->json(['berhasil' => $berhasil, 'gagal' => $gagal, 'message' => "{$berhasil} peserta diimpor ke Data Siswa".($gagal ? ', '.count($gagal).' gagal.' : '.')]);
    }

    public function riwayatPenerimaan(Request $request): JsonResponse
    {
        return $this->riwayat($request, ['penerimaan', 'import']);
    }

    // ------------------------------------------------------------- pembantu

    private function pastikanBolehDaftarUlang(PpdbPendaftar $p): PpdbPeriode
    {
        $periode = $p->periode;
        if (! $periode->pengumuman_terbit_at) {
            throw ValidationException::withMessages(['pendaftar' => 'Daftar ulang baru dapat diproses setelah pengumuman diterbitkan.']);
        }
        if ($p->status_pendaftaran !== 'terdaftar' || $p->status_seleksi !== 'lolos') {
            throw ValidationException::withMessages(['pendaftar' => 'Hanya peserta yang dinyatakan lolos yang dapat daftar ulang.']);
        }
        if ($p->status_penerimaan === 'diterima') {
            throw ValidationException::withMessages(['pendaftar' => 'Peserta sudah diterima; batalkan konfirmasi penerimaan terlebih dahulu.']);
        }

        return $periode;
    }

    /** @return Collection<int, PpdbPersyaratan> */
    private function persyaratanDaftarUlang(Collection $semua, PpdbPendaftar $p): Collection
    {
        return $semua->filter(fn ($r) => $r->ppdb_jalur_id === null || $r->ppdb_jalur_id === $p->ppdb_jalur_id)->values();
    }

    /** Rombel tahun ajaran PPDB beserta sisa kapasitas (null = tanpa batas). */
    private function opsiKelas(PpdbPeriode $periode): Collection
    {
        $kelas = Kelas::where(fn ($q) => $q->where('tahun_ajaran_id', $periode->tahun_ajaran_id)->orWhere('tahun_ajaran', $periode->tahunAjaran?->nama))
            ->when($periode->jenjang, fn ($q) => $q->where(fn ($w) => $w->whereNull('jenjang')->orWhere('jenjang', $periode->jenjang)))
            ->where('status', 'aktif')->orderBy('nama_kelas')->get();
        $terisi = Siswa::whereIn('kelas_id', $kelas->pluck('id'))->where('status', 'aktif')->selectRaw('kelas_id, count(*) as n')->groupBy('kelas_id')->pluck('n', 'kelas_id');
        $dipesan = PpdbPendaftar::whereIn('kelas_id', $kelas->pluck('id'))->where('status_penerimaan', 'diterima')->whereNull('siswa_id')->selectRaw('kelas_id, count(*) as n')->groupBy('kelas_id')->pluck('n', 'kelas_id');

        return $kelas->map(function (Kelas $k) use ($terisi, $dipesan) {
            $pakai = (int) ($terisi[$k->id] ?? 0) + (int) ($dipesan[$k->id] ?? 0);

            return ['id' => $k->id, 'nama_kelas' => $k->nama_kelas, 'tingkat' => $k->tingkat, 'kapasitas' => $k->kapasitas, 'terisi' => $pakai, 'sisa' => $k->kapasitas ? max(0, $k->kapasitas - $pakai) : null];
        })->values();
    }

    /** Nomor urut NIS terbesar untuk awalan tahun masuk (dari siswa dan NIS yang sudah diterbitkan). */
    private function urutanNisTerakhir(int $tahun): int
    {
        $awalan = (string) $tahun;
        $maks = 0;
        foreach ([Siswa::where('nis', 'like', $awalan.'%')->pluck('nis'), PpdbPendaftar::where('nis_terbit', 'like', $awalan.'%')->pluck('nis_terbit')] as $daftar) {
            foreach ($daftar as $nis) {
                if (preg_match('/^'.$awalan.'(\d{4})$/', (string) $nis, $m)) {
                    $maks = max($maks, (int) $m[1]);
                }
            }
        }

        return $maks;
    }

    private function riwayat(Request $request, array $event): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id']]);
        $ids = PpdbPendaftar::where('ppdb_periode_id', $in['periode_id'])->pluck('id');

        return response()->json(
            Activity::where('log_name', self::LOG_PPDB)->where('subject_type', PpdbPendaftar::class)->whereIn('subject_id', $ids)->whereIn('event', $event)
                ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(200)->get()
                ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at])
        );
    }
}

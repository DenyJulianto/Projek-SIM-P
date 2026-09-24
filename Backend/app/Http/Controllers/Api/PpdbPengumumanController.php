<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PpdbHelpers;
use App\Http\Controllers\Controller;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pengumuman hasil seleksi. Publikasi mengunci hasil seleksi; kelulusan yang
 * diumumkan = status seleksi "lolos", selain itu "tidak lolos".
 * Notifikasi hasil berupa pesan siap kirim (WhatsApp/email) yang dicatat
 * waktunya — sistem tidak mengirim pesan sendiri karena tidak ada gateway terpasang.
 */
class PpdbPengumumanController extends Controller
{
    use PpdbHelpers;

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'jalur_id' => ['nullable', 'integer'], 'status' => ['nullable', 'in:lolos,tidak_lolos'], 'search' => ['nullable', 'string', 'max:100']]);
        $periode = PpdbPeriode::with('tahunAjaran:id,nama')->findOrFail($in['periode_id']);
        $semua = PpdbPendaftar::with('jalur:id,nama')->where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')->orderBy('nomor_pendaftaran')->get();

        $baris = $semua
            ->when(! empty($in['jalur_id']), fn ($c) => $c->where('ppdb_jalur_id', (int) $in['jalur_id']))
            ->when(! empty($in['search']), fn ($c) => $c->filter(fn ($p) => str_contains(mb_strtolower($p->nama_lengkap.' '.$p->nomor_pendaftaran), mb_strtolower($in['search']))))
            ->map(fn (PpdbPendaftar $p) => $this->baris($p))
            ->when(! empty($in['status']), fn ($c) => $c->where('kelulusan', $in['status']))
            ->values();

        $tertunda = $semua->whereIn('status_verifikasi', ['belum', 'perlu_perbaikan'])->count();
        $belumDiputuskan = $semua->where('status_verifikasi', 'diverifikasi')->where('status_seleksi', 'belum')->count();

        return response()->json([
            'periode' => [
                'id' => $periode->id, 'nama' => $periode->nama, 'tahun_ajaran' => $periode->tahunAjaran?->nama, 'status' => $periode->status,
                'jadwal_pengumuman' => $periode->jadwal_pengumuman ? substr((string) $periode->jadwal_pengumuman, 0, 10) : null,
                'daftar_ulang_mulai' => $periode->daftar_ulang_mulai ? substr((string) $periode->daftar_ulang_mulai, 0, 10) : null,
                'daftar_ulang_selesai' => $periode->daftar_ulang_selesai ? substr((string) $periode->daftar_ulang_selesai, 0, 10) : null,
            ],
            'terbit' => (bool) $periode->pengumuman_terbit_at,
            'terbit_at' => $periode->pengumuman_terbit_at,
            'ringkasan' => [
                'lolos' => $semua->where('status_seleksi', 'lolos')->count(),
                'tidak_lolos' => $semua->count() - $semua->where('status_seleksi', 'lolos')->count(),
                'belum_diputuskan' => $belumDiputuskan,
                'verifikasi_tertunda' => $tertunda,
            ],
            'siap_terbit' => $tertunda === 0 && $belumDiputuskan === 0 && $semua->where('status_seleksi', 'lolos')->isNotEmpty(),
            'kendala' => array_values(array_filter([
                $tertunda ? "{$tertunda} pendaftar belum selesai diverifikasi (belum diverifikasi/perlu perbaikan)." : null,
                $belumDiputuskan ? "{$belumDiputuskan} pendaftar terverifikasi belum memiliki hasil seleksi." : null,
                $semua->where('status_seleksi', 'lolos')->isEmpty() ? 'Belum ada peserta yang dinyatakan lolos.' : null,
            ])),
            'data' => $baris,
        ]);
    }

    public function terbitkan(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'tanggal_pengumuman' => ['nullable', 'date']]);
        $periode = PpdbPeriode::findOrFail($in['periode_id']);
        $this->pastikanPengumumanBelumTerbit($periode, 'menerbitkan ulang');

        $semua = PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')->get();
        $masalah = [];
        if ($n = $semua->whereIn('status_verifikasi', ['belum', 'perlu_perbaikan'])->count()) {
            $masalah[] = "{$n} pendaftar belum selesai diverifikasi";
        }
        if ($n = $semua->where('status_verifikasi', 'diverifikasi')->where('status_seleksi', 'belum')->count()) {
            $masalah[] = "{$n} pendaftar terverifikasi belum memiliki hasil seleksi";
        }
        if ($semua->where('status_seleksi', 'lolos')->isEmpty()) {
            $masalah[] = 'belum ada peserta lolos';
        }
        if ($masalah) {
            throw ValidationException::withMessages(['periode_id' => 'Pengumuman belum dapat diterbitkan: '.implode('; ', $masalah).'.']);
        }

        $statusLama = $periode->status;
        $data = ['pengumuman_terbit_at' => now(), 'pengumuman_terbit_oleh' => $request->user()?->id];
        if (! empty($in['tanggal_pengumuman'])) {
            $data['jadwal_pengumuman'] = $in['tanggal_pengumuman'];
        }
        if (in_array($periode->status, ['draft', 'dibuka', 'ditutup', 'seleksi'], true)) {
            $data['status'] = 'pengumuman';
        }
        $periode->update($data);
        $this->logPpdb($request, $periode, 'pengumuman', "Menerbitkan pengumuman hasil seleksi PPDB \"{$periode->nama}\".", ['lolos' => $semua->where('status_seleksi', 'lolos')->count(), 'tidak_lolos' => $semua->where('status_seleksi', '!=', 'lolos')->count(), 'sebelum' => ['pengumuman_terbit' => false, 'status' => $statusLama], 'sesudah' => ['pengumuman_terbit' => true, 'status' => $data['status'] ?? $statusLama]]);

        return response()->json(['message' => 'Pengumuman hasil seleksi diterbitkan. Hasil seleksi kini terkunci.']);
    }

    public function batalkan(Request $request): JsonResponse
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'alasan' => ['required', 'string', 'min:5', 'max:500']]);
        $periode = PpdbPeriode::findOrFail($in['periode_id']);
        if (! $periode->pengumuman_terbit_at) {
            throw ValidationException::withMessages(['periode_id' => 'Pengumuman belum diterbitkan.']);
        }
        if (PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where(fn ($q) => $q->where('status_daftar_ulang', 'sudah')->orWhere('status_penerimaan', 'diterima'))->exists()) {
            throw ValidationException::withMessages(['periode_id' => 'Sudah ada peserta yang daftar ulang atau diterima; publikasi tidak dapat dibatalkan.']);
        }
        $periode->update(['pengumuman_terbit_at' => null, 'pengumuman_terbit_oleh' => null, 'status' => 'seleksi']);
        $this->logPpdb($request, $periode, 'pengumuman', "Membatalkan publikasi pengumuman PPDB \"{$periode->nama}\".", ['alasan' => $in['alasan'], 'sebelum' => ['pengumuman_terbit' => true], 'sesudah' => ['pengumuman_terbit' => false, 'status' => 'seleksi']]);

        return response()->json(['message' => 'Publikasi pengumuman dibatalkan. Hasil seleksi dapat diubah kembali.']);
    }

    /** PDF daftar hasil seleksi (harus sudah diterbitkan). */
    public function pdf(Request $request): Response
    {
        $in = $request->validate(['periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'], 'status' => ['nullable', 'in:lolos,tidak_lolos'], 'jalur_id' => ['nullable', 'integer']]);
        $periode = PpdbPeriode::with('tahunAjaran:id,nama')->findOrFail($in['periode_id']);
        $this->pastikanTerbit($periode);

        $baris = PpdbPendaftar::with('jalur:id,nama')->where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')
            ->when(! empty($in['jalur_id']), fn ($q) => $q->where('ppdb_jalur_id', $in['jalur_id']))->orderBy('nomor_pendaftaran')->get()
            ->map(fn (PpdbPendaftar $p) => $this->baris($p))
            ->when(! empty($in['status']), fn ($c) => $c->where('kelulusan', $in['status']))->values();

        return Pdf::loadView('ppdb.hasil', [
            'sekolah' => tenant()->nama_sekolah ?: 'Sekolah', 'periode' => $periode, 'baris' => $baris, 'filter' => $in['status'] ?? null,
            'tanggal' => $periode->jadwal_pengumuman ? Carbon::parse($periode->jadwal_pengumuman)->locale('id')->translatedFormat('d F Y') : ($periode->pengumuman_terbit_at?->locale('id')->translatedFormat('d F Y') ?? '-'),
        ])->setPaper('a4', 'portrait')->download('hasil-seleksi-ppdb-'.$periode->id.'.pdf');
    }

    /** Surat hasil seleksi per pendaftar. */
    public function surat(PpdbPendaftar $pendaftar): Response
    {
        $periode = $pendaftar->periode->load('tahunAjaran:id,nama');
        $this->pastikanTerbit($periode);
        $hari = fn ($d) => $d ? Carbon::parse($d)->locale('id')->translatedFormat('d F Y') : '-';

        return Pdf::loadView('ppdb.surat', [
            'sekolah' => tenant()->nama_sekolah ?: 'Sekolah', 'p' => $pendaftar->load('jalur:id,nama'), 'periode' => $periode,
            'lolos' => $pendaftar->status_seleksi === 'lolos',
            'tanggal' => $hari($periode->jadwal_pengumuman ?? $periode->pengumuman_terbit_at),
            'daftarUlang' => $hari($periode->daftar_ulang_mulai).' s.d. '.$hari($periode->daftar_ulang_selesai),
        ])->setPaper('a4', 'portrait')->download('surat-hasil-seleksi-'.$pendaftar->nomor_pendaftaran.'.pdf');
    }

    /** Menyusun pesan hasil seleksi dan mencatat bahwa pemberitahuan disiapkan/dikirim. */
    public function notifikasi(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $periode = $pendaftar->periode;
        $this->pastikanTerbit($periode);
        $sekolah = tenant()->nama_sekolah ?: 'sekolah';
        $lolos = $pendaftar->status_seleksi === 'lolos';
        $pesan = "Yth. Orang tua/wali {$pendaftar->nama_lengkap} (No. Pendaftaran {$pendaftar->nomor_pendaftaran}),\n\n"
            ."Hasil seleksi {$periode->nama} {$sekolah}: ".($lolos ? 'DINYATAKAN LOLOS' : 'BELUM DAPAT DITERIMA (tidak lolos)').".\n"
            .($lolos ? 'Silakan melakukan daftar ulang pada '.($periode->daftar_ulang_mulai ? Carbon::parse($periode->daftar_ulang_mulai)->locale('id')->translatedFormat('d F Y') : '-').' s.d. '.($periode->daftar_ulang_selesai ? Carbon::parse($periode->daftar_ulang_selesai)->locale('id')->translatedFormat('d F Y') : '-').".\n" : '')
            ."\nTerima kasih.";

        $lamaNotif = $pendaftar->pemberitahuan_hasil_at?->toDateTimeString();
        $pendaftar->update(['pemberitahuan_hasil_at' => now()]);
        $this->logPpdb($request, $pendaftar, 'notifikasi', "Pemberitahuan hasil seleksi {$this->labelPendaftar($pendaftar)} disiapkan.", ['status' => $pendaftar->status_seleksi, 'sebelum' => ['pemberitahuan_hasil_at' => $lamaNotif], 'sesudah' => ['pemberitahuan_hasil_at' => now()->toDateTimeString()]]);

        $telepon = $this->nomorWa($pendaftar->no_hp ?: $pendaftar->telepon_orang_tua);

        return response()->json([
            'pesan' => $pesan,
            'whatsapp' => $telepon ? 'https://wa.me/'.$telepon.'?text='.rawurlencode($pesan) : null,
            'email' => $pendaftar->email ? 'mailto:'.$pendaftar->email.'?subject='.rawurlencode("Hasil Seleksi {$periode->nama}").'&body='.rawurlencode($pesan) : null,
        ]);
    }

    // ------------------------------------------------------------- pembantu

    private function pastikanTerbit(PpdbPeriode $periode): void
    {
        if (! $periode->pengumuman_terbit_at) {
            throw ValidationException::withMessages(['periode_id' => 'Pengumuman belum diterbitkan.']);
        }
    }

    private function nomorWa(?string $no): ?string
    {
        $d = preg_replace('/\D+/', '', (string) $no);
        if ($d === '') {
            return null;
        }

        return str_starts_with($d, '0') ? '62'.substr($d, 1) : $d;
    }

    private function baris(PpdbPendaftar $p): array
    {
        $kelulusan = $p->status_seleksi === 'lolos' ? 'lolos' : ($p->status_seleksi === 'tidak_lolos' ? 'tidak_lolos' : (in_array($p->status_verifikasi, ['belum', 'perlu_perbaikan'], true) || $p->status_seleksi === 'belum' && $p->status_verifikasi === 'diverifikasi' ? 'belum' : 'tidak_lolos'));

        return [
            'id' => $p->id, 'nomor_pendaftaran' => $p->nomor_pendaftaran, 'nama_lengkap' => $p->nama_lengkap, 'jalur' => $p->jalur?->nama,
            'jenis_kelamin' => $p->jenis_kelamin, 'sekolah_asal' => $p->sekolah_asal, 'skor' => $p->skor,
            'kelulusan' => $kelulusan, 'kelulusan_label' => ['lolos' => 'Lolos', 'tidak_lolos' => 'Tidak Lolos', 'belum' => 'Belum Diputuskan'][$kelulusan],
            'keterangan' => $p->status_verifikasi === 'ditolak' ? 'Tidak lolos verifikasi berkas' : null,
            'no_hp' => $p->no_hp ?: $p->telepon_orang_tua, 'email' => $p->email, 'pemberitahuan_hasil_at' => $p->pemberitahuan_hasil_at,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use App\Models\Prestasi;
use App\Models\Siswa;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoint self-service untuk orang tua/wali. Setiap method yang menerima
 * parameter {siswa} SELALU memverifikasi lewat authorizeAnak() bahwa siswa
 * tersebut benar-benar anak dari user yang sedang login (lewat pivot
 * wali_siswa) sebelum mengembalikan data apa pun — orang tua tidak bisa
 * melihat data siswa lain hanya dengan mengganti ID di URL.
 */
class ParentSelfController extends Controller
{
    private function authorizeAnak(Request $request, Siswa $siswa): void
    {
        $isAnak = $siswa->walis()->where('user_id', $request->user()->id)->exists();

        abort_unless($isAnak, 403, 'Siswa ini bukan anak yang tertaut ke akun Anda.');
    }

    public function index(Request $request): JsonResponse
    {
        $anak = $request->user()->anak()->with('kelas.waliKelas:id,nama,no_telepon')->get();

        return response()->json($anak);
    }

    public function jadwal(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $jadwal = JadwalPelajaran::where('kelas_id', $siswa->kelas_id)
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderBy('hari')
            ->orderBy('jam_mulai')
            ->get();

        return response()->json($jadwal);
    }

    public function nilai(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $nilai = $siswa->nilai()
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($nilai);
    }

    public function absensi(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $absensi = $siswa->absensi()
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 30));

        return response()->json($absensi);
    }

    public function tagihan(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $tagihan = Tagihan::where('siswa_id', $siswa->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($tagihan);
    }

    public function riwayatPembayaran(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $riwayat = Tagihan::where('siswa_id', $siswa->id)
            ->with('pembayaran')
            ->get()
            ->flatMap(fn (Tagihan $tagihan) => $tagihan->pembayaran->map(fn ($p) => [
                'id' => $p->id,
                'tagihan_id' => $tagihan->id,
                'tagihan_judul' => $tagihan->judul,
                'jumlah' => $p->jumlah,
                'tanggal_bayar' => $p->tanggal_bayar,
                'metode' => $p->metode,
            ]))
            ->sortByDesc('tanggal_bayar')
            ->values();

        return response()->json($riwayat);
    }

    public function prestasi(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $prestasi = Prestasi::where('siswa_id', $siswa->id)
            ->orderByDesc('tanggal')
            ->get();

        return response()->json($prestasi);
    }

    public function waliKelas(Request $request, Siswa $siswa): JsonResponse
    {
        $this->authorizeAnak($request, $siswa);

        $siswa->loadMissing('kelas.waliKelas');

        return response()->json($siswa->kelas?->waliKelas);
    }
}

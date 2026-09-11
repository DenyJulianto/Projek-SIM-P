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
 * Endpoint self-service untuk siswa — semua method di sini SELALU
 * mengambil profil Siswa dari user yang sedang login (bukan dari
 * parameter request), jadi tidak ada cara bagi siswa untuk melihat data
 * siswa lain lewat endpoint ini. Cukup butuh auth:sanctum, tidak ada
 * permission tambahan yang perlu diberikan ke role apa pun.
 */
class StudentSelfController extends Controller
{
    private function siswaFor(Request $request): Siswa
    {
        $siswa = $request->user()->siswa;

        abort_unless($siswa, 403, 'Akun ini tidak tertaut ke profil siswa.');

        return $siswa;
    }

    public function profil(Request $request): JsonResponse
    {
        return response()->json($this->siswaFor($request)->load('kelas.waliKelas:id,nama'));
    }

    public function jadwal(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $jadwal = JadwalPelajaran::where('kelas_id', $siswa->kelas_id)
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderBy('hari')
            ->orderBy('jam_mulai')
            ->get();

        return response()->json($jadwal);
    }

    public function nilai(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $nilai = $siswa->nilai()
            ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($nilai);
    }

    public function absensi(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $absensi = $siswa->absensi()
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 30));

        return response()->json($absensi);
    }

    public function tagihan(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $tagihan = Tagihan::where('siswa_id', $siswa->id)
            ->with('pembayaran')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($tagihan);
    }

    public function prestasi(Request $request): JsonResponse
    {
        $siswa = $this->siswaFor($request);

        $prestasi = Prestasi::where('siswa_id', $siswa->id)
            ->orderByDesc('tanggal')
            ->get();

        return response()->json($prestasi);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\Nilai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoint self-service untuk guru mata pelajaran — semua method di sini
 * SELALU mengambil profil Guru dari user yang sedang login, jadi guru tidak
 * perlu diberi permission luas (mis. monitoring-guru.jadwal-mengajar) hanya
 * untuk melihat jadwal/kelas/mapelnya sendiri. Hanya butuh auth:sanctum.
 */
class GuruSelfController extends Controller
{
    private function guruFor(Request $request): Guru
    {
        $guru = $request->user()->guru;

        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru.');

        return $guru;
    }

    public function profil(Request $request): JsonResponse
    {
        return response()->json($this->guruFor($request));
    }

    public function jadwal(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $jadwal = JadwalPelajaran::where('guru_id', $guru->id)
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->orderBy('hari')
            ->orderBy('jam_mulai')
            ->get();

        return response()->json($jadwal);
    }

    public function kelas(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $kelas = JadwalPelajaran::where('guru_id', $guru->id)
            ->with('kelas:id,nama_kelas,tingkat,tahun_ajaran')
            ->get()
            ->pluck('kelas')
            ->filter()
            ->unique('id')
            ->values();

        $kelas = $kelas->map(function ($k) {
            $k->jumlah_siswa = $k->siswa()->count();

            return $k;
        });

        return response()->json($kelas);
    }

    public function mataPelajaran(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $mapel = JadwalPelajaran::where('guru_id', $guru->id)
            ->with('mataPelajaran:id,nama_mapel')
            ->get()
            ->pluck('mataPelajaran')
            ->filter()
            ->unique('id')
            ->values();

        return response()->json($mapel);
    }

    public function rekapNilai(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $rekap = Nilai::where('guru_id', $guru->id)
            ->with('mataPelajaran:id,nama_mapel')
            ->get()
            ->groupBy('mata_pelajaran_id')
            ->map(function ($items) {
                return [
                    'mata_pelajaran' => $items->first()->mataPelajaran->nama_mapel ?? '-',
                    'jumlah_nilai' => $items->count(),
                    'rata_rata' => round($items->avg('nilai'), 2),
                    'tertinggi' => (float) $items->max('nilai'),
                    'terendah' => (float) $items->min('nilai'),
                ];
            })
            ->values();

        return response()->json($rekap);
    }
}

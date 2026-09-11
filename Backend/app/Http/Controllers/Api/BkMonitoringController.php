<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KasusSiswa;
use App\Models\Konseling;
use App\Models\PemanggilanOrangTua;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BkMonitoringController extends Controller
{
    /**
     * Siswa dengan kasus yang masih berjalan (status != selesai), diurutkan
     * dari jumlah kasus aktif terbanyak — dipakai sebagai daftar "perlu
     * pendampingan" tanpa perlu kolom flag manual di tabel siswa.
     */
    public function perluPendampingan(): JsonResponse
    {
        $siswa = KasusSiswa::query()
            ->where('status', '!=', 'selesai')
            ->with('siswa:id,nama,kelas_id')
            ->get()
            ->groupBy('siswa_id')
            ->map(function ($kasusList) {
                $first = $kasusList->first();

                return [
                    'siswa' => $first->siswa,
                    'jumlah_kasus_aktif' => $kasusList->count(),
                    'tingkat_tertinggi' => $kasusList->pluck('tingkat')->sort(function ($a, $b) {
                        $order = ['ringan' => 1, 'sedang' => 2, 'berat' => 3];

                        return $order[$b] <=> $order[$a];
                    })->first(),
                ];
            })
            ->sortByDesc('jumlah_kasus_aktif')
            ->values();

        return response()->json($siswa);
    }

    public function rekapKasus(): JsonResponse
    {
        return response()->json([
            'per_status' => KasusSiswa::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'per_kategori' => KasusSiswa::query()->selectRaw('kategori, count(*) as total')->groupBy('kategori')->pluck('total', 'kategori'),
            'per_tingkat' => KasusSiswa::query()->selectRaw('tingkat, count(*) as total')->groupBy('tingkat')->pluck('total', 'tingkat'),
        ]);
    }

    public function statistik(Request $request): JsonResponse
    {
        $bulanIni = now()->startOfMonth();

        return response()->json([
            'total_konseling' => Konseling::count(),
            'konseling_bulan_ini' => Konseling::where('tanggal', '>=', $bulanIni)->count(),
            'total_kasus' => KasusSiswa::count(),
            'kasus_aktif' => KasusSiswa::where('status', '!=', 'selesai')->count(),
            'total_pemanggilan' => PemanggilanOrangTua::count(),
            'pemanggilan_bulan_ini' => PemanggilanOrangTua::where('tanggal_pemanggilan', '>=', $bulanIni)->count(),
            'pemanggilan_dijadwalkan' => PemanggilanOrangTua::where('status', 'dijadwalkan')->count(),
        ]);
    }

    public function laporan(Request $request): JsonResponse
    {
        return response()->json([
            'statistik' => json_decode($this->statistik($request)->getContent(), true),
            'rekap_kasus' => json_decode($this->rekapKasus()->getContent(), true),
            'kasus_terbaru' => KasusSiswa::with('siswa:id,nama,kelas_id')->orderByDesc('tanggal_kejadian')->limit(10)->get(),
            'konseling_terbaru' => Konseling::with('siswa:id,nama,kelas_id')->orderByDesc('tanggal')->limit(10)->get(),
            'pemanggilan_terbaru' => PemanggilanOrangTua::with('siswa:id,nama,kelas_id')->orderByDesc('tanggal_pemanggilan')->limit(10)->get(),
        ]);
    }
}

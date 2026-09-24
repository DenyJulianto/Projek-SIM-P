<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\GuruDirectory;
use App\Models\Central\SiswaDirectory;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;

/**
 * Ringkasan statistik nasional untuk beranda Super Admin. Semua angka
 * dihitung langsung dari tabel central (bukan di-cache/hardcode) supaya
 * selalu mencerminkan data direktori nasional yang sebenarnya.
 */
class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $jenjang = Sekolah::query()
            ->selectRaw('COALESCE(jenjang, ?) as jenjang, COUNT(*) as total', ['Belum diisi'])
            ->groupBy('jenjang')
            ->orderByDesc('total')
            ->get();

        $provinsi = Sekolah::query()
            ->whereNotNull('provinsi')
            ->where('provinsi', '!=', '')
            ->selectRaw('provinsi, COUNT(*) as total')
            ->groupBy('provinsi')
            ->orderByDesc('total')
            ->get();

        $guruPerProvinsi = Sekolah::query()
            ->join('guru_direktori_nasional', 'guru_direktori_nasional.sekolah_id', '=', 'tenants.id')
            ->whereNotNull('tenants.provinsi')
            ->where('tenants.provinsi', '!=', '')
            ->selectRaw('tenants.provinsi as provinsi, COUNT(*) as total')
            ->groupBy('tenants.provinsi')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $siswaPerProvinsi = Sekolah::query()
            ->join('siswa_direktori_nasional', 'siswa_direktori_nasional.sekolah_id', '=', 'tenants.id')
            ->whereNotNull('tenants.provinsi')
            ->where('tenants.provinsi', '!=', '')
            ->selectRaw('tenants.provinsi as provinsi, COUNT(*) as total')
            ->groupBy('tenants.provinsi')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'total_sekolah' => Sekolah::count(),
            'total_guru' => GuruDirectory::count(),
            'total_siswa' => SiswaDirectory::count(),
            'jumlah_provinsi' => Sekolah::whereNotNull('provinsi')->where('provinsi', '!=', '')->distinct()->count('provinsi'),
            'jenjang' => $jenjang,
            'provinsi_terbanyak' => $provinsi->first(),
            'provinsi_tersedikit' => $provinsi->last(),
            'guru_per_provinsi' => $guruPerProvinsi,
            'siswa_per_provinsi' => $siswaPerProvinsi,
        ]);
    }
}

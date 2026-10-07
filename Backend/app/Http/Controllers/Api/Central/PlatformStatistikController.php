<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Angka publik untuk landing platform (bagian "Social Proof"): dihitung
 * langsung dari data sungguhan — sekolah aktif serta siswa & guru aktif di
 * direktori nasional — dan di-cache sebentar supaya ringan.
 */
class PlatformStatistikController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $data = Cache::remember('platform:statistik-publik', now()->addMinutes(10), fn () => [
            'sekolah' => Sekolah::where('status', 'active')->count(),
            'siswa' => DB::table('siswa_direktori_nasional')->where('status', 'aktif')->count(),
            'guru' => DB::table('guru_direktori_nasional')->where('status', 'aktif')->count(),
        ]);

        return response()->json($data);
    }
}

<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AbsensiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\JadwalPelajaranController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\NilaiController;
use App\Http\Controllers\Api\PengumumanController;
use App\Http\Controllers\Api\ProfilPublikController;
use App\Http\Controllers\Api\RaporController;
use App\Http\Controllers\Api\SiswaController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Endpoint di sini diakses lewat subdomain/domain masing-masing sekolah
| (mis. smkn1bandung.simpendidikan.com). Tenancy diinisialisasi otomatis
| sehingga semua query di controller hanya menyentuh database sekolah
| yang bersangkutan.
|
*/

Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // Landing page publik sekolah — tidak butuh login.
    Route::prefix('public')->group(function () {
        Route::get('/profil', [ProfilPublikController::class, 'profil']);
        Route::get('/pengumuman', [ProfilPublikController::class, 'pengumuman']);
        Route::get('/kegiatan', [ProfilPublikController::class, 'kegiatan']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        Route::apiResource('kelas', KelasController::class)
            ->middleware('permission:kurikulum.manage');

        Route::apiResource('guru', GuruController::class)
            ->middleware('permission:pegawai.manage');

        Route::apiResource('siswa', SiswaController::class)
            ->middleware('permission:siswa.manage');

        Route::apiResource('nilai', NilaiController::class)
            ->only(['index', 'show'])
            ->middleware('permission:nilai.manage|nilai.view');

        Route::apiResource('nilai', NilaiController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:nilai.manage');

        Route::apiResource('jadwal-pelajaran', JadwalPelajaranController::class)
            ->only(['index', 'show'])
            ->middleware('permission:jadwal.manage|kurikulum.jadwal-pelajaran|monitoring-guru.jadwal-mengajar');

        Route::apiResource('jadwal-pelajaran', JadwalPelajaranController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:jadwal.manage');

        Route::apiResource('absensi', AbsensiController::class)
            ->only(['index', 'show'])
            ->middleware('permission:absensi-kelas.manage|absensi.view|kesiswaan.absensi');

        Route::apiResource('absensi', AbsensiController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:absensi-kelas.manage');

        // Otorisasi rapor ditangani di dalam controller: staf terkait (rapor.publish,
        // rapor-kelas.manage, rapor.approve), siswa yang bersangkutan, atau wali siswanya.
        Route::get('siswa/{siswa}/rapor', [RaporController::class, 'show']);

        Route::put('/profil', [ProfilPublikController::class, 'updateProfil'])
            ->middleware('permission:humas.informasi');

        Route::apiResource('pengumuman', PengumumanController::class)
            ->middleware('permission:humas.pengumuman');

        Route::apiResource('kegiatan', KegiatanController::class)
            ->middleware('permission:humas.kegiatan');
    });
});

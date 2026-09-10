<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AbsensiController;
use App\Http\Controllers\Api\AbsensiGuruController;
use App\Http\Controllers\Api\ArsipDokumenController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvatarController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\InventarisController;
use App\Http\Controllers\Api\JadwalPelajaranController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\MataPelajaranController;
use App\Http\Controllers\Api\NilaiController;
use App\Http\Controllers\Api\PengumumanController;
use App\Http\Controllers\Api\ProfilPublikController;
use App\Http\Controllers\Api\RaporController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SiswaController;
use App\Http\Controllers\Api\SuratController;
use App\Http\Controllers\Api\UserController;
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

    Route::get('avatar/{path}', [AvatarController::class, 'show'])->where('path', '.*');
    Route::get('surat-file/{path}', [SuratController::class, 'showFile'])->where('path', '.*');
    Route::get('arsip-file/{path}', [ArsipDokumenController::class, 'showFile'])->where('path', '.*');

    // Landing page publik sekolah — tidak butuh login.
    Route::prefix('public')->group(function () {
        Route::get('/profil', [ProfilPublikController::class, 'profil']);
        Route::get('/pengumuman', [ProfilPublikController::class, 'pengumuman']);
        Route::get('/kegiatan', [ProfilPublikController::class, 'kegiatan']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me', [AuthController::class, 'updateMe']);
        Route::post('/me/avatar', [AuthController::class, 'updateAvatar']);

        Route::apiResource('kelas', KelasController::class)
            ->middleware('permission:kurikulum.manage');

        Route::apiResource('mata-pelajaran', MataPelajaranController::class)
            ->middleware('permission:kurikulum.manage');

        Route::get('guru/export', [GuruController::class, 'export'])
            ->middleware('permission:pegawai.manage');

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

        Route::get('absensi/rekap', [AbsensiController::class, 'rekap'])
            ->middleware('permission:absensi-kelas.manage|absensi.view|kesiswaan.absensi');

        Route::post('absensi/bulk', [AbsensiController::class, 'bulkStore'])
            ->middleware('permission:absensi-kelas.manage');

        Route::apiResource('absensi', AbsensiController::class)
            ->only(['index', 'show'])
            ->middleware('permission:absensi-kelas.manage|absensi.view|kesiswaan.absensi');

        Route::apiResource('absensi', AbsensiController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:absensi-kelas.manage');

        Route::get('absensi-guru/rekap', [AbsensiGuruController::class, 'rekap'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::post('absensi-guru/bulk', [AbsensiGuruController::class, 'bulkStore'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::get('absensi-guru', [AbsensiGuruController::class, 'index'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::post('absensi-guru', [AbsensiGuruController::class, 'store'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::put('absensi-guru/{absensiGuru}', [AbsensiGuruController::class, 'update'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        Route::delete('absensi-guru/{absensiGuru}', [AbsensiGuruController::class, 'destroy'])
            ->middleware('permission:monitoring-guru.absensi-guru');

        // Otorisasi rapor ditangani di dalam controller: staf terkait (rapor.publish,
        // rapor-kelas.manage, rapor.approve), siswa yang bersangkutan, atau wali siswanya.
        Route::get('siswa/{siswa}/rapor', [RaporController::class, 'show']);

        Route::put('/profil', [ProfilPublikController::class, 'updateProfil'])
            ->middleware('permission:humas.informasi');

        Route::apiResource('pengumuman', PengumumanController::class)
            ->middleware('permission:humas.pengumuman');

        Route::apiResource('kegiatan', KegiatanController::class)
            ->middleware('permission:humas.kegiatan');

        Route::apiResource('inventaris', InventarisController::class)
            ->middleware('permission:sarpras.inventaris');

        Route::post('inventaris/{inventari}/riwayat', [InventarisController::class, 'storeRiwayat'])
            ->middleware('permission:sarpras.inventaris');

        Route::apiResource('users', UserController::class)
            ->only(['index', 'store', 'update'])
            ->middleware('permission:pengguna.manage');

        Route::get('roles', [RoleController::class, 'index'])
            ->middleware('permission:pengguna.manage');

        Route::apiResource('surat', SuratController::class)
            ->middleware('permission:persuratan.manage');

        Route::apiResource('arsip-dokumen', ArsipDokumenController::class)
            ->middleware('permission:persuratan.manage');
    });
});

<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Central\AuditController;
use App\Http\Controllers\Api\Central\DashboardController;
use App\Http\Controllers\Api\Central\GuruDirectoryController;
use App\Http\Controllers\Api\Central\IntegrationTokenController;
use App\Http\Controllers\Api\Central\ModuleController;
use App\Http\Controllers\Api\Central\NationalBackupController;
use App\Http\Controllers\Api\Central\RoleCatalogController;
use App\Http\Controllers\Api\Central\SchoolAccessController;
use App\Http\Controllers\Api\Central\SchoolSyncController;
use App\Http\Controllers\Api\Central\SecurityController;
use App\Http\Controllers\Api\Central\SiswaDirectoryController;
use App\Http\Controllers\Api\Central\StatistikController;
use App\Http\Controllers\Api\Central\TwoFactorController;
use App\Http\Controllers\Api\Integrasi\DirectoryApiController;
use App\Http\Controllers\Api\SekolahController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central API Routes
|--------------------------------------------------------------------------
|
| Endpoint di sini melayani platform level (Super Admin), tidak terikat
| ke satu sekolah manapun. Diakses lewat domain utama (bukan subdomain
| sekolah) — lihat routes/tenant.php untuk endpoint per-sekolah.
|
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/2fa/verify', [AuthController::class, 'verifyTwoFactor']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('super_admin')->group(function () {
        Route::get('/dashboard-nasional', [DashboardController::class, 'index']);
        Route::get('/sekolah/import-template', [SekolahController::class, 'importTemplate']);
        Route::post('/sekolah/import', [SekolahController::class, 'import']);
        Route::get('/sekolah/export', [SekolahController::class, 'export']);
        Route::apiResource('sekolah', SekolahController::class);
        Route::patch('/sekolah/{sekolah}/status', [SchoolAccessController::class, 'updateStatus']);
        Route::get('/admin-sekolah', [SchoolAccessController::class, 'nationalAdmins']);
        Route::get('/sekolah/{sekolah}/admins', [SchoolAccessController::class, 'admins']);
        Route::post('/sekolah/{sekolah}/admins', [SchoolAccessController::class, 'storeAdmin']);
        Route::delete('/sekolah/{sekolah}/admins/{userId}', [SchoolAccessController::class, 'destroyAdmin']);
        Route::post('/sekolah/{sekolah}/admins/{userId}/reset-password', [SchoolAccessController::class, 'resetAdminPassword']);
        Route::patch('/sekolah/{sekolah}/admins/{userId}/status', [SchoolAccessController::class, 'toggleAdminActive']);
        Route::get('/sekolah/{sekolah}/roles', [SchoolAccessController::class, 'roles']);
        Route::patch('/sekolah/{sekolah}/roles/{roleId}', [SchoolAccessController::class, 'updateRolePermissions']);
        Route::get('/permissions-catalog', [SchoolAccessController::class, 'permissionCatalog']);
        Route::get('/direktori-guru/import-template', [GuruDirectoryController::class, 'importTemplate']);
        Route::post('/direktori-guru/import', [GuruDirectoryController::class, 'import']);
        Route::get('/direktori-guru/export', [GuruDirectoryController::class, 'export']);
        Route::get('/direktori-guru', [GuruDirectoryController::class, 'index']);
        Route::get('/direktori-siswa/import-template', [SiswaDirectoryController::class, 'importTemplate']);
        Route::post('/direktori-siswa/import', [SiswaDirectoryController::class, 'import']);
        Route::get('/direktori-siswa/export', [SiswaDirectoryController::class, 'export']);
        Route::get('/direktori-siswa', [SiswaDirectoryController::class, 'index']);
        Route::get('/sinkronisasi/log', [SchoolSyncController::class, 'log']);
        Route::get('/sinkronisasi/konflik', [SchoolSyncController::class, 'conflicts']);
        Route::post('/sekolah/{sekolah}/sinkronisasi', [SchoolSyncController::class, 'sync']);
        Route::get('/audit/log', [AuditController::class, 'index']);
        Route::get('/audit/notifikasi', [AuditController::class, 'sensitive']);
        Route::get('/audit/laporan-wilayah', [AuditController::class, 'laporanWilayah']);
        Route::get('/audit/laporan-wilayah/export', [AuditController::class, 'exportLaporanWilayah']);
        Route::get('/statistik/ringkasan', [StatistikController::class, 'ringkasan']);
        Route::get('/statistik/wilayah', [StatistikController::class, 'wilayah']);
        Route::get('/statistik/jenjang', [StatistikController::class, 'jenjang']);
        Route::get('/statistik/peta', [StatistikController::class, 'peta']);

        Route::get('/modules/catalog', [ModuleController::class, 'catalog']);
        Route::get('/sekolah/{sekolah}/modules', [ModuleController::class, 'show']);
        Route::patch('/sekolah/{sekolah}/modules', [ModuleController::class, 'update']);

        Route::get('/backup-nasional', [NationalBackupController::class, 'index']);
        Route::post('/backup-nasional', [NationalBackupController::class, 'store']);
        Route::get('/backup-nasional/{name}/download', [NationalBackupController::class, 'download']);
        Route::delete('/backup-nasional/{name}', [NationalBackupController::class, 'destroy']);
        Route::post('/backup-nasional/{name}/restore', [NationalBackupController::class, 'restore']);
        Route::get('/system-info', [NationalBackupController::class, 'systemInfo']);

        Route::get('/integrasi-token', [IntegrationTokenController::class, 'index']);
        Route::post('/integrasi-token', [IntegrationTokenController::class, 'store']);
        Route::delete('/integrasi-token/{integrationToken}', [IntegrationTokenController::class, 'destroy']);

        Route::get('/roles-katalog', [RoleCatalogController::class, 'index']);

        Route::get('/security/settings', [SecurityController::class, 'show']);
        Route::patch('/security/pii', [SecurityController::class, 'updatePii']);
        Route::patch('/security/retention', [SecurityController::class, 'updateRetention']);
        Route::get('/security/retention/preview', [SecurityController::class, 'retentionPreview']);
        Route::post('/security/retention/purge', [SecurityController::class, 'retentionPurge']);

        Route::get('/2fa/status', [TwoFactorController::class, 'status']);
        Route::post('/2fa/setup', [TwoFactorController::class, 'setup']);
        Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm']);
        Route::post('/2fa/disable', [TwoFactorController::class, 'disable']);
        Route::post('/2fa/recovery-codes/regenerate', [TwoFactorController::class, 'regenerateRecoveryCodes']);
    });
});

/*
|--------------------------------------------------------------------------
| Integration API (token-based, bukan sesi login)
|--------------------------------------------------------------------------
|
| Dipakai sistem pihak lain untuk menarik data direktori nasional secara
| baca-saja. Lihat App\Http\Middleware\AuthenticateIntegrationToken dan
| menu "Integrasi Sistem" di dashboard Super Admin untuk membuat tokennya.
|
*/
Route::prefix('integrasi/v1')->group(function () {
    Route::middleware('integration.token:sekolah:read')->get('/sekolah', [DirectoryApiController::class, 'sekolah']);
    Route::middleware('integration.token:guru:read')->get('/guru', [DirectoryApiController::class, 'guru']);
    Route::middleware('integration.token:siswa:read')->get('/siswa', [DirectoryApiController::class, 'siswa']);
});

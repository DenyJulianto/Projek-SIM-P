<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Central\DashboardController;
use App\Http\Controllers\Api\Central\GuruDirectoryController;
use App\Http\Controllers\Api\Central\SiswaDirectoryController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('super_admin')->group(function () {
        Route::get('/dashboard-nasional', [DashboardController::class, 'index']);
        Route::get('/sekolah/import-template', [SekolahController::class, 'importTemplate']);
        Route::post('/sekolah/import', [SekolahController::class, 'import']);
        Route::get('/sekolah/export', [SekolahController::class, 'export']);
        Route::apiResource('sekolah', SekolahController::class);
        Route::get('/direktori-guru/import-template', [GuruDirectoryController::class, 'importTemplate']);
        Route::post('/direktori-guru/import', [GuruDirectoryController::class, 'import']);
        Route::get('/direktori-guru/export', [GuruDirectoryController::class, 'export']);
        Route::get('/direktori-guru', [GuruDirectoryController::class, 'index']);
        Route::get('/direktori-siswa/import-template', [SiswaDirectoryController::class, 'importTemplate']);
        Route::post('/direktori-siswa/import', [SiswaDirectoryController::class, 'import']);
        Route::get('/direktori-siswa/export', [SiswaDirectoryController::class, 'export']);
        Route::get('/direktori-siswa', [SiswaDirectoryController::class, 'index']);
    });
});

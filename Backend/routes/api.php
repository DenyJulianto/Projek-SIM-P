<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
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
        Route::apiResource('sekolah', SekolahController::class);
    });
});

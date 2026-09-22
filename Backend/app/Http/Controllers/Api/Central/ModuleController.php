<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Pengaturan modul opsional per sekolah. Modul yang dinonaktifkan di sini
 * langsung diblokir di sisi sekolah lewat middleware
 * App\Http\Middleware\EnsureModuleEnabled (routes/tenant.php) dan
 * disembunyikan dari sidebar sekolah lewat field `enabled_modules` yang
 * dikirim AuthController::presentUser() setiap login/refresh sesi.
 */
class ModuleController extends Controller
{
    public function catalog(): JsonResponse
    {
        return response()->json(config('sim.modules'));
    }

    public function show(Sekolah $sekolah): JsonResponse
    {
        return response()->json($sekolah->resolvedModuleSettings());
    }

    public function update(Request $request, Sekolah $sekolah): JsonResponse
    {
        $data = $request->validate([
            'modules' => ['required', 'array'],
            'modules.*' => ['boolean'],
        ]);

        $allowedKeys = array_keys(config('sim.modules'));
        $modules = array_intersect_key($data['modules'], array_flip($allowedKeys));

        $sekolah->update(['module_settings' => $modules]);

        return response()->json($sekolah->fresh()->resolvedModuleSettings());
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blokir akses ke fitur yang sudah dinonaktifkan Super Admin untuk sekolah
 * ini (menu Pengaturan Modul). Dipasang sebagai lapisan TAMBAHAN di atas
 * middleware `permission:*` yang sudah ada — permission tetap mengatur
 * SIAPA yang boleh, middleware ini mengatur APAKAH modulnya tersedia sama
 * sekali untuk sekolah tersebut.
 */
class EnsureModuleEnabled
{
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $sekolah = tenant();

        if ($sekolah && ($sekolah->resolvedModuleSettings()[$module] ?? true) === false) {
            abort(403, 'Modul ini belum diaktifkan untuk sekolah Anda. Hubungi Super Admin untuk mengaktifkannya.');
        }

        return $next($request);
    }
}

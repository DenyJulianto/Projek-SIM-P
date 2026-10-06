<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Akun dengan password dari admin (akun baru atau hasil reset) hanya boleh
 * melihat profilnya sendiri, mengganti password, atau logout sampai
 * password diganti.
 */
class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->must_change_password) {
            return $next($request);
        }

        $diizinkan = ($request->isMethod('GET') && $request->is('me'))
            || $request->is('me/password')
            || $request->is('logout');

        if ($diizinkan) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Anda wajib mengganti password sebelum melanjutkan.',
            'code' => 'password_change_required',
        ], 403);
    }
}

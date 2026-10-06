<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Admin Sekolah wajib mengaktifkan 2FA sebelum bisa memakai aplikasi.
 * Berlaku selama akun memegang peran tersebut, apa pun peran aktifnya,
 * karena akun itu tetap bisa beralih ke peran admin kapan saja.
 */
class EnsureTwoFactorEnabled
{
    public const PERAN_WAJIB = ['Admin Sekolah'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            ! $user
            || ! config('sim.keamanan.wajib_2fa_admin')
            || $user->two_factor_confirmed_at
            || ! array_intersect(self::PERAN_WAJIB, $user->peranTersedia ?? $user->getRoleNames()->all())
        ) {
            return $next($request);
        }

        $diizinkan = ($request->isMethod('GET') && $request->is('me'))
            || $request->is('me/2fa', 'me/2fa/*')
            || $request->is('me/password')
            || $request->is('logout');

        if ($diizinkan) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Akun admin wajib mengaktifkan verifikasi dua langkah (2FA) sebelum melanjutkan.',
            'code' => 'two_factor_required',
        ], 403);
    }
}

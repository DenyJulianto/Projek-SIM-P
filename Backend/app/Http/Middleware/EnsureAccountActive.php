<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\AuditAuth;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sesi yang sudah login tetap diputus bila akunnya dinonaktifkan atau
 * sekolahnya ditangguhkan Super Admin — tidak menunggu token kedaluwarsa.
 */
class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if (tenant('status') !== null && tenant('status') !== 'active') {
            return response()->json([
                'message' => 'Sekolah ini sedang dinonaktifkan. Hubungi Super Admin untuk informasi lebih lanjut.',
                'code' => 'school_suspended',
            ], 403);
        }

        if ($user->is_active === false) {
            $token = $user->currentAccessToken();
            if ($token instanceof PersonalAccessToken) {
                $token->delete();
            }
            AuditAuth::catat('Sesi diputus: akun nonaktif.', $user);

            return response()->json([
                'message' => 'Akun ini telah dinonaktifkan.',
                'code' => 'account_inactive',
            ], 401);
        }

        return $next($request);
    }
}

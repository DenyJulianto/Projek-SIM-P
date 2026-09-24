<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Central\IntegrationToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autentikasi terpisah dari login akun (Sanctum) — khusus endpoint
 * "integrasi/v1" yang dipakai sistem pihak lain, bukan pengguna manusia.
 * Header: Authorization: Bearer <plain_token> (ditampilkan sekali saat
 * token dibuat lewat IntegrationTokenController::store()).
 */
class AuthenticateIntegrationToken
{
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $plainToken = $request->bearerToken();

        if (! $plainToken) {
            abort(401, 'Token integrasi tidak ditemukan. Sertakan header Authorization: Bearer <token>.');
        }

        $token = IntegrationToken::where('token_hash', hash('sha256', $plainToken))->first();

        if (! $token) {
            abort(401, 'Token integrasi tidak valid atau sudah dicabut.');
        }

        if (! $token->can($ability)) {
            abort(403, "Token ini tidak punya akses \"{$ability}\".");
        }

        $token->forceFill(['last_used_at' => now()])->save();

        return $next($request);
    }
}

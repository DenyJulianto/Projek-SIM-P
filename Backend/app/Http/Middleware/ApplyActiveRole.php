<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\PeranAktif;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Membatasi peran user pada request ini ke peran aktif yang tersimpan di
 * token login. Peran yang tersimpan tapi sudah dicabut admin otomatis
 * diabaikan (kembali ke peran bawaan).
 */
class ApplyActiveRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $token = $user->currentAccessToken();
            PeranAktif::terapkan($user, $token instanceof PersonalAccessToken ? $token->active_role : null);
        }

        return $next($request);
    }
}

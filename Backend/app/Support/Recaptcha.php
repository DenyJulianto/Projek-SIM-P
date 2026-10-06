<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Http;

/**
 * Verifikasi reCAPTCHA v3. Kalau secret belum dikonfigurasi (dev/test),
 * verifikasi dilewati otomatis. Kalau sudah dikonfigurasi tapi token tidak
 * dikirim atau score di bawah 0.5, dianggap gagal.
 */
class Recaptcha
{
    public static function lolos(?string $token): bool
    {
        $secret = config('services.recaptcha.secret');

        if (! $secret) {
            return true;
        }

        if (! $token) {
            return false;
        }

        try {
            $response = Http::asForm()->timeout(5)->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secret,
                'response' => $token,
                'remoteip' => request()->ip(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return false;
        }

        $result = $response->json() ?? [];

        return ($result['success'] ?? false) === true && (float) ($result['score'] ?? 0) >= 0.5;
    }
}

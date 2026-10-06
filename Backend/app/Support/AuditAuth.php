<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;

/**
 * Catatan audit untuk kejadian keamanan akun (login, gagal login,
 * penguncian, logout, ganti password, 2FA). Disimpan di activity log
 * dengan log_name "keamanan", lengkap dengan IP dan user agent.
 */
class AuditAuth
{
    /** @param  array<string, mixed>  $properti */
    public static function catat(string $pesan, ?User $user = null, array $properti = []): void
    {
        try {
            $log = activity('keamanan')->withProperties($properti + [
                'ip' => request()->ip(),
                'user_agent' => substr((string) request()->userAgent(), 0, 255),
            ]);

            if ($user) {
                $log->causedBy($user)->performedOn($user);
            }

            $log->log($pesan);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}

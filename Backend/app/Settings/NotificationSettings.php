<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class NotificationSettings extends Settings
{
    public bool $peringatan_akun_nonaktif;

    public bool $peringatan_tanpa_peran;

    public bool $peringatan_backup_belum_pernah;

    public static function group(): string
    {
        return 'notifikasi';
    }
}

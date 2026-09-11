<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class BackupScheduleSettings extends Settings
{
    /** off | harian | mingguan */
    public string $frequency;

    public string $time;

    public ?string $last_run_at;

    public static function group(): string
    {
        return 'backup_schedule';
    }
}

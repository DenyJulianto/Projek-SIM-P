<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\BackupService;
use App\Settings\BackupScheduleSettings;
use Illuminate\Console\Command;

class RunScheduledBackup extends Command
{
    protected $signature = 'backup:scheduled';

    protected $description = 'Jalankan backup otomatis untuk tenant aktif jika sudah waktunya sesuai jadwal yang diatur.';

    public function handle(BackupService $backups): int
    {
        $settings = app(BackupScheduleSettings::class);

        if ($settings->frequency === 'off') {
            return self::SUCCESS;
        }

        if (! $this->isDue($settings)) {
            return self::SUCCESS;
        }

        $result = $backups->create('terjadwal');

        $settings->last_run_at = now()->toIso8601String();
        $settings->save();

        $this->info("Backup terjadwal dibuat: {$result['name']}");

        activity()->log("Backup otomatis dibuat: \"{$result['name']}\".");

        return self::SUCCESS;
    }

    private function isDue(BackupScheduleSettings $settings): bool
    {
        [$hour, $minute] = array_map('intval', explode(':', $settings->time));
        $now = now();

        if ($now->hour !== $hour || $now->minute !== $minute) {
            return false;
        }

        if (! $settings->last_run_at) {
            return true;
        }

        $lastRun = \Illuminate\Support\Carbon::parse($settings->last_run_at);

        return match ($settings->frequency) {
            'harian' => ! $lastRun->isSameDay($now),
            'mingguan' => $lastRun->diffInDays($now) >= 7,
            default => false,
        };
    }
}

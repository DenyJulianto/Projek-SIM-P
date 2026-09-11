<?php

use Illuminate\Support\Facades\Schema;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        $this->migrator->add('backup_schedule.frequency', 'off');
        $this->migrator->add('backup_schedule.time', '02:00');
        $this->migrator->add('backup_schedule.last_run_at', null);
    }
};

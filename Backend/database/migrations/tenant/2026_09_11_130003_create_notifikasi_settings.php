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

        $this->migrator->add('notifikasi.peringatan_akun_nonaktif', true);
        $this->migrator->add('notifikasi.peringatan_tanpa_peran', true);
        $this->migrator->add('notifikasi.peringatan_backup_belum_pernah', true);
    }
};

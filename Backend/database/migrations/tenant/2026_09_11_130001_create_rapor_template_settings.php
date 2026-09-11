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

        $this->migrator->add('rapor_template.header_text', 'LAPORAN HASIL BELAJAR SISWA');
        $this->migrator->add('rapor_template.tampilkan_logo', true);
        $this->migrator->add('rapor_template.catatan_kaki', null);
        $this->migrator->add('rapor_template.nama_penandatangan', null);
        $this->migrator->add('rapor_template.jabatan_penandatangan', 'Kepala Sekolah');
    }
};

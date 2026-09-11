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

        $this->migrator->add('surat_template.kop_surat_text', null);
        $this->migrator->add('surat_template.format_nomor_surat', '{nomor}/{jenis}/{bulan-romawi}/{tahun}');
        $this->migrator->add('surat_template.penutup_text', null);
        $this->migrator->add('surat_template.nama_penandatangan', null);
        $this->migrator->add('surat_template.jabatan_penandatangan', 'Kepala Sekolah');
    }
};

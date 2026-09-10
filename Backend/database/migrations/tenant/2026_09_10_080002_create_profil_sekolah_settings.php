<?php

use Illuminate\Support\Facades\Schema;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    /**
     * Kelas settings ini khusus per-sekolah (tenant). Tabel `settings` tidak
     * ada di database central, jadi migration ini di-skip saat dijalankan
     * lewat `php artisan migrate` biasa (central).
     */
    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        $this->migrator->add('profil_sekolah.sambutan_kepala_sekolah', null);
        $this->migrator->add('profil_sekolah.visi', null);
        $this->migrator->add('profil_sekolah.misi', null);
        $this->migrator->add('profil_sekolah.hero_image', null);
        $this->migrator->add('profil_sekolah.facebook', null);
        $this->migrator->add('profil_sekolah.instagram', null);
        $this->migrator->add('profil_sekolah.youtube', null);
    }
};

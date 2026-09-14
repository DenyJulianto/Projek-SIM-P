<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_settings', function (Blueprint $table) {
            $table->id();

            // Kontrol Perlindungan Data Pribadi (PII) — lihat catatan di
            // SecurityController: ini penyamaran (masking) data sensitif
            // di ekspor/API, bukan enkripsi kolom database.
            $table->boolean('mask_pii_enabled')->default(false);

            // Retensi & penghapusan data (khusus log — lihat catatan di
            // SecurityController::dataRetention kenapa dibatasi ke log saja,
            // bukan data inti sekolah/guru/siswa).
            $table->unsignedInteger('log_retention_days')->default(365);
            $table->timestamp('last_retention_purge_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_settings');
    }
};

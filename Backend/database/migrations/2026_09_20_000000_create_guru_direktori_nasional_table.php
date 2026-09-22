<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Salinan (bukan sumber utama) data guru dari tiap database sekolah,
     * disinkronkan lewat GuruObserver + php artisan directory:sync-guru,
     * supaya Super Admin platform bisa mencari/melihat guru se-Indonesia
     * tanpa membuka koneksi ke setiap database tenant saat request masuk.
     */
    public function up(): void
    {
        Schema::create('guru_direktori_nasional', function (Blueprint $table) {
            $table->id();
            $table->string('sekolah_id');
            $table->foreign('sekolah_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unsignedBigInteger('guru_id');
            $table->string('nip', 30)->nullable();
            $table->string('nuptk', 30)->nullable();
            $table->string('nama');
            $table->string('gelar')->nullable();
            $table->string('jabatan')->nullable();
            $table->string('pendidikan_terakhir')->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('no_telepon', 20)->nullable();
            $table->string('status')->default('aktif');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['sekolah_id', 'guru_id']);
            $table->index('nama');
            $table->index('jabatan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guru_direktori_nasional');
    }
};

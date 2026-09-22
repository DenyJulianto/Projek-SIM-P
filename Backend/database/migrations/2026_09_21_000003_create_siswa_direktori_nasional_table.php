<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Salinan (bukan sumber utama) data siswa dari tiap database sekolah,
     * disinkronkan lewat SiswaObserver + php artisan directory:sync-siswa,
     * mengikuti pola yang sama dengan guru_direktori_nasional.
     */
    public function up(): void
    {
        Schema::create('siswa_direktori_nasional', function (Blueprint $table) {
            $table->id();
            $table->string('sekolah_id');
            $table->foreign('sekolah_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unsignedBigInteger('siswa_id');
            $table->string('nis', 20);
            $table->string('nama');
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('kelas')->nullable();
            $table->unsignedSmallInteger('tahun_masuk')->nullable();
            $table->string('status')->default('aktif');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['sekolah_id', 'siswa_id']);
            $table->index('nama');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('siswa_direktori_nasional');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penerbitan_rapor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->enum('status', ['draft', 'diterbitkan', 'dicabut'])->default('draft');
            $table->string('nomor_rapor', 60)->nullable()->unique();
            $table->date('tanggal_terbit')->nullable();
            // Isi rapor dibekukan saat digenerate/diterbitkan agar cetakan tetap sama.
            $table->json('konten')->nullable();
            $table->timestamp('tanggal_generate')->nullable();
            $table->foreignId('digenerate_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('diterbitkan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_dicabut')->nullable();
            $table->foreignId('dicabut_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('alasan_cabut')->nullable();
            $table->timestamps();

            $table->unique(['siswa_id', 'tahun_ajaran_id', 'semester'], 'penerbitan_rapor_unik');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penerbitan_rapor');
    }
};

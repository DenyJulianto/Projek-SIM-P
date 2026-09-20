<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verifikasi_nilai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            // Keputusan terakhir. "kedaluwarsa" = persetujuan gugur karena kunci nilai dibuka kembali.
            $table->enum('status', ['disetujui', 'ditolak', 'perlu_perbaikan', 'kedaluwarsa']);
            $table->foreignId('verifikator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_verifikasi')->nullable();
            $table->text('catatan')->nullable();
            // Ringkasan hasil pemeriksaan otomatis saat keputusan diambil.
            $table->json('hasil_pemeriksaan')->nullable();
            $table->timestamps();

            $table->unique(['tahun_ajaran_id', 'semester', 'kelas_id', 'mata_pelajaran_id'], 'verifikasi_nilai_unik');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verifikasi_nilai');
    }
};

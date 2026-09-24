<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_tahunan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $table->string('fase', 10)->nullable();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            $table->foreignId('guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->unsignedTinyInteger('minggu_efektif_ganjil')->nullable();
            $table->unsignedTinyInteger('minggu_efektif_genap')->nullable();
            $table->text('catatan')->nullable();
            $table->enum('status_dokumen', ['draft', 'diajukan', 'terverifikasi'])->default('draft');
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_verifikasi')->nullable();
            $table->text('catatan_verifikasi')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('program_tahunan_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_tahunan_id')->constrained('program_tahunan')->cascadeOnDelete();
            $table->foreignId('tujuan_pembelajaran_id')->nullable()->constrained('tujuan_pembelajaran')->nullOnDelete();
            $table->foreignId('indikator_id')->nullable()->constrained('tp_indikator')->nullOnDelete();
            $table->string('materi')->nullable();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->unsignedTinyInteger('bulan_mulai');
            $table->unsignedTinyInteger('bulan_selesai');
            $table->unsignedSmallInteger('alokasi_jp')->default(0);
            $table->enum('status_pelaksanaan', ['belum_terlaksana', 'berjalan', 'terlaksana', 'ditunda'])->default('belum_terlaksana');
            $table->text('catatan')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_tahunan_item');
        Schema::dropIfExists('program_tahunan');
    }
};

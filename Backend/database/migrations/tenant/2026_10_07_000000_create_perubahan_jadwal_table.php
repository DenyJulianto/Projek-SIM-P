<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perubahan_jadwal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jadwal_id')->nullable()->constrained('jadwal_pelajaran')->nullOnDelete();
            $table->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            $table->enum('jenis', ['sementara', 'permanen'])->default('sementara');
            // sementara: tanggal kemunculan jadwal lama yang diubah; permanen: berlaku mulai tanggal ini.
            $table->date('tanggal_perubahan');
            // hanya sementara: tanggal jadwal dipindah ke (default sama dengan tanggal_perubahan).
            $table->date('tanggal_baru')->nullable();

            $table->enum('hari_lama', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']);
            $table->time('jam_mulai_lama');
            $table->time('jam_selesai_lama');
            $table->foreignId('guru_lama_id')->constrained('guru')->cascadeOnDelete();
            $table->string('ruang_lama', 100)->nullable();

            $table->enum('hari_baru', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']);
            $table->time('jam_mulai_baru');
            $table->time('jam_selesai_baru');
            $table->foreignId('guru_baru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('ruang_baru', 100)->nullable();

            $table->string('alasan');
            $table->text('catatan')->nullable();
            $table->enum('status', ['menunggu_persetujuan', 'disetujui', 'ditolak', 'dibatalkan'])->default('menunggu_persetujuan');
            $table->text('catatan_keputusan')->nullable();
            $table->foreignId('diputuskan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_keputusan')->nullable();
            $table->timestamp('diterapkan_at')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tanggal_perubahan', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perubahan_jadwal');
    }
};

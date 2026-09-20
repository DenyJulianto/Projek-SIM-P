<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guru_pengganti', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->foreignId('jadwal_id')->nullable()->constrained('jadwal_pelajaran')->nullOnDelete();
            $table->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->foreignId('guru_berhalangan_id')->constrained('guru')->cascadeOnDelete();
            $table->foreignId('guru_pengganti_id')->constrained('guru')->cascadeOnDelete();
            $table->string('alasan');
            $table->enum('status', ['menunggu_persetujuan', 'disetujui', 'ditolak', 'dibatalkan'])->default('menunggu_persetujuan');
            $table->text('catatan')->nullable();
            $table->text('catatan_keputusan')->nullable();
            $table->foreignId('diputuskan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_keputusan')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tanggal', 'status']);
        });

        // Tabel standar notifikasi database Laravel, dipakai untuk memberi tahu
        // guru berhalangan/pengganti langsung di dashboard masing-masing.
        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type');
                $table->morphs('notifiable');
                $table->text('data');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('guru_pengganti');
    }
};

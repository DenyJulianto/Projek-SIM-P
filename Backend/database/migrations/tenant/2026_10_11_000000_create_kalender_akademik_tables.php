<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pengaturan kalender per tahun ajaran. Hari efektif/libur TIDAK disimpan
        // di sini — dibaca dari modul Hari Efektif agar tidak terjadi duplikasi.
        Schema::create('kalender_akademik', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->unique()->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->enum('status', ['draft', 'aktif', 'arsip'])->default('draft');
            $table->text('catatan')->nullable();
            $table->foreignId('diubah_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('kalender_kegiatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->string('judul');
            $table->enum('kategori', [
                'pembelajaran', 'ujian', 'penilaian', 'rapat', 'kegiatan_sekolah',
                'kegiatan_siswa', 'libur', 'hari_besar', 'administrasi', 'lainnya',
            ])->default('lainnya');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->time('waktu_mulai')->nullable();
            $table->time('waktu_selesai')->nullable();
            $table->foreignId('penanggung_jawab_guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->string('penanggung_jawab')->nullable();
            $table->string('lokasi')->nullable();
            $table->text('peserta')->nullable();
            $table->text('keterangan')->nullable();
            $table->enum('status', ['direncanakan', 'berlangsung', 'selesai', 'ditunda', 'dibatalkan'])->default('direncanakan');
            $table->unsignedTinyInteger('pengingat_hari')->nullable();
            $table->timestamp('pengingat_dikirim_at')->nullable();
            $table->foreignId('disalin_dari_id')->nullable()->constrained('kalender_kegiatan')->nullOnDelete();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tahun_ajaran_id', 'tanggal_mulai']);
        });

        Schema::create('kalender_lampiran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')->constrained('kalender_kegiatan')->cascadeOnDelete();
            $table->string('nama_asli');
            $table->string('path');
            $table->string('mime', 100)->nullable();
            $table->unsignedInteger('ukuran')->default(0);
            $table->foreignId('diunggah_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kalender_lampiran');
        Schema::dropIfExists('kalender_kegiatan');
        Schema::dropIfExists('kalender_akademik');
    }
};

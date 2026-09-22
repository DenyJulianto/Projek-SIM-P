<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ekskul', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->string('nama');
            $table->enum('kategori', ['olahraga', 'seni', 'akademik', 'keagamaan', 'bahasa', 'teknologi', 'kepemimpinan', 'keterampilan', 'lainnya'])->default('lainnya');
            $table->text('deskripsi')->nullable();
            $table->foreignId('pembina_guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->string('pelatih')->nullable();
            $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'])->nullable();
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();
            $table->string('tempat')->nullable();
            $table->unsignedSmallInteger('kuota')->nullable();
            $table->text('persyaratan')->nullable();
            // Aspek penilaian yang dipakai ekskul ini (tidak harus semua aspek).
            $table->json('aspek_penilaian')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->string('logo_path')->nullable();
            $table->foreignId('disalin_dari_id')->nullable()->constrained('ekskul')->nullOnDelete();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['tahun_ajaran_id', 'semester']);
        });

        Schema::create('ekskul_anggota', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ekskul_id')->constrained('ekskul')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->date('tanggal_bergabung');
            $table->enum('status', ['aktif', 'keluar', 'pindah'])->default('aktif');
            $table->date('tanggal_keluar')->nullable();
            $table->string('alasan_keluar')->nullable();
            $table->foreignId('dipindah_ke_id')->nullable()->constrained('ekskul')->nullOnDelete();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['ekskul_id', 'status']);
            $table->index('siswa_id');
        });

        Schema::create('ekskul_kegiatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ekskul_id')->constrained('ekskul')->cascadeOnDelete();
            $table->enum('jenis', ['rutin', 'khusus', 'lomba', 'pertunjukan', 'pertemuan', 'lainnya'])->default('rutin');
            $table->date('tanggal');
            $table->string('hari', 10);
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->string('tempat')->nullable();
            $table->foreignId('pembina_guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->string('pelaksana')->nullable();
            $table->string('materi')->nullable();
            $table->text('keterangan')->nullable();
            $table->enum('status', ['terjadwal', 'terlaksana', 'dibatalkan'])->default('terjadwal');
            $table->string('alasan_batal')->nullable();
            // Jadwal semula bila kegiatan pernah dijadwal ulang: {tanggal, jam_mulai, jam_selesai, tempat, alasan}.
            $table->json('jadwal_semula')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['ekskul_id', 'tanggal']);
            $table->index('tanggal');
        });

        Schema::create('ekskul_presensi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')->constrained('ekskul_kegiatan')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->enum('status', ['hadir', 'izin', 'sakit', 'alpha']);
            $table->string('keterangan')->nullable();
            $table->foreignId('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['kegiatan_id', 'siswa_id']);
        });

        Schema::create('ekskul_penilaian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ekskul_id')->constrained('ekskul')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->json('aspek')->nullable();
            $table->decimal('nilai', 5, 2)->nullable();
            $table->string('predikat', 2)->nullable();
            $table->text('deskripsi')->nullable();
            $table->enum('status', ['draft', 'tervalidasi', 'terkunci'])->default('draft');
            $table->foreignId('dinilai_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('divalidasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_validasi')->nullable();
            $table->foreignId('dikunci_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_kunci')->nullable();
            $table->timestamps();
            $table->unique(['ekskul_id', 'siswa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ekskul_penilaian');
        Schema::dropIfExists('ekskul_presensi');
        Schema::dropIfExists('ekskul_kegiatan');
        Schema::dropIfExists('ekskul_anggota');
        Schema::dropIfExists('ekskul');
    }
};

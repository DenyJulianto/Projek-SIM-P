<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ppdb_periode', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->string('nama');
            $table->string('jenjang', 20)->nullable();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->unsignedInteger('kuota')->default(0);
            $table->unsignedSmallInteger('jumlah_rombel')->nullable();
            $table->unsignedSmallInteger('kapasitas_rombel')->nullable();
            $table->date('jadwal_seleksi')->nullable();
            $table->date('jadwal_pengumuman')->nullable();
            $table->date('daftar_ulang_mulai')->nullable();
            $table->date('daftar_ulang_selesai')->nullable();
            $table->enum('status', ['draft', 'dibuka', 'ditutup', 'seleksi', 'pengumuman', 'daftar_ulang', 'selesai'])->default('draft');
            $table->timestamp('pengumuman_terbit_at')->nullable();
            $table->foreignId('pengumuman_terbit_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ppdb_jalur', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppdb_periode_id')->constrained('ppdb_periode')->cascadeOnDelete();
            $table->string('nama');
            $table->unsignedInteger('kuota')->default(0);
            $table->text('deskripsi')->nullable();
            // [{nama, bobot, maks}] — kriteria seleksi yang dikonfigurasi sekolah.
            $table->json('kriteria')->nullable();
            $table->decimal('nilai_minimal', 6, 2)->nullable();
            $table->boolean('aktif')->default(true);
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('ppdb_persyaratan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppdb_periode_id')->constrained('ppdb_periode')->cascadeOnDelete();
            $table->foreignId('ppdb_jalur_id')->nullable()->constrained('ppdb_jalur')->cascadeOnDelete();
            $table->enum('tahap', ['pendaftaran', 'daftar_ulang'])->default('pendaftaran');
            $table->string('nama');
            $table->boolean('wajib')->default(true);
            $table->text('keterangan')->nullable();
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('ppdb_pendaftar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppdb_periode_id')->constrained('ppdb_periode')->cascadeOnDelete();
            $table->foreignId('ppdb_jalur_id')->constrained('ppdb_jalur')->restrictOnDelete();
            $table->string('nomor_pendaftaran', 40)->unique();
            $table->enum('status_pendaftaran', ['terdaftar', 'dibatalkan'])->default('terdaftar');

            $table->string('nik', 16);
            $table->string('nisn', 10)->nullable();
            $table->string('nama_lengkap');
            $table->string('nama_panggilan')->nullable();
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('agama', 30)->nullable();
            $table->text('alamat')->nullable();
            $table->string('no_hp', 20)->nullable();
            $table->string('email')->nullable();

            $table->string('nama_ayah')->nullable();
            $table->string('nama_ibu')->nullable();
            $table->string('nama_wali')->nullable();
            $table->string('nik_orang_tua', 16)->nullable();
            $table->string('pekerjaan_orang_tua')->nullable();
            $table->string('penghasilan_orang_tua')->nullable();
            $table->string('telepon_orang_tua', 20)->nullable();

            $table->string('sekolah_asal')->nullable();
            $table->string('npsn_sekolah_asal', 12)->nullable();
            $table->unsignedSmallInteger('tahun_lulus')->nullable();
            $table->string('nomor_ijazah', 60)->nullable();
            $table->string('pilihan_program')->nullable();

            $table->enum('status_verifikasi', ['belum', 'diverifikasi', 'perlu_perbaikan', 'ditolak'])->default('belum');
            $table->json('hasil_verifikasi')->nullable();
            $table->text('catatan_verifikasi')->nullable();
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_verifikasi')->nullable();

            $table->json('nilai_seleksi')->nullable();
            $table->decimal('skor', 7, 2)->nullable();
            $table->enum('status_seleksi', ['belum', 'lolos', 'tidak_lolos'])->default('belum');
            $table->text('catatan_seleksi')->nullable();
            $table->foreignId('seleksi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_seleksi')->nullable();
            $table->timestamp('pemberitahuan_hasil_at')->nullable();

            $table->enum('status_daftar_ulang', ['belum', 'sudah', 'dibatalkan'])->default('belum');
            $table->json('checklist_daftar_ulang')->nullable();
            $table->timestamp('tanggal_daftar_ulang')->nullable();
            $table->text('catatan_daftar_ulang')->nullable();
            $table->foreignId('petugas_daftar_ulang_id')->nullable()->constrained('users')->nullOnDelete();

            $table->enum('status_penerimaan', ['belum', 'diterima'])->default('belum');
            $table->timestamp('tanggal_diterima')->nullable();
            $table->string('nis_terbit', 20)->nullable();
            $table->unsignedSmallInteger('tahun_masuk_terbit')->nullable();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->foreignId('siswa_id')->nullable()->constrained('siswa')->nullOnDelete();
            $table->timestamp('tanggal_import')->nullable();

            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['ppdb_periode_id', 'ppdb_jalur_id']);
        });

        Schema::create('ppdb_dokumen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppdb_pendaftar_id')->constrained('ppdb_pendaftar')->cascadeOnDelete();
            $table->foreignId('ppdb_persyaratan_id')->nullable()->constrained('ppdb_persyaratan')->nullOnDelete();
            $table->string('nama');
            $table->string('nama_asli');
            $table->string('path');
            $table->string('mime', 100);
            $table->unsignedInteger('ukuran');
            $table->enum('status', ['menunggu', 'sah', 'tidak_sah'])->default('menunggu');
            $table->text('catatan')->nullable();
            $table->foreignId('diperiksa_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_periksa')->nullable();
            $table->foreignId('diunggah_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppdb_dokumen');
        Schema::dropIfExists('ppdb_pendaftar');
        Schema::dropIfExists('ppdb_persyaratan');
        Schema::dropIfExists('ppdb_jalur');
        Schema::dropIfExists('ppdb_periode');
    }
};

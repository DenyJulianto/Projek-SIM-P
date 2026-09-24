<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Register mutasi. Siswa masuk lewat PPDB dan pindah rombel tidak dicatat di sini:
        // keduanya sudah tersimpan di modul asalnya dan dibaca langsung oleh laporan.
        Schema::create('mutasi_siswa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->enum('jenis', ['masuk', 'keluar', 'pindah_sekolah']);
            $table->date('tanggal');
            $table->string('asal_sekolah')->nullable();
            $table->string('tujuan_sekolah')->nullable();
            $table->string('alasan')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('nomor_surat', 60)->nullable()->unique();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->enum('status', ['tercatat', 'dibatalkan'])->default('tercatat');
            $table->string('alasan_batal')->nullable();
            $table->boolean('status_siswa_diterapkan')->default(false);
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['tanggal', 'jenis']);
        });

        Schema::create('laporan_kesiswaan_pengaturan', function (Blueprint $table) {
            $table->id();
            $table->string('kunci', 40)->unique();
            $table->json('nilai')->nullable();
            $table->timestamps();
        });

        // Arsip menyimpan snapshot isi laporan; Excel/PDF/cetak ulang dibuat dari snapshot yang sama.
        Schema::create('laporan_kesiswaan_arsip', function (Blueprint $table) {
            $table->id();
            $table->string('jenis', 30);
            $table->string('nama');
            $table->enum('format', ['xlsx', 'pdf', 'cetak']);
            $table->foreignId('tahun_ajaran_id')->nullable()->constrained('tahun_ajaran')->nullOnDelete();
            $table->enum('semester', ['ganjil', 'genap'])->nullable();
            $table->string('periode', 80)->nullable();
            $table->json('parameter')->nullable();
            $table->string('snapshot_path')->nullable();
            $table->unsignedInteger('ukuran')->nullable();
            $table->unsignedInteger('jumlah_baris')->default(0);
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['jenis', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_kesiswaan_arsip');
        Schema::dropIfExists('laporan_kesiswaan_pengaturan');
        Schema::dropIfExists('mutasi_siswa');
    }
};

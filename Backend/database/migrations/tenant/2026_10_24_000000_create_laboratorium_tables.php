<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laboratorium', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('kategori', 100)->nullable();
            $table->foreignId('penanggung_jawab_guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->unsignedInteger('kapasitas')->nullable();
            $table->string('foto_path')->nullable();
            $table->text('deskripsi')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('jadwal_lab', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laboratorium_id')->constrained('laboratorium')->cascadeOnDelete();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->foreignId('guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->string('keterangan')->nullable();
            $table->enum('status', ['terjadwal', 'berlangsung', 'selesai', 'dibatalkan'])->default('terjadwal');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['laboratorium_id', 'tanggal']);
        });

        Schema::create('peminjaman_alat', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_transaksi', 40)->unique();
            $table->foreignId('peminjam_user_id')->constrained('users')->restrictOnDelete();
            $table->string('jabatan_kelas')->nullable();
            $table->text('tujuan_penggunaan')->nullable();
            $table->date('tanggal_pinjam');
            $table->date('tanggal_kembali_rencana');
            $table->date('tanggal_kembali_aktual')->nullable();
            $table->foreignId('petugas_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('disetujui_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('disetujui_at')->nullable();
            $table->text('catatan_kerusakan')->nullable();
            $table->enum('status', ['diajukan', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan', 'terlambat', 'rusak', 'hilang'])->default('diajukan');
            $table->timestamps();
        });

        Schema::create('peminjaman_alat_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peminjaman_alat_id')->constrained('peminjaman_alat')->cascadeOnDelete();
            $table->foreignId('inventaris_id')->constrained('inventaris')->restrictOnDelete();
            $table->unsignedInteger('jumlah')->default(1);
            $table->string('kondisi_sebelum', 30)->nullable();
            $table->string('kondisi_setelah', 30)->nullable();
            $table->timestamps();
        });

        Schema::create('pemeliharaan_alat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventaris_id')->constrained('inventaris')->cascadeOnDelete();
            $table->enum('jenis_pemeliharaan', ['rutin', 'perbaikan', 'kalibrasi', 'pembersihan', 'penggantian_komponen']);
            $table->date('tanggal');
            $table->string('teknisi')->nullable();
            $table->string('kondisi_sebelum', 30)->nullable();
            $table->text('tindakan')->nullable();
            $table->string('kondisi_setelah', 30)->nullable();
            $table->decimal('biaya', 12, 2)->nullable();
            $table->text('catatan')->nullable();
            $table->date('tanggal_berikutnya')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('bahan_lab', function (Blueprint $table) {
            $table->id();
            $table->string('kode_bahan', 30)->unique();
            $table->string('nama_bahan');
            $table->string('jenis_kategori', 100)->nullable();
            $table->string('satuan', 30)->default('unit');
            $table->decimal('jumlah_stok', 12, 2)->default(0);
            $table->decimal('stok_minimum', 12, 2)->default(0);
            $table->foreignId('laboratorium_id')->nullable()->constrained('laboratorium')->nullOnDelete();
            $table->string('lokasi_penyimpanan')->nullable();
            $table->date('tanggal_masuk')->nullable();
            $table->date('tanggal_kedaluwarsa')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('bahan_lab_mutasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bahan_id')->constrained('bahan_lab')->cascadeOnDelete();
            $table->enum('jenis', ['masuk', 'keluar', 'penyesuaian']);
            $table->decimal('jumlah', 12, 2);
            $table->decimal('stok_setelah', 12, 2);
            $table->text('keterangan')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal');
            $table->timestamps();
        });

        Schema::create('kegiatan_lab', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kegiatan');
            $table->enum('jenis_kegiatan', ['praktikum', 'pelatihan', 'ujian_praktik', 'penelitian', 'workshop', 'kegiatan_guru', 'kegiatan_siswa']);
            $table->foreignId('laboratorium_id')->constrained('laboratorium')->cascadeOnDelete();
            $table->date('tanggal');
            $table->time('jam_mulai')->nullable();
            $table->time('jam_selesai')->nullable();
            $table->string('penanggung_jawab')->nullable();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->string('peserta_lainnya')->nullable();
            $table->foreignId('mata_pelajaran_id')->nullable()->constrained('mata_pelajaran')->nullOnDelete();
            $table->text('tujuan')->nullable();
            $table->text('peralatan_digunakan')->nullable();
            $table->text('bahan_digunakan')->nullable();
            $table->string('dokumentasi_path')->nullable();
            $table->text('catatan')->nullable();
            $table->enum('status', ['direncanakan', 'berlangsung', 'selesai', 'dibatalkan'])->default('direncanakan');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatan_lab');
        Schema::dropIfExists('bahan_lab_mutasi');
        Schema::dropIfExists('bahan_lab');
        Schema::dropIfExists('pemeliharaan_alat');
        Schema::dropIfExists('peminjaman_alat_item');
        Schema::dropIfExists('peminjaman_alat');
        Schema::dropIfExists('jadwal_lab');
        Schema::dropIfExists('laboratorium');
    }
};

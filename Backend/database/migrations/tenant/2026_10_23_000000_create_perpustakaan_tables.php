<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buku', function (Blueprint $table) {
            $table->id();
            $table->string('isbn', 20)->nullable();
            $table->string('judul');
            $table->string('penulis')->nullable();
            $table->string('penerbit')->nullable();
            $table->unsignedSmallInteger('tahun_terbit')->nullable();
            $table->string('kategori', 100)->nullable();
            $table->string('subjek', 150)->nullable();
            $table->string('bahasa', 50)->default('Indonesia');
            $table->string('edisi', 50)->nullable();
            $table->text('sinopsis')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('lokasi_rak', 100)->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['kategori']);
            $table->index(['penerbit']);
        });

        Schema::create('eksemplar_buku', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buku_id')->constrained('buku')->cascadeOnDelete();
            $table->string('kode_inventaris', 50)->unique();
            $table->string('barcode', 50)->unique();
            $table->unsignedInteger('nomor_eksemplar');
            $table->enum('kondisi', ['baik', 'rusak_ringan', 'rusak_berat', 'hilang'])->default('baik');
            $table->string('lokasi', 100)->nullable();
            $table->enum('status', ['tersedia', 'dipinjam', 'rusak', 'hilang', 'nonaktif'])->default('tersedia');
            $table->timestamps();
            $table->unique(['buku_id', 'nomor_eksemplar']);
        });

        Schema::create('anggota_perpustakaan', function (Blueprint $table) {
            $table->id();
            $table->enum('jenis_anggota', ['siswa', 'guru', 'pegawai']);
            $table->foreignId('siswa_id')->nullable()->unique()->constrained('siswa')->nullOnDelete();
            $table->foreignId('guru_id')->nullable()->unique()->constrained('guru')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('nip_pegawai', 30)->nullable();
            $table->string('nomor_kartu', 30)->unique();
            $table->date('tanggal_terdaftar');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });

        Schema::create('peminjaman_buku', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_transaksi', 40)->unique();
            $table->foreignId('anggota_id')->constrained('anggota_perpustakaan')->restrictOnDelete();
            $table->foreignId('petugas_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal_pinjam');
            $table->date('tanggal_jatuh_tempo');
            $table->enum('status', ['dipinjam', 'sebagian_kembali', 'selesai', 'dibatalkan'])->default('dipinjam');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        Schema::create('peminjaman_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peminjaman_id')->constrained('peminjaman_buku')->cascadeOnDelete();
            $table->foreignId('eksemplar_id')->constrained('eksemplar_buku')->restrictOnDelete();
            $table->date('tanggal_kembali_aktual')->nullable();
            $table->enum('kondisi_kembali', ['baik', 'rusak_ringan', 'rusak_berat', 'hilang'])->nullable();
            $table->text('catatan_kerusakan')->nullable();
            $table->enum('status', ['dipinjam', 'dikembalikan', 'hilang'])->default('dipinjam');
            $table->foreignId('diproses_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('reservasi_buku', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_reservasi', 40)->unique();
            $table->foreignId('anggota_id')->constrained('anggota_perpustakaan')->cascadeOnDelete();
            $table->foreignId('buku_id')->constrained('buku')->cascadeOnDelete();
            $table->date('tanggal_reservasi');
            $table->date('batas_pengambilan');
            $table->enum('status', ['menunggu', 'siap_diambil', 'selesai', 'dibatalkan', 'kadaluarsa'])->default('menunggu');
            $table->timestamps();
        });

        Schema::create('denda_perpustakaan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anggota_id')->constrained('anggota_perpustakaan')->restrictOnDelete();
            $table->foreignId('peminjaman_item_id')->nullable()->constrained('peminjaman_item')->nullOnDelete();
            $table->enum('jenis_denda', ['keterlambatan', 'kerusakan', 'kehilangan', 'lainnya']);
            $table->decimal('jumlah', 10, 2);
            $table->date('tanggal');
            $table->enum('status_pembayaran', ['belum_bayar', 'lunas'])->default('belum_bayar');
            $table->foreignId('petugas_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamp('dibayar_at')->nullable();
            $table->timestamps();
        });

        Schema::create('kegiatan_perpustakaan', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kegiatan');
            $table->enum('jenis_kegiatan', ['literasi', 'kunjungan', 'bedah_buku', 'pameran_buku', 'program_membaca', 'lainnya']);
            $table->date('tanggal');
            $table->string('lokasi')->nullable();
            $table->string('penanggung_jawab')->nullable();
            $table->unsignedInteger('jumlah_peserta')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('dokumentasi_path')->nullable();
            $table->enum('status', ['direncanakan', 'berlangsung', 'selesai', 'dibatalkan'])->default('direncanakan');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kegiatan_perpustakaan');
        Schema::dropIfExists('denda_perpustakaan');
        Schema::dropIfExists('reservasi_buku');
        Schema::dropIfExists('peminjaman_item');
        Schema::dropIfExists('peminjaman_buku');
        Schema::dropIfExists('anggota_perpustakaan');
        Schema::dropIfExists('eksemplar_buku');
        Schema::dropIfExists('buku');
    }
};

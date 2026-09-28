<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom tambahan agar peralatan laboratorium tetap memakai tabel `inventaris`
 * yang sama dengan Sarpras (bukan tabel terpisah), sesuai permintaan agar
 * inventaris lab tidak berdiri sendiri dari SARANA → Inventaris. Kolom
 * `kondisi_lab` menampung nilai kondisi versi lab (baik/rusak_ringan/
 * rusak_berat/dalam_perbaikan/hilang/tidak_layak) tanpa mengubah kolom
 * `kondisi` bawaan (enum 3 nilai) yang masih dipakai tampilan Sarpras umum.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventaris', function (Blueprint $table) {
            $table->string('merk')->nullable()->after('kategori');
            $table->string('tipe_model')->nullable()->after('merk');
            $table->string('nomor_seri', 100)->nullable()->after('tipe_model');
            $table->unsignedSmallInteger('tahun_pengadaan')->nullable()->after('tanggal_perolehan');
            $table->string('sumber_dana')->nullable()->after('tahun_pengadaan');
            $table->string('satuan', 30)->default('unit')->after('jumlah');
            $table->foreignId('laboratorium_id')->nullable()->after('lokasi')->constrained('laboratorium')->nullOnDelete();
            $table->decimal('harga', 14, 2)->nullable()->after('sumber_dana');
            $table->string('barcode', 50)->nullable()->unique()->after('kode_barang');
            $table->string('kondisi_lab', 30)->nullable()->after('kondisi');
        });
    }

    public function down(): void
    {
        Schema::table('inventaris', function (Blueprint $table) {
            $table->dropConstrainedForeignId('laboratorium_id');
            $table->dropColumn(['merk', 'tipe_model', 'nomor_seri', 'tahun_pengadaan', 'sumber_dana', 'satuan', 'harga', 'barcode', 'kondisi_lab']);
        });
    }
};

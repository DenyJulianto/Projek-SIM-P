<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kelengkapan data Pelanggaran & Prestasi yang dibutuhkan Rekap Pembinaan. Semua kolom opsional.
        Schema::table('pelanggaran', function (Blueprint $table) {
            $table->string('kategori', 60)->nullable()->after('jenis');
            $table->unsignedSmallInteger('poin')->nullable()->after('tingkat');
            $table->string('status', 20)->default('aktif')->after('tindakan');
            $table->text('catatan')->nullable()->after('status');
            $table->foreignId('dicatat_oleh')->nullable()->after('catatan')->constrained('users')->nullOnDelete();
        });

        Schema::table('prestasi', function (Blueprint $table) {
            $table->string('bidang', 60)->nullable()->after('judul');
            $table->string('jenis', 20)->nullable()->after('bidang');
            $table->string('penyelenggara')->nullable()->after('tingkat');
            $table->string('peringkat', 100)->nullable()->after('penyelenggara');
            $table->foreignId('dicatat_oleh')->nullable()->after('status')->constrained('users')->nullOnDelete();
        });

        Schema::create('pembinaan_tindak_lanjut', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('pelanggaran_id')->nullable()->constrained('pelanggaran')->nullOnDelete();
            $table->date('tanggal_pembinaan');
            $table->string('jenis_tindakan', 100);
            $table->string('pembina', 150);
            $table->text('catatan')->nullable();
            $table->text('rekomendasi')->nullable();
            $table->date('tanggal_tindak_lanjut')->nullable();
            $table->string('status', 20)->default('direncanakan');
            $table->text('catatan_internal')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['siswa_id', 'tanggal_pembinaan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembinaan_tindak_lanjut');

        Schema::table('prestasi', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dicatat_oleh');
            $table->dropColumn(['bidang', 'jenis', 'penyelenggara', 'peringkat']);
        });

        Schema::table('pelanggaran', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dicatat_oleh');
            $table->dropColumn(['kategori', 'poin', 'status', 'catatan']);
        });
    }
};

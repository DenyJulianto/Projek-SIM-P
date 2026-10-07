<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dokumen pendukung modul ajar milik guru: Silabus, Pemetaan ATP (matriks
 * per pertemuan), dan Jurnal Harian. Satu dokumen per guru, jenis, tahun
 * ajaran, kelas, mata pelajaran, dan semester; isinya baris-baris tabel di
 * kolom `data`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokumen_pendukung', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('jenis', 20);
            $table->foreignId('tahun_ajaran_id')->nullable()->constrained('tahun_ajaran')->nullOnDelete();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->foreignId('mata_pelajaran_id')->nullable()->constrained('mata_pelajaran')->nullOnDelete();
            $table->string('semester', 10);
            $table->json('data');
            $table->timestamps();

            $table->index(['guru_id', 'jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumen_pendukung');
    }
};

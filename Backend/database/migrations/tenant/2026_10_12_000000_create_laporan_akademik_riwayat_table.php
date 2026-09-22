<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_akademik_riwayat', function (Blueprint $table) {
            $table->id();
            $table->string('jenis', 30);
            $table->string('judul');
            $table->enum('format', ['xlsx', 'pdf', 'cetak']);
            $table->foreignId('tahun_ajaran_id')->nullable()->constrained('tahun_ajaran')->nullOnDelete();
            $table->enum('semester', ['ganjil', 'genap'])->nullable();
            $table->string('periode', 60)->nullable();
            $table->json('parameter')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_nama')->nullable();
            $table->unsignedInteger('ukuran')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['jenis', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_akademik_riwayat');
    }
};

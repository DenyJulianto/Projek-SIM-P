<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penguncian_nilai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            $table->enum('status', ['terkunci', 'terbuka'])->default('terkunci');
            $table->unsignedTinyInteger('persen_saat_kunci')->nullable();
            $table->unsignedInteger('jumlah_nilai_saat_kunci')->default(0);
            $table->text('catatan_kunci')->nullable();
            $table->foreignId('dikunci_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_kunci')->nullable();
            $table->foreignId('dibuka_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_buka')->nullable();
            $table->text('catatan_buka')->nullable();
            $table->timestamps();

            $table->unique(['tahun_ajaran_id', 'semester', 'kelas_id', 'mata_pelajaran_id'], 'penguncian_nilai_unik');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penguncian_nilai');
    }
};

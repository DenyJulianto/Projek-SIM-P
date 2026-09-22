<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hari_efektif_periode', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->unsignedTinyInteger('hari_sekolah')->default(5);
            $table->enum('status', ['draft', 'final'])->default('draft');
            $table->text('catatan')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tahun_ajaran_id', 'semester']);
        });

        Schema::create('hari_efektif', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->constrained('hari_efektif_periode')->cascadeOnDelete();
            $table->date('tanggal');
            $table->enum('jenis', ['efektif', 'libur', 'kegiatan_sekolah', 'ujian', 'lainnya'])->default('efektif');
            $table->string('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['periode_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hari_efektif');
        Schema::dropIfExists('hari_efektif_periode');
    }
};

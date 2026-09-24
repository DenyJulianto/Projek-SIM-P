<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('struktur_kurikulum', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->string('tingkat', 20);
            $table->string('fase', 10)->nullable();
            $table->string('kurikulum', 100);
            $table->text('keterangan')->nullable();
            $table->boolean('is_aktif')->default(false);
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('struktur_kurikulum_mapel', function (Blueprint $table) {
            $table->id();
            $table->foreignId('struktur_kurikulum_id')->constrained('struktur_kurikulum')->cascadeOnDelete();
            $table->string('kelompok', 100);
            $table->foreignId('mata_pelajaran_id')->nullable()->constrained('mata_pelajaran')->nullOnDelete();
            $table->string('nama_custom')->nullable();
            $table->enum('jenis', ['wajib', 'pilihan'])->default('wajib');
            $table->boolean('is_muatan_lokal')->default(false);
            $table->boolean('is_projek')->default(false);
            $table->unsignedSmallInteger('jp_per_minggu')->default(0);
            $table->unsignedSmallInteger('alokasi_jp_ganjil')->nullable();
            $table->unsignedSmallInteger('alokasi_jp_genap')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('struktur_kurikulum_mapel');
        Schema::dropIfExists('struktur_kurikulum');
    }
};

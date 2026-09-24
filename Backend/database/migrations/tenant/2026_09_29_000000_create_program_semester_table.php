<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_semester', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            $table->foreignId('guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('program_semester_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_semester_id')->constrained('program_semester')->cascadeOnDelete();
            $table->foreignId('tujuan_pembelajaran_id')->nullable()->constrained('tujuan_pembelajaran')->nullOnDelete();
            $table->string('materi')->nullable();
            $table->unsignedSmallInteger('alokasi_jp')->default(0);
            $table->unsignedTinyInteger('minggu_ke');
            $table->unsignedTinyInteger('bulan');
            $table->text('rencana_pembelajaran')->nullable();
            $table->enum('status_pelaksanaan', ['belum_terlaksana', 'berjalan', 'terlaksana', 'ditunda'])->default('belum_terlaksana');
            $table->text('catatan')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_semester_item');
        Schema::dropIfExists('program_semester');
    }
};

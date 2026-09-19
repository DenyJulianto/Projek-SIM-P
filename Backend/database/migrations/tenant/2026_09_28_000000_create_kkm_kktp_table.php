<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kkm_kktp', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajaran')->cascadeOnDelete();
            $table->foreignId('mata_pelajaran_id')->constrained('mata_pelajaran')->cascadeOnDelete();
            $table->string('fase', 10);
            $table->string('tingkat', 20)->nullable();
            $table->enum('semester', ['ganjil', 'genap']);
            $table->unsignedTinyInteger('nilai_batas')->nullable();
            $table->text('kriteria_ketercapaian')->nullable();
            $table->enum('status', ['draft', 'aktif', 'nonaktif'])->default('draft');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('kkm_kktp_tp', function (Blueprint $table) {
            $table->foreignId('kkm_kktp_id')->constrained('kkm_kktp')->cascadeOnDelete();
            $table->foreignId('tujuan_pembelajaran_id')->constrained('tujuan_pembelajaran')->cascadeOnDelete();
            $table->primary(['kkm_kktp_id', 'tujuan_pembelajaran_id']);
        });

        Schema::create('kkm_kktp_indikator', function (Blueprint $table) {
            $table->foreignId('kkm_kktp_id')->constrained('kkm_kktp')->cascadeOnDelete();
            $table->foreignId('tp_indikator_id')->constrained('tp_indikator')->cascadeOnDelete();
            $table->primary(['kkm_kktp_id', 'tp_indikator_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kkm_kktp_indikator');
        Schema::dropIfExists('kkm_kktp_tp');
        Schema::dropIfExists('kkm_kktp');
    }
};

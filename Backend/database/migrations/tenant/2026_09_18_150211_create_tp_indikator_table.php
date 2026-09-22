<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tp_indikator', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tujuan_pembelajaran_id')->constrained('tujuan_pembelajaran')->cascadeOnDelete();
            $table->unsignedInteger('urutan')->default(1);
            $table->text('deskripsi');
            $table->text('kriteria_ketercapaian')->nullable();
            $table->enum('status_ketercapaian', ['belum_tercapai', 'tercapai'])->default('belum_tercapai');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tp_indikator');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ujian_jawaban', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ujian_attempt_id')->constrained('ujian_attempt')->cascadeOnDelete();
            $table->foreignId('ujian_soal_id')->constrained('ujian_soal')->cascadeOnDelete();
            $table->enum('jawaban_dipilih', ['a', 'b', 'c', 'd'])->nullable();
            $table->boolean('benar')->nullable();
            $table->timestamps();
            $table->unique(['ujian_attempt_id', 'ujian_soal_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ujian_jawaban');
    }
};

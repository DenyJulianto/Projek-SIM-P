<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('struktur_kelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_id')->constrained('kelas')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->string('jabatan');
            $table->timestamps();

            $table->unique(['kelas_id', 'siswa_id', 'jabatan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('struktur_kelas');
    }
};

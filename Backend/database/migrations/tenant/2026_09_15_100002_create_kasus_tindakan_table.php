<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kasus_tindakan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kasus_id')->constrained('kasus_siswa')->cascadeOnDelete();
            $table->date('tanggal');
            $table->text('deskripsi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kasus_tindakan');
    }
};

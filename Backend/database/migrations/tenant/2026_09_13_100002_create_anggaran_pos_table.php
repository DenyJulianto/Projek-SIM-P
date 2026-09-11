<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anggaran_pos', function (Blueprint $table) {
            $table->id();
            $table->string('tahun_ajaran', 20);
            $table->string('bidang');
            $table->string('uraian');
            $table->decimal('jumlah_anggaran', 14, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anggaran_pos');
    }
};

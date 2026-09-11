<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('realisasi_anggaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_anggaran_id')->constrained('pengajuan_anggaran')->cascadeOnDelete();
            $table->decimal('jumlah', 14, 2);
            $table->date('tanggal');
            $table->text('keterangan')->nullable();
            $table->foreignId('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realisasi_anggaran');
    }
};

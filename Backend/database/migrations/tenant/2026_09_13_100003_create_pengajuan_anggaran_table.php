<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_anggaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anggaran_pos_id')->nullable()->constrained('anggaran_pos')->nullOnDelete();
            $table->string('judul');
            $table->decimal('jumlah', 14, 2);
            $table->text('keterangan')->nullable();
            $table->enum('status', ['diajukan', 'disetujui', 'ditolak'])->default('diajukan');
            $table->foreignId('diajukan_oleh')->constrained('users')->cascadeOnDelete();
            $table->foreignId('disetujui_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_persetujuan')->nullable();
            $table->timestamp('tanggal_keputusan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_anggaran');
    }
};

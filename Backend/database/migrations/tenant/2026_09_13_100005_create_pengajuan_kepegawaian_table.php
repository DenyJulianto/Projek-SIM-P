<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_kepegawaian', function (Blueprint $table) {
            $table->id();
            $table->enum('jenis', ['rekrutmen', 'promosi', 'mutasi', 'pemberhentian', 'lainnya']);
            $table->string('judul');
            $table->foreignId('guru_id')->nullable()->constrained('guru')->nullOnDelete();
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
        Schema::dropIfExists('pengajuan_kepegawaian');
    }
};

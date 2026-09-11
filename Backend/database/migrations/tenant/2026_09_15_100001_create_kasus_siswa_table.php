<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kasus_siswa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('guru_id')->nullable()->constrained('guru')->nullOnDelete();
            $table->string('judul');
            $table->enum('kategori', ['akademik', 'perilaku', 'sosial', 'keluarga', 'lainnya']);
            $table->enum('tingkat', ['ringan', 'sedang', 'berat']);
            $table->text('deskripsi')->nullable();
            $table->date('tanggal_kejadian');
            $table->enum('status', ['baru', 'proses', 'selesai'])->default('baru');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kasus_siswa');
    }
};

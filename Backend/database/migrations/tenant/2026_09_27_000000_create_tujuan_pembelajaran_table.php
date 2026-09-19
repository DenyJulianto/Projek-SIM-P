<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tujuan_pembelajaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('capaian_pembelajaran_id')->constrained('capaian_pembelajaran')->cascadeOnDelete();
            $table->string('tingkat', 20);
            $table->enum('semester', ['ganjil', 'genap']);
            $table->unsignedInteger('urutan')->default(1);
            $table->text('deskripsi');
            $table->string('materi_terkait')->nullable();
            $table->unsignedSmallInteger('alokasi_waktu')->nullable();
            $table->enum('status', ['draft', 'aktif', 'nonaktif'])->default('draft');
            $table->enum('progres', ['belum_diajarkan', 'berlangsung', 'selesai'])->default('belum_diajarkan');
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tujuan_pembelajaran');
    }
};

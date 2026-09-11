<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lapisan status pengesahan rapor — terpisah dari konten rapor itu
     * sendiri (yang tetap dihitung on-the-fly dari Nilai+Absensi lewat
     * RaporController). Tabel ini hanya melacak status draf → diajukan →
     * disahkan/ditolak per siswa per periode.
     */
    public function up(): void
    {
        Schema::create('rapor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->string('semester', 10);
            $table->string('tahun_ajaran', 20);
            $table->enum('status', ['diajukan', 'disahkan', 'ditolak'])->default('diajukan');
            $table->foreignId('diajukan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('disahkan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamp('tanggal_keputusan')->nullable();
            $table->timestamps();

            $table->unique(['siswa_id', 'semester', 'tahun_ajaran']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rapor');
    }
};

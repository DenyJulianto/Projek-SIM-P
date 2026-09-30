<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Notifikasi dalam aplikasi per pengguna (mis. guru diberi tahu saat
     * siswa keluar dari halaman kuis). `kunci` dipakai untuk menggabungkan
     * kejadian berulang menjadi satu notifikasi yang diperbarui.
     */
    public function up(): void
    {
        Schema::create('notifikasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('jenis', 50);
            $table->string('kunci')->nullable();
            $table->string('judul');
            $table->text('pesan');
            $table->json('data')->nullable();
            $table->unsignedInteger('jumlah')->default(1);
            $table->timestamp('dibaca_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'kunci']);
            $table->index(['user_id', 'dibaca_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifikasi');
    }
};

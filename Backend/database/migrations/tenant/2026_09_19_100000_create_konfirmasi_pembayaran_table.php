<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('konfirmasi_pembayaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tagihan_id')->constrained('tagihan')->cascadeOnDelete();
            $table->foreignId('diajukan_oleh')->constrained('users')->cascadeOnDelete();
            $table->decimal('jumlah', 12, 2);
            $table->date('tanggal_transfer');
            $table->string('metode', 50)->nullable();
            $table->string('bukti_path');
            $table->text('catatan')->nullable();
            $table->enum('status', ['menunggu', 'diverifikasi', 'ditolak'])->default('menunggu');
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_verifikasi')->nullable();
            $table->timestamp('tanggal_verifikasi')->nullable();
            $table->foreignId('pembayaran_id')->nullable()->constrained('pembayaran')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('konfirmasi_pembayaran');
    }
};

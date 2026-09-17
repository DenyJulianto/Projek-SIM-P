<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_mutasi', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->decimal('jumlah', 12, 2);
            $table->string('keterangan')->nullable();
            $table->string('nomor_va', 30)->nullable();
            $table->enum('sumber', ['virtual_account', 'qris', 'lainnya'])->default('lainnya');
            $table->enum('status', ['belum_cocok', 'cocok', 'diabaikan'])->default('belum_cocok');
            $table->foreignId('tagihan_id')->nullable()->constrained('tagihan')->nullOnDelete();
            $table->foreignId('pembayaran_id')->nullable()->constrained('pembayaran')->nullOnDelete();
            $table->foreignId('dicatat_oleh')->constrained('users')->cascadeOnDelete();
            $table->foreignId('dicocokkan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_dicocokkan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_mutasi');
    }
};

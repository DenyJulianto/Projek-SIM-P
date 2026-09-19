<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saldo_transaksi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('diisi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('jenis', ['masuk', 'keluar'])->default('masuk');
            $table->decimal('jumlah', 12, 2);
            $table->decimal('saldo_setelah', 12, 2);
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saldo_transaksi');
    }
};

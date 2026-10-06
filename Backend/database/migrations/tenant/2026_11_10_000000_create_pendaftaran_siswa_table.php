<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pendaftaran mandiri siswa. Bukan data siswa: baru menjadi siswa (beserta
 * akun siswa & orang tua) setelah disetujui admin, sekaligus ditempatkan di kelas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftaran_siswa', function (Blueprint $table) {
            $table->id();
            $table->string('nama_lengkap');
            $table->string('nisn', 10)->index();
            $table->string('nis', 20)->nullable();
            $table->date('tanggal_lahir');
            $table->string('jenis_kelamin', 1);
            $table->string('email')->nullable();
            $table->string('no_hp', 20)->nullable();
            $table->string('nama_wali');
            $table->string('no_hp_wali', 20);
            $table->string('status', 20)->default('menunggu')->index();
            $table->text('alasan_penolakan')->nullable();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->foreignId('siswa_id')->nullable()->constrained('siswa')->nullOnDelete();
            $table->foreignId('diproses_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('diproses_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['nisn', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftaran_siswa');
    }
};

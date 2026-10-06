<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pendaftaran mandiri pendidik & tenaga kependidikan. Bukan akun: baru
 * menjadi akun setelah disetujui admin (lalu dikirimi undangan aktivasi).
 * NIK disimpan terenkripsi; nik_hash dipakai untuk mendeteksi pendaftaran ganda.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftaran_pegawai', function (Blueprint $table) {
            $table->id();
            $table->string('nama_lengkap');
            $table->string('jenis_pegawai', 30);
            $table->string('status_kepegawaian', 20);
            $table->string('nip', 18)->nullable();
            $table->string('nuptk', 16)->nullable();
            $table->text('nik')->nullable();
            $table->string('nik_hash', 64)->nullable()->index();
            $table->string('email');
            $table->string('no_hp', 20);
            $table->string('jabatan')->nullable();
            $table->string('mata_pelajaran')->nullable();
            $table->text('catatan')->nullable();
            $table->string('status', 20)->default('menunggu')->index();
            $table->text('alasan_penolakan')->nullable();
            $table->foreignId('diproses_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('diproses_at')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['email', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftaran_pegawai');
    }
};

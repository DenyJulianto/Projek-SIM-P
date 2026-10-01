<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Profil & riwayat aktivitas akun Super Admin — database CENTRAL saja
 * (bukan tenant/), karena akun Super Admin hanya ada di sini.
 *
 * - profil_super_admin: identitas, kepegawaian/instansi, kontak, dan
 *   preferensi. Satu baris per user.
 * - aktivitas_akun: jejak login (berhasil/gagal), logout, perubahan profil,
 *   dan pergantian password untuk audit akun berakses nasional.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profil_super_admin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            // Identitas pribadi
            $table->string('nip', 30)->nullable();
            $table->text('nik')->nullable(); // terenkripsi
            $table->string('foto')->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('tempat_lahir', 100)->nullable();
            $table->date('tanggal_lahir')->nullable();

            // Kepegawaian / instansi
            $table->string('instansi')->nullable();
            $table->string('unit_kerja')->nullable();
            $table->string('jabatan')->nullable();
            $table->string('pangkat_golongan', 100)->nullable();
            $table->text('alamat_kantor')->nullable();

            // Kontak (email ada di tabel users)
            $table->string('telepon', 30)->nullable();
            $table->string('telepon_kantor', 30)->nullable();

            $table->json('preferensi')->nullable();
            $table->timestamp('password_diganti_at')->nullable();
            $table->timestamps();
        });

        Schema::create('aktivitas_akun', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('aksi', 40);
            $table->string('keterangan')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'aksi']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aktivitas_akun');
        Schema::dropIfExists('profil_super_admin');
    }
};

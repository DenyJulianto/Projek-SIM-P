<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom untuk alur verifikasi registrasi berbasis link (menggantikan kode
 * 6-digit): token disimpan sebagai hash SHA-256, bukan token asli, supaya
 * kalau database bocor token tidak bisa dipakai langsung. Kolom
 * verification_code lama sengaja dibiarkan (tidak dipakai lagi oleh
 * AuthController, tapi tidak dihapus karena tidak ada doctrine/dbal di
 * proyek ini untuk ALTER TABLE yang aman lintas SQLite/MySQL).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email_verification_token', 64)->nullable()->after('email_verified_at');
            $table->timestamp('email_verification_expires_at')->nullable()->after('email_verification_token');
            $table->string('ip_address', 45)->nullable()->after('email_verification_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['email_verification_token', 'email_verification_expires_at', 'ip_address']);
        });
    }
};

<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom untuk alur lupa password berbasis link (menggantikan kode 6-digit):
 * token disimpan sebagai hash SHA-256, bukan token asli. Kolom
 * password_reset_code lama sengaja dibiarkan (tidak dipakai lagi oleh
 * AuthController, tapi tidak dihapus karena tidak ada doctrine/dbal di
 * proyek ini untuk ALTER TABLE yang aman lintas SQLite/MySQL).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password_reset_token', 64)->nullable()->after('password_reset_code_expires_at');
            $table->timestamp('password_reset_expires_at')->nullable()->after('password_reset_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['password_reset_token', 'password_reset_expires_at']);
        });
    }
};

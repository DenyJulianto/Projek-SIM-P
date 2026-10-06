<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Peran aktif disimpan per sesi login (token), bukan per akun — jadi akun
 * yang sama bisa aktif sebagai Wali Kelas di satu perangkat dan sebagai
 * Guru BK di perangkat lain.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->string('active_role', 100)->nullable()->after('abilities');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn('active_role');
        });
    }
};

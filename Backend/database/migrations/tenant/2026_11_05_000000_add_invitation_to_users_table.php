<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Undangan aktivasi akun staf. Link undangan ditandatangani (signed URL)
 * dan berisi token sekali pakai; hanya hash token yang disimpan di sini.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('invitation_token', 64)->nullable()->after('password_reset_expires_at');
            $table->timestamp('invitation_expires_at')->nullable()->after('invitation_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['invitation_token', 'invitation_expires_at']);
        });
    }
};

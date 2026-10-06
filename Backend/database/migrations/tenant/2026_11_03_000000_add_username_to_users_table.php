<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Username login (NIP untuk guru, NISN untuk siswa). Unik di database
 * sekolah ini — tiap sekolah punya database sendiri, jadi otomatis unik
 * per sekolah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->nullable()->unique()->after('email');
        });

        $sumber = DB::table('guru')->whereNotNull('user_id')->whereNotNull('nip')->where('nip', '!=', '')
            ->pluck('nip', 'user_id')
            ->union(
                DB::table('siswa')->whereNotNull('user_id')->whereNotNull('nisn')->where('nisn', '!=', '')
                    ->pluck('nisn', 'user_id')
            );

        $dipakai = [];
        foreach ($sumber as $userId => $username) {
            $username = trim((string) $username);
            if ($username === '' || isset($dipakai[$username])) {
                continue;
            }
            $dipakai[$username] = true;
            DB::table('users')->where('id', $userId)->update(['username' => $username]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};

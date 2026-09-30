<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Password sementara (terenkripsi) yang dibuat Super Admin untuk admin
     * sekolah — ditampilkan di tabel Kelola Admin Sekolah sampai pemilik
     * akun mengganti passwordnya sendiri, lalu dikosongkan otomatis.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('temporary_password')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('temporary_password');
        });
    }
};

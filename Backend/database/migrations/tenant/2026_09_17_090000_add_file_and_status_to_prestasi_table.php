<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prestasi', function (Blueprint $table) {
            $table->string('file')->nullable()->after('keterangan');
            $table->enum('sumber', ['sekolah', 'siswa'])->default('sekolah')->after('file');
            $table->enum('status', ['menunggu', 'terverifikasi', 'ditolak'])->default('terverifikasi')->after('sumber');
        });
    }

    public function down(): void
    {
        Schema::table('prestasi', function (Blueprint $table) {
            $table->dropColumn(['file', 'sumber', 'status']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tingkat pelanggaran "Sangat Berat" (pengurangan 100 poin sesuai pedoman
 * tata tertib), supaya pelanggaran sangat berat bisa dicatat dengan
 * tingkat yang benar dan diajukan BK.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pelanggaran', function (Blueprint $table) {
            $table->enum('tingkat', ['ringan', 'sedang', 'berat', 'sangat_berat'])->change();
        });
    }

    public function down(): void
    {
        DB::table('pelanggaran')->where('tingkat', 'sangat_berat')->update(['tingkat' => 'berat']);

        Schema::table('pelanggaran', function (Blueprint $table) {
            $table->enum('tingkat', ['ringan', 'sedang', 'berat'])->change();
        });
    }
};

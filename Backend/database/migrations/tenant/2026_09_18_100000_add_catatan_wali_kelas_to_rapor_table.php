<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rapor', function (Blueprint $table) {
            $table->text('catatan_wali_kelas')->nullable()->after('tahun_ajaran');
        });
    }

    public function down(): void
    {
        Schema::table('rapor', function (Blueprint $table) {
            $table->dropColumn('catatan_wali_kelas');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catatan pelanggaran mode ujian aman (keluar layar penuh, pindah tab,
     * pindah jendela) per percobaan kuis siswa — ditampilkan ke guru.
     */
    public function up(): void
    {
        Schema::table('ujian_attempt', function (Blueprint $table) {
            $table->unsignedInteger('pelanggaran')->default(0)->after('nilai');
            $table->json('pelanggaran_log')->nullable()->after('pelanggaran');
        });
    }

    public function down(): void
    {
        Schema::table('ujian_attempt', function (Blueprint $table) {
            $table->dropColumn(['pelanggaran', 'pelanggaran_log']);
        });
    }
};

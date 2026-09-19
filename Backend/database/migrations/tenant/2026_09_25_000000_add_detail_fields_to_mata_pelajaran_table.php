<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mata_pelajaran', function (Blueprint $table) {
            $table->string('kelompok', 100)->nullable()->after('nama_mapel');
            $table->enum('jenis', ['wajib', 'pilihan', 'muatan_lokal', 'lainnya'])->default('wajib')->after('kelompok');
            $table->string('jenjang', 100)->nullable()->after('jenis');
            $table->unsignedSmallInteger('alokasi_jp_default')->nullable()->after('jenjang');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif')->after('alokasi_jp_default');
        });
    }

    public function down(): void
    {
        Schema::table('mata_pelajaran', function (Blueprint $table) {
            $table->dropColumn(['kelompok', 'jenis', 'jenjang', 'alokasi_jp_default', 'status']);
        });
    }
};

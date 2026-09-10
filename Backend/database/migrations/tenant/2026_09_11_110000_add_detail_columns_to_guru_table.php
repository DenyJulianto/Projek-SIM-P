<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->string('gelar')->nullable()->after('nama');
            $table->string('nuptk', 30)->nullable()->unique()->after('nip');
            $table->string('jabatan')->nullable()->after('nuptk');
            $table->string('pendidikan_terakhir')->nullable()->after('jabatan');
            $table->unsignedSmallInteger('tahun_mulai_mengajar')->nullable()->after('pendidikan_terakhir');
            $table->string('agama', 20)->nullable()->after('tahun_mulai_mengajar');
        });
    }

    public function down(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->dropColumn([
                'gelar',
                'nuptk',
                'jabatan',
                'pendidikan_terakhir',
                'tahun_mulai_mengajar',
                'agama',
            ]);
        });
    }
};

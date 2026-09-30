<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sebelumnya alamat guru/siswa cuma satu kolom teks bebas — dipecah jadi
 * rincian per komponen (RT/RW, kelurahan, kecamatan, kota, kode pos) supaya
 * identitas guru/siswa di halaman Super Admin bisa menampilkan alamat
 * terstruktur, sama seperti yang sudah ada untuk data sekolah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->string('rt_rw', 20)->nullable()->after('alamat');
            $table->string('kelurahan')->nullable()->after('rt_rw');
            $table->string('kecamatan')->nullable()->after('kelurahan');
            $table->string('kota')->nullable()->after('kecamatan');
            $table->string('kode_pos', 10)->nullable()->after('kota');
        });

        Schema::table('siswa', function (Blueprint $table) {
            $table->string('rt_rw', 20)->nullable()->after('alamat');
            $table->string('kelurahan')->nullable()->after('rt_rw');
            $table->string('kecamatan')->nullable()->after('kelurahan');
            $table->string('kota')->nullable()->after('kecamatan');
            $table->string('kode_pos', 10)->nullable()->after('kota');
        });
    }

    public function down(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->dropColumn(['rt_rw', 'kelurahan', 'kecamatan', 'kota', 'kode_pos']);
        });

        Schema::table('siswa', function (Blueprint $table) {
            $table->dropColumn(['rt_rw', 'kelurahan', 'kecamatan', 'kota', 'kode_pos']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rincian alamat di profil akun (RT/RW s.d. kode pos), sama seperti kolom
 * yang sudah ada di tabel guru & siswa. Akun yang sudah punya data guru/siswa
 * langsung diisi dari sana.
 */
return new class extends Migration
{
    private const KOLOM = ['rt_rw', 'kelurahan', 'kecamatan', 'kota', 'kode_pos'];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('rt_rw', 20)->nullable()->after('alamat');
            $table->string('kelurahan')->nullable()->after('rt_rw');
            $table->string('kecamatan')->nullable()->after('kelurahan');
            $table->string('kota')->nullable()->after('kecamatan');
            $table->string('kode_pos', 10)->nullable()->after('kota');
        });

        foreach (['guru', 'siswa'] as $sumber) {
            DB::table($sumber)
                ->whereNotNull('user_id')
                ->where(fn ($q) => collect(self::KOLOM)->each(fn ($k) => $q->orWhereNotNull($k)))
                ->get(['user_id', ...self::KOLOM])
                ->each(function ($baris) {
                    $isi = array_filter(collect(self::KOLOM)->mapWithKeys(fn ($k) => [$k => $baris->{$k}])->all(), fn ($v) => $v !== null && $v !== '');
                    DB::table('users')->where('id', $baris->user_id)->whereNull('kota')->whereNull('kelurahan')->update($isi);
                });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(self::KOLOM);
        });
    }
};

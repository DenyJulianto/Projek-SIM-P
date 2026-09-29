<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('status_sekolah', 20)->nullable()->after('jenjang');
            $table->string('akreditasi', 20)->nullable()->after('status_sekolah');
            $table->string('website')->nullable()->after('email');
            $table->string('nama_kepala_sekolah')->nullable()->after('website');
            $table->string('nama_yayasan')->nullable()->after('nama_kepala_sekolah');
            $table->unsignedSmallInteger('tahun_berdiri')->nullable()->after('nama_yayasan');
            $table->string('no_sk_pendirian')->nullable()->after('tahun_berdiri');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'status_sekolah',
                'akreditasi',
                'website',
                'nama_kepala_sekolah',
                'nama_yayasan',
                'tahun_berdiri',
                'no_sk_pendirian',
            ]);
        });
    }
};

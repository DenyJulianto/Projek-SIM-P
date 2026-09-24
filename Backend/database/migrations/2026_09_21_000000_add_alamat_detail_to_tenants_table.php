<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('kecamatan')->nullable()->after('alamat');
            $table->string('kelurahan')->nullable()->after('alamat');
            $table->string('kabupaten_kota')->nullable()->after('kecamatan');
            $table->string('provinsi')->nullable()->after('kabupaten_kota');
            $table->decimal('latitude', 10, 7)->nullable()->after('provinsi');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['kecamatan', 'kelurahan', 'kabupaten_kota', 'provinsi', 'latitude', 'longitude']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tagihan', function (Blueprint $table) {
            $table->string('jenis', 30)->default('lainnya')->after('siswa_id');
            $table->string('periode', 100)->nullable()->after('judul');
            $table->text('alasan_batal')->nullable();
            $table->timestamp('dibatalkan_at')->nullable();
        });

        // Kolom status semula enum(belum_lunas, lunas); dijadikan string agar
        // bisa memuat status "dibatalkan" tanpa migrasi enum per-driver.
        Schema::table('tagihan', function (Blueprint $table) {
            $table->string('status', 20)->default('belum_lunas')->change();
        });

        DB::table('tagihan')->where('judul', 'like', '%SPP%')->update(['jenis' => 'spp']);
    }

    public function down(): void
    {
        Schema::table('tagihan', function (Blueprint $table) {
            $table->dropColumn(['jenis', 'periode', 'alasan_batal', 'dibatalkan_at']);
        });
    }
};

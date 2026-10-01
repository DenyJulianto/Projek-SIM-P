<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Perangkat ajar (RPP / Modul Ajar) kini terhubung ke kelas & mapel dari
 * jadwal mengajar guru, punya alur persetujuan (draf -> diajukan ->
 * disetujui / revisi) oleh Kepala Sekolah atau Waka Kurikulum, dan bisa
 * dilampiri file (LKPD, rubrik, bahan bacaan).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modul_ajar', function (Blueprint $table) {
            $table->foreignId('mata_pelajaran_id')->nullable()->after('mata_pelajaran')->constrained('mata_pelajaran')->nullOnDelete();
            $table->foreignId('kelas_id')->nullable()->after('kelas')->constrained('kelas')->nullOnDelete();
            $table->timestamp('diajukan_at')->nullable()->after('status');
            $table->foreignId('ditinjau_oleh')->nullable()->after('diajukan_at')->constrained('users')->nullOnDelete();
            $table->timestamp('ditinjau_at')->nullable()->after('ditinjau_oleh');
            $table->text('catatan_review')->nullable()->after('ditinjau_at');
        });

        // Status "final" dulu dipilih sendiri oleh guru; sekarang status akhir
        // hanya bisa diberikan peninjau, jadi kembalikan ke draf.
        DB::table('modul_ajar')->where('status', 'final')->update(['status' => 'draft']);

        Schema::create('modul_ajar_lampiran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modul_ajar_id')->constrained('modul_ajar')->cascadeOnDelete();
            $table->string('jenis', 30);
            $table->string('nama_file');
            $table->string('path');
            $table->unsignedBigInteger('ukuran');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modul_ajar_lampiran');
        Schema::table('modul_ajar', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mata_pelajaran_id');
            $table->dropConstrainedForeignId('kelas_id');
            $table->dropConstrainedForeignId('ditinjau_oleh');
            $table->dropColumn(['diajukan_at', 'ditinjau_at', 'catatan_review']);
        });
    }
};

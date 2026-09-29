<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Alur poin kedisiplinan: setiap siswa mulai dengan saldo poin (default
 * 100, diatur Kesiswaan). Saat BK menilai perlu pengurangan poin atas
 * suatu pelanggaran, BK mengajukan lewat tabel ini — poin BELUM berkurang
 * sampai Kesiswaan menyetujui pengajuannya (lihat
 * PengajuanPenguranganPoinController::setujui()). Ini sengaja dibuat
 * sebagai satu-satunya jalur pengurangan poin, tidak ada jalur potong
 * langsung oleh Kesiswaan, supaya BK & Kesiswaan selalu sepakat dulu
 * sebelum poin siswa berkurang dan notifikasi terkirim.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('siswa', function (Blueprint $table) {
            $table->unsignedSmallInteger('poin_disiplin')->default(100)->after('status');
        });

        Schema::create('pengajuan_pengurangan_poin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('pelanggaran_id')->constrained('pelanggaran')->cascadeOnDelete();
            $table->foreignId('diajukan_oleh')->constrained('users')->cascadeOnDelete();
            $table->unsignedSmallInteger('poin_diajukan');
            $table->text('alasan');
            $table->string('status', 20)->default('menunggu');
            $table->text('catatan_kesiswaan')->nullable();
            $table->foreignId('diputuskan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('diputuskan_at')->nullable();
            $table->timestamps();

            $table->index(['siswa_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_pengurangan_poin');

        Schema::table('siswa', function (Blueprint $table) {
            $table->dropColumn('poin_disiplin');
        });
    }
};

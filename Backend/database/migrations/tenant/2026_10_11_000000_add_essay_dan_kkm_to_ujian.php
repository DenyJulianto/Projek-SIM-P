<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ujian', function (Blueprint $table) {
            $table->decimal('kkm', 5, 2)->default(75)->after('durasi_menit');
        });

        Schema::table('ujian_soal', function (Blueprint $table) {
            $table->string('tipe', 20)->default('pilihan_ganda')->after('ujian_id');
            $table->unsignedInteger('bobot')->default(1)->after('tipe');
        });

        // Soal essay tidak punya pilihan/kunci jawaban, jadi kolom-kolom ini harus boleh kosong.
        Schema::table('ujian_soal', function (Blueprint $table) {
            $table->string('pilihan_a')->nullable()->change();
            $table->string('pilihan_b')->nullable()->change();
            $table->string('pilihan_c')->nullable()->change();
            $table->string('pilihan_d')->nullable()->change();
            $table->string('jawaban_benar', 1)->nullable()->change();
        });

        Schema::table('ujian_jawaban', function (Blueprint $table) {
            $table->text('jawaban_essay')->nullable()->after('jawaban_dipilih');
            $table->decimal('nilai_essay', 5, 2)->nullable()->after('benar');
        });
    }

    public function down(): void
    {
        Schema::table('ujian_jawaban', function (Blueprint $table) {
            $table->dropColumn(['jawaban_essay', 'nilai_essay']);
        });

        Schema::table('ujian_soal', function (Blueprint $table) {
            $table->dropColumn(['tipe', 'bobot']);
        });

        Schema::table('ujian', function (Blueprint $table) {
            $table->dropColumn('kkm');
        });
    }
};

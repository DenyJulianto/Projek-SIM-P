<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Riwayat pembuatan akun siswa & orang tua massal (diproses lewat queue). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('akun_siswa_batch', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('kelas_id')->nullable()->constrained('kelas')->nullOnDelete();
            $table->boolean('sertakan_ortu')->default(true);
            $table->string('status', 20)->default('antri');
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('akun_siswa')->default(0);
            $table->unsignedInteger('akun_ortu')->default(0);
            $table->unsignedInteger('dilewati')->default(0);
            $table->string('file_kredensial')->nullable();
            $table->text('pesan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('akun_siswa_batch');
    }
};

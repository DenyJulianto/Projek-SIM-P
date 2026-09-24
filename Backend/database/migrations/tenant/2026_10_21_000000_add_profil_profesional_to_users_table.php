<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Profil profesional untuk staf non-guru (mis. Bendahara) yang tidak punya
    // baris di tabel guru — supaya halaman Profil Saya-nya bisa sama dengan
    // guru tanpa ikut masuk ke daftar guru / direktori guru nasional.
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('gelar', 100)->nullable()->after('pendidikan_terakhir');
            $table->string('jabatan', 100)->nullable()->after('gelar');
            $table->string('keahlian')->nullable()->after('jabatan');
            $table->string('kutipan')->nullable()->after('keahlian');
            $table->text('bio')->nullable()->after('kutipan');
            $table->string('media_sosial')->nullable()->after('bio');
        });

        Schema::create('user_sertifikat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('nama_file');
            $table->string('path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sertifikat');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['gelar', 'jabatan', 'keahlian', 'kutipan', 'bio', 'media_sosial']);
        });
    }
};

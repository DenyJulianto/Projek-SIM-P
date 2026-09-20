<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->string('keahlian', 255)->nullable();
            $table->text('sertifikasi')->nullable();
            $table->string('kutipan', 255)->nullable();
            $table->text('bio')->nullable();
            $table->string('media_sosial', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->dropColumn(['keahlian', 'sertifikasi', 'kutipan', 'bio', 'media_sosial']);
        });
    }
};

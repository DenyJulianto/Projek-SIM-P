<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modul_ajar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('kurikulum', 20);
            $table->string('judul');
            $table->string('mata_pelajaran')->nullable();
            $table->string('kelas')->nullable();
            $table->string('status', 20)->default('draft');
            $table->json('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modul_ajar');
    }
};

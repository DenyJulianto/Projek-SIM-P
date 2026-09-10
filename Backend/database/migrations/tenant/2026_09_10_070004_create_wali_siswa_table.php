<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wali_siswa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('hubungan', 20)->default('wali');
            $table->timestamps();

            $table->unique(['siswa_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wali_siswa');
    }
};

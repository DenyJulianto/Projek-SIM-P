<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('sekolah_id');
            $table->string('triggered_by_name')->nullable();
            $table->string('triggered_by_email')->nullable();
            $table->string('triggered_by_role');
            $table->unsignedInteger('jumlah_guru')->default(0);
            $table->unsignedInteger('jumlah_siswa')->default(0);
            $table->string('status');
            $table->text('pesan_error')->nullable();
            $table->timestamps();

            $table->foreign('sekolah_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('sekolah_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
    }
};

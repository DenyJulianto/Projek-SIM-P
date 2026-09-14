<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Null = semua modul opsional aktif (nilai default). Kalau
            // diisi, berbentuk {"keuangan": false, "sarpras": true, ...} —
            // key yang tidak disebutkan dianggap aktif.
            $table->json('module_settings')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('module_settings');
        });
    }
};

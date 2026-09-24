<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->string('mata_pelajaran')->nullable()->after('jabatan');
            $table->string('status_kepegawaian')->nullable()->after('mata_pelajaran');
        });
    }

    public function down(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->dropColumn(['mata_pelajaran', 'status_kepegawaian']);
        });
    }
};

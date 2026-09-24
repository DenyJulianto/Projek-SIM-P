<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sumber_dana', function (Blueprint $table) {
            $table->string('kategori', 30)->default('lainnya')->after('nama');
        });

        DB::table('sumber_dana')->where(fn ($q) => $q->where('nama', 'like', '%BOS%')->orWhere('nama', 'like', '%BOP%'))->update(['kategori' => 'pemerintah']);
        DB::table('sumber_dana')->where('nama', 'like', '%komite%')->update(['kategori' => 'komite']);
    }

    public function down(): void
    {
        Schema::table('sumber_dana', function (Blueprint $table) {
            $table->dropColumn('kategori');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->foreignId('tahun_ajaran_id')->nullable()->after('tahun_ajaran')->constrained('tahun_ajaran')->nullOnDelete();
            $table->string('jenjang', 20)->nullable()->after('tingkat');
            $table->string('fase', 5)->nullable()->after('jenjang');
            $table->string('kurikulum')->nullable()->after('fase');
            $table->unsignedSmallInteger('kapasitas')->nullable()->after('kurikulum');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif')->after('wali_kelas_id');
        });

        // Kelas lama hanya menyimpan nama tahun ajaran sebagai teks; tautkan
        // ke tahun_ajaran yang namanya persis sama, sisanya dibiarkan kosong.
        DB::table('kelas')->orderBy('id')->each(function ($kelas) {
            $id = DB::table('tahun_ajaran')->where('nama', $kelas->tahun_ajaran)->value('id');
            if ($id) {
                DB::table('kelas')->where('id', $kelas->id)->update(['tahun_ajaran_id' => $id]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tahun_ajaran_id');
            $table->dropColumn(['jenjang', 'fase', 'kurikulum', 'kapasitas', 'status']);
        });
    }
};

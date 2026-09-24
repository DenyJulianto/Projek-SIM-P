<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('program_semester', function (Blueprint $table) {
            $table->string('fase', 10)->nullable()->after('kelas_id');
            $table->enum('status_dokumen', ['draft', 'diajukan', 'disahkan'])->default('draft')->after('catatan');
            $table->foreignId('disahkan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('tanggal_pengesahan')->nullable();
        });

        Schema::table('program_semester_item', function (Blueprint $table) {
            $table->foreignId('indikator_id')->nullable()->constrained('tp_indikator')->nullOnDelete();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('program_semester_item', function (Blueprint $table) {
            $table->dropConstrainedForeignId('indikator_id');
            $table->dropColumn(['tanggal_mulai', 'tanggal_selesai']);
        });

        Schema::table('program_semester', function (Blueprint $table) {
            $table->dropConstrainedForeignId('disahkan_oleh');
            $table->dropColumn(['fase', 'status_dokumen', 'tanggal_pengesahan']);
        });
    }
};

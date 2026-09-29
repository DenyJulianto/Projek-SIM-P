<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tiga kombinasi kolom ini sebelumnya cuma dijaga unik lewat pengecekan di
 * kode controller (assertBisaDisimpan/assertUnique/lookup manual), bukan di
 * database — jadi race condition (dua request bersamaan) atau proses lain
 * yang menulis langsung ke database (import, skrip, dsb.) tetap bisa
 * membuat baris duplikat. Sudah dicek dulu (lihat catatan di percakapan)
 * tidak ada duplikat pada tenant mana pun sebelum migrasi ini ditulis.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->addUniqueIfPossible('kelas', ['tahun_ajaran', 'nama_kelas'], 'kelas_tahun_ajaran_nama_kelas_unique');
        $this->addUniqueIfPossible('capaian_pembelajaran', ['tahun_ajaran_id', 'mata_pelajaran_id', 'fase', 'elemen'], 'cp_unique_kombinasi');
        $this->addUniqueIfPossible('tujuan_pembelajaran', ['capaian_pembelajaran_id', 'tingkat', 'semester', 'urutan'], 'tp_unique_kombinasi');
    }

    public function down(): void
    {
        $this->dropUniqueIfExists('kelas', 'kelas_tahun_ajaran_nama_kelas_unique');
        $this->dropUniqueIfExists('capaian_pembelajaran', 'cp_unique_kombinasi');
        $this->dropUniqueIfExists('tujuan_pembelajaran', 'tp_unique_kombinasi');
    }

    private function addUniqueIfPossible(string $table, array $columns, string $indexName): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }
        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return;
            }
        }
        if (in_array($indexName, array_column(Schema::getIndexes($table), 'name'), true)) {
            return;
        }

        // Kalau ternyata ada duplikat yang lolos dari pengecekan manual
        // (data tenant lama, dibuat sebelum aturan unik ditegakkan di kode),
        // lewati migrasi ini untuk tabel tsb dengan aman daripada gagal —
        // duplikat yang sudah lanjut ada harus dibereskan manual dulu.
        $duplikat = \Illuminate\Support\Facades\DB::table($table)
            ->select($columns)
            ->groupBy($columns)
            ->havingRaw('count(*) > 1')
            ->exists();

        if ($duplikat) {
            return;
        }

        Schema::table($table, function (Blueprint $t) use ($columns, $indexName) {
            $t->unique($columns, $indexName);
        });
    }

    private function dropUniqueIfExists(string $table, string $indexName): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }
        if (in_array($indexName, array_column(Schema::getIndexes($table), 'name'), true)) {
            Schema::table($table, function (Blueprint $t) use ($indexName) {
                $t->dropUnique($indexName);
            });
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Index untuk kolom yang sering dipakai di WHERE/ORDER BY/GROUP BY tapi belum
 * terindeks (kolom foreignId()->constrained() sudah otomatis terindeks, jadi
 * tidak disentuh di sini). Semua di bawah ini index biasa (bukan unique)
 * supaya migrasi tidak gagal kalau kebetulan sudah ada data duplikat.
 *
 * Sengaja diberi timestamp SETELAH seluruh migrasi tenant lain yang ada saat
 * ditulis, dan setiap index dijaga dengan pengecekan kolom/index yang sudah
 * ada — tenant di aplikasi ini bisa saja tertinggal beberapa migrasi
 * (skema berbeda-beda per tenant tergantung kapan terakhir di-migrate), jadi
 * tidak boleh berasumsi sebuah kolom pasti sudah ada di semua tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->addIndexes('siswa', ['status', 'nama']);
        $this->addIndexes('guru', ['status', 'nama']);
        $this->addIndexes('kelas', ['tahun_ajaran', 'status', 'tingkat', 'jenjang', 'fase', 'kurikulum']);
        $this->addCompositeIndex('kelas', ['tahun_ajaran_id', 'wali_kelas_id', 'status']);
        $this->addIndexes('nilai', ['jenis_nilai']);
        $this->addCompositeIndex('nilai', ['tahun_ajaran', 'semester']);
        $this->addIndexes('absensi', ['tanggal', 'status']);
        $this->addIndexes('absensi_guru', ['tanggal', 'status']);
        $this->addIndexes('jadwal_pelajaran', ['hari']);
        $this->addIndexes('surat', ['jenis', 'status', 'tanggal_agenda']);
        $this->addIndexes('pengumuman', ['status', 'tanggal_publish']);
        $this->addIndexes('kegiatan', ['status', 'tanggal_mulai']);
        $this->addIndexes('tagihan', ['jenis']);
        $this->addCompositeIndex('tagihan', ['status', 'jatuh_tempo']);
        $this->addIndexes('pembayaran', ['tanggal_bayar']);
        $this->addIndexes('capaian_pembelajaran', ['fase', 'status']);
        $this->addCompositeIndex('capaian_pembelajaran', ['tahun_ajaran_id', 'mata_pelajaran_id', 'fase', 'elemen'], 'cp_lookup_index');
        $this->addIndexes('tujuan_pembelajaran', ['status', 'progres']);
        $this->addCompositeIndex('tujuan_pembelajaran', ['capaian_pembelajaran_id', 'tingkat', 'semester'], 'tp_lookup_index');
        $this->addIndexes(config('activitylog.table_name'), ['created_at']);
    }

    public function down(): void
    {
        $this->dropIndexes('siswa', ['status', 'nama']);
        $this->dropIndexes('guru', ['status', 'nama']);
        $this->dropIndexes('kelas', ['tahun_ajaran', 'status', 'tingkat', 'jenjang', 'fase', 'kurikulum']);
        $this->dropCompositeIndex('kelas', ['tahun_ajaran_id', 'wali_kelas_id', 'status']);
        $this->dropIndexes('nilai', ['jenis_nilai']);
        $this->dropCompositeIndex('nilai', ['tahun_ajaran', 'semester']);
        $this->dropIndexes('absensi', ['tanggal', 'status']);
        $this->dropIndexes('absensi_guru', ['tanggal', 'status']);
        $this->dropIndexes('jadwal_pelajaran', ['hari']);
        $this->dropIndexes('surat', ['jenis', 'status', 'tanggal_agenda']);
        $this->dropIndexes('pengumuman', ['status', 'tanggal_publish']);
        $this->dropIndexes('kegiatan', ['status', 'tanggal_mulai']);
        $this->dropIndexes('tagihan', ['jenis']);
        $this->dropCompositeIndex('tagihan', ['status', 'jatuh_tempo']);
        $this->dropIndexes('pembayaran', ['tanggal_bayar']);
        $this->dropIndexes('capaian_pembelajaran', ['fase', 'status']);
        $this->dropCompositeIndex('capaian_pembelajaran', ['tahun_ajaran_id', 'mata_pelajaran_id', 'fase', 'elemen'], 'cp_lookup_index');
        $this->dropIndexes('tujuan_pembelajaran', ['status', 'progres']);
        $this->dropCompositeIndex('tujuan_pembelajaran', ['capaian_pembelajaran_id', 'tingkat', 'semester'], 'tp_lookup_index');
        $this->dropIndexes(config('activitylog.table_name'), ['created_at']);
    }

    private function existingIndexNames(string $table): array
    {
        return array_column(Schema::getIndexes($table), 'name');
    }

    private function addIndexes(string $table, array $columns): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $existing = $this->existingIndexNames($table);

        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                continue;
            }
            if (in_array("{$table}_{$column}_index", $existing, true)) {
                continue;
            }
            Schema::table($table, function (Blueprint $t) use ($column) {
                $t->index($column);
            });
        }
    }

    private function addCompositeIndex(string $table, array $columns, ?string $name = null): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }
        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return;
            }
        }

        $indexName = $name ?? $table.'_'.implode('_', $columns).'_index';
        if (in_array($indexName, $this->existingIndexNames($table), true)) {
            return;
        }

        Schema::table($table, function (Blueprint $t) use ($columns, $name) {
            $t->index($columns, $name);
        });
    }

    private function dropIndexes(string $table, array $columns): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $existing = $this->existingIndexNames($table);

        foreach ($columns as $column) {
            if (in_array("{$table}_{$column}_index", $existing, true)) {
                Schema::table($table, function (Blueprint $t) use ($column) {
                    $t->dropIndex([$column]);
                });
            }
        }
    }

    private function dropCompositeIndex(string $table, array $columns, ?string $name = null): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $indexName = $name ?? $table.'_'.implode('_', $columns).'_index';
        if (in_array($indexName, $this->existingIndexNames($table), true)) {
            Schema::table($table, function (Blueprint $t) use ($indexName) {
                $t->dropIndex($indexName);
            });
        }
    }
};

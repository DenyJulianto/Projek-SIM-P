<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Buku poin kedisiplinan siswa. Setiap siswa mulai dengan 100 poin;
 * pelanggaran mengurangi poin (ringan 5–10, sedang 15–30, berat 40–75,
 * sangat berat 100) dan apresiasi menambahnya kembali (prestasi +25–50,
 * perilaku terpuji +5–10) — lihat App\Models\CatatanPoin::KATEGORI.
 * siswa.poin_disiplin dihitung ulang dari tabel ini setiap kali berubah
 * (berjalan urut tanggal, selalu di antara 0 dan 100).
 *
 * Catatan dibuat Kesiswaan lewat menu "Poin Siswa" atau berasal dari
 * pengajuan BK yang disetujui (pengajuan_id terisi). Pengajuan yang sudah
 * disetujui sebelum tabel ini ada dipindahkan ke sini supaya riwayat siswa
 * lengkap dan sisa poinnya tidak berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catatan_poin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswa')->cascadeOnDelete();
            $table->string('kategori', 30);
            $table->unsignedSmallInteger('poin');
            $table->string('keterangan', 255);
            $table->date('tanggal');
            $table->foreignId('pelanggaran_id')->nullable()->constrained('pelanggaran')->nullOnDelete();
            $table->foreignId('prestasi_id')->nullable()->constrained('prestasi')->nullOnDelete();
            $table->foreignId('pengajuan_id')->nullable()->unique()->constrained('pengajuan_pengurangan_poin')->nullOnDelete();
            $table->foreignId('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['siswa_id', 'tanggal']);
        });

        $disetujui = DB::table('pengajuan_pengurangan_poin as p')
            ->leftJoin('pelanggaran as l', 'l.id', '=', 'p.pelanggaran_id')
            ->where('p.status', 'disetujui')
            ->get(['p.*', 'l.jenis', 'l.tingkat']);

        foreach ($disetujui as $p) {
            DB::table('catatan_poin')->insert([
                'siswa_id' => $p->siswa_id,
                'kategori' => in_array($p->tingkat, ['ringan', 'sedang', 'berat'], true) ? $p->tingkat : 'penyesuaian',
                'poin' => $p->poin_diajukan,
                'keterangan' => $p->jenis ? "Pelanggaran: {$p->jenis} (pengajuan BK)" : 'Pengurangan poin (pengajuan BK)',
                'tanggal' => substr((string) ($p->diputuskan_at ?? $p->created_at), 0, 10),
                'pelanggaran_id' => $p->pelanggaran_id,
                'pengajuan_id' => $p->id,
                'dicatat_oleh' => $p->diputuskan_oleh,
                'created_at' => $p->diputuskan_at ?? $p->created_at,
                'updated_at' => $p->diputuskan_at ?? $p->created_at,
            ]);
        }

        // Sisa poin yang sudah ada dipertahankan: bila berbeda dari hasil
        // hitungan riwayat (mis. diubah manual), selisihnya dicatat sebagai
        // penyesuaian supaya riwayat tetap menjelaskan sisa poin siswa.
        $total = DB::table('catatan_poin')->groupBy('siswa_id')->pluck(DB::raw('SUM(poin)'), 'siswa_id');
        foreach (DB::table('siswa')->where('poin_disiplin', '<', 100)->get(['id', 'poin_disiplin']) as $s) {
            $selisih = (100 - (int) $s->poin_disiplin) - (int) ($total[$s->id] ?? 0);
            if ($selisih > 0) {
                DB::table('catatan_poin')->insert([
                    'siswa_id' => $s->id,
                    'kategori' => 'penyesuaian',
                    'poin' => $selisih,
                    'keterangan' => 'Penyesuaian saldo poin sebelumnya',
                    'tanggal' => now()->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catatan_poin');
    }
};

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Satu catatan di buku poin kedisiplinan siswa: pengurangan karena
 * pelanggaran atau penambahan karena apresiasi. `poin` selalu positif;
 * arahnya (− / +) ditentukan kategori. Sisa poin dihitung di
 * Siswa::riwayatPoin() / hitungUlangPoin().
 */
class CatatanPoin extends Model
{
    /**
     * Kategori yang bisa dipilih Kesiswaan beserta rentang poinnya (pedoman
     * tata tertib sekolah). arah −1 = mengurangi poin, +1 = menambah poin.
     */
    public const KATEGORI = [
        'ringan' => ['label' => 'Pelanggaran Ringan', 'arah' => -1, 'min' => 5, 'max' => 10,
            'contoh' => 'Terlambat, atribut seragam tidak lengkap (topi/dasi), rambut panjang (siswa putra), membuang sampah sembarangan.'],
        'sedang' => ['label' => 'Pelanggaran Sedang', 'arah' => -1, 'min' => 15, 'max' => 30,
            'contoh' => 'Membolos, keluar lingkungan sekolah tanpa izin, mencontek saat ujian, membawa barang terlarang (kartu remi, komik).'],
        'berat' => ['label' => 'Pelanggaran Berat', 'arah' => -1, 'min' => 40, 'max' => 75,
            'contoh' => 'Merokok di lingkungan sekolah, perundungan (bullying), merusak fasilitas sekolah, berkelahi.'],
        'sangat_berat' => ['label' => 'Pelanggaran Sangat Berat', 'arah' => -1, 'min' => 100, 'max' => 100,
            'contoh' => 'Tindak kriminal, narkoba, perjudian, atau tindakan asusila. Umumnya siswa dikembalikan kepada orang tua (dikeluarkan).'],
        'prestasi' => ['label' => 'Prestasi Akademik/Non-Akademik', 'arah' => 1, 'min' => 25, 'max' => 50,
            'contoh' => 'Juara lomba tingkat kota, provinsi, atau nasional.'],
        'perilaku_terpuji' => ['label' => 'Perilaku Terpuji', 'arah' => 1, 'min' => 5, 'max' => 10,
            'contoh' => 'Aktif sebagai pengurus OSIS, rajin membantu kebersihan sekolah, mengembalikan barang temuan.'],
    ];

    /** Kategori internal (tidak bisa dipilih): selisih saldo lama saat migrasi. */
    public const PENYESUAIAN = ['label' => 'Penyesuaian', 'arah' => -1];

    protected $table = 'catatan_poin';

    protected $fillable = ['siswa_id', 'kategori', 'poin', 'keterangan', 'tanggal', 'pelanggaran_id', 'prestasi_id', 'pengajuan_id', 'dicatat_oleh'];

    protected function casts(): array
    {
        return [
            'poin' => 'integer',
            'tanggal' => 'date:Y-m-d',
        ];
    }

    public static function infoKategori(string $kategori): array
    {
        return self::KATEGORI[$kategori] ?? self::PENYESUAIAN;
    }

    /** Perubahan poin bertanda: negatif untuk pelanggaran, positif untuk apresiasi. */
    public function perubahan(): int
    {
        return self::infoKategori($this->kategori)['arah'] * $this->poin;
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function pelanggaran(): BelongsTo
    {
        return $this->belongsTo(Pelanggaran::class);
    }

    /** Pengajuan BK asal catatan ini (null bila dicatat langsung oleh Kesiswaan). */
    public function pengajuan(): BelongsTo
    {
        return $this->belongsTo(PengajuanPenguranganPoin::class, 'pengajuan_id');
    }

    public function prestasi(): BelongsTo
    {
        return $this->belongsTo(Prestasi::class);
    }
}

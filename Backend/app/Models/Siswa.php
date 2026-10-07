<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\SinkronUsernameLogin;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Siswa extends Model
{
    use SinkronUsernameLogin;

    public const KOLOM_USERNAME = 'nisn';

    /** Poin kedisiplinan awal setiap siswa sebelum dikurangi pelanggaran. */
    public const POIN_AWAL = 100;

    protected $table = 'siswa';

    protected $fillable = [
        'user_id',
        'kelas_id',
        'tahun_masuk',
        'nis',
        'nisn',
        'nama',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'rt_rw',
        'kelurahan',
        'kecamatan',
        'kota',
        'kode_pos',
        'nama_wali',
        'telepon_wali',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function walis(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'wali_siswa')
            ->withPivot('hubungan')
            ->withTimestamps();
    }

    public function absensi(): HasMany
    {
        return $this->hasMany(Absensi::class);
    }

    public function nilai(): HasMany
    {
        return $this->hasMany(Nilai::class);
    }

    public function tagihan(): HasMany
    {
        return $this->hasMany(Tagihan::class);
    }

    public function saldo(): HasOne
    {
        return $this->hasOne(SaldoSiswa::class);
    }

    public function saldoTransaksi(): HasMany
    {
        return $this->hasMany(SaldoTransaksi::class);
    }

    public function pelanggaran(): HasMany
    {
        return $this->hasMany(Pelanggaran::class);
    }

    public function pengajuanPenguranganPoin(): HasMany
    {
        return $this->hasMany(PengajuanPenguranganPoin::class);
    }

    public function prestasi(): HasMany
    {
        return $this->hasMany(Prestasi::class);
    }

    public function catatanPoin(): HasMany
    {
        return $this->hasMany(CatatanPoin::class);
    }

    /** Hitung ulang sisa poin kedisiplinan dari buku poin, lalu simpan. */
    public function hitungUlangPoin(): int
    {
        $riwayat = $this->riwayatPoin();
        $this->poin_disiplin = $riwayat[0]['sisa_setelah'] ?? self::POIN_AWAL;
        $this->save();

        return $this->poin_disiplin;
    }

    /**
     * Riwayat buku poin (terbaru dulu), masing-masing dengan sisa poin setelah
     * catatan itu. Dihitung urut tanggal dan saldo selalu dijaga di antara 0
     * dan POIN_AWAL: apresiasi memulihkan poin yang pernah dipotong, tetapi
     * tidak melebihi poin awal.
     */
    public function riwayatPoin(): array
    {
        $sisa = self::POIN_AWAL;

        return $this->catatanPoin()
            ->with(['pelanggaran:id,jenis,tingkat,tanggal', 'prestasi:id,judul,tingkat,tanggal'])
            ->orderBy('tanggal')
            ->orderBy('id')
            ->get()
            ->map(function (CatatanPoin $c) use (&$sisa) {
                $info = CatatanPoin::infoKategori($c->kategori);
                $sisa = min(self::POIN_AWAL, max(0, $sisa + $c->perubahan()));

                return [
                    'id' => $c->id,
                    'tanggal' => $c->tanggal?->toDateString(),
                    'kategori' => $c->kategori,
                    'kategori_label' => $info['label'],
                    'poin' => $c->poin,
                    'perubahan' => $c->perubahan(),
                    'keterangan' => $c->keterangan,
                    'pelanggaran' => $c->pelanggaran?->only(['id', 'jenis', 'tingkat', 'tanggal']),
                    'pelanggaran_id' => $c->pelanggaran_id,
                    'prestasi' => $c->prestasi?->only(['id', 'judul', 'tingkat', 'tanggal']),
                    'prestasi_id' => $c->prestasi_id,
                    'dari_pengajuan_bk' => $c->pengajuan_id !== null,
                    'sisa_setelah' => $sisa,
                ];
            })
            ->reverse()
            ->values()
            ->all();
    }

    /**
     * Ringkasan buku poin untuk Kesiswaan, siswa, dan orang tua — termasuk
     * peringatan bila ada pelanggaran sangat berat atau poin habis (keputusan
     * tindak lanjutnya tetap di tangan sekolah, tidak otomatis).
     */
    public function ringkasanPoin(): array
    {
        $riwayat = $this->riwayatPoin();
        $sisa = $riwayat[0]['sisa_setelah'] ?? self::POIN_AWAL;
        $sangatBerat = collect($riwayat)->contains('kategori', 'sangat_berat');

        return [
            'poin_awal' => self::POIN_AWAL,
            'sisa_poin' => $sisa,
            'total_pengurangan' => -collect($riwayat)->where('perubahan', '<', 0)->sum('perubahan'),
            'total_penambahan' => collect($riwayat)->where('perubahan', '>', 0)->sum('perubahan'),
            'peringatan' => $sangatBerat || $sisa <= 0
                ? ($sangatBerat
                    ? 'Tercatat pelanggaran sangat berat. Sesuai tata tertib, pelanggaran ini umumnya berujung siswa dikembalikan kepada orang tua; keputusan akhir ada pada sekolah.'
                    : 'Poin kedisiplinan habis. Siswa perlu pembinaan khusus dan pemanggilan orang tua sesuai tata tertib sekolah.')
                : null,
            'riwayat' => $riwayat,
        ];
    }
}

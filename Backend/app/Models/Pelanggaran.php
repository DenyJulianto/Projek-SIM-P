<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pelanggaran extends Model
{
    /** Tingkat pelanggaran; kuncinya sama dengan kategori pengurangan di CatatanPoin::KATEGORI. */
    public const TINGKAT = ['ringan' => 'Ringan', 'sedang' => 'Sedang', 'berat' => 'Berat', 'sangat_berat' => 'Sangat Berat'];

    protected $table = 'pelanggaran';

    protected $fillable = ['siswa_id', 'tingkat', 'jenis', 'kategori', 'poin', 'tanggal', 'keterangan', 'tindakan', 'status', 'catatan', 'dicatat_oleh'];

    protected function casts(): array
    {
        return [
            // Tanpa jam supaya tidak bergeser sehari saat dibaca di zona waktu lain (JSON ISO UTC).
            'tanggal' => 'date:Y-m-d',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function catatanPoin(): HasMany
    {
        return $this->hasMany(CatatanPoin::class);
    }

    public function pengajuanPoin(): HasMany
    {
        return $this->hasMany(PengajuanPenguranganPoin::class);
    }

    /**
     * Satu pelanggaran hanya boleh memotong poin sekali, lewat jalur mana pun
     * (catatan langsung Kesiswaan atau pengajuan BK). Mengembalikan alasan
     * penolakan, atau null bila masih boleh dipotong.
     */
    public function alasanSudahDipotong(?int $kecualiCatatanId = null, ?int $kecualiPengajuanId = null): ?string
    {
        $catatan = $this->catatanPoin()
            ->when($kecualiCatatanId, fn ($q) => $q->whereKeyNot($kecualiCatatanId))
            ->first(['id', 'tanggal', 'poin']);
        if ($catatan) {
            return "Poin untuk pelanggaran \"{$this->jenis}\" sudah dipotong {$catatan->poin} poin pada {$catatan->tanggal->locale('id')->translatedFormat('j F Y')}. Ubah catatan poin yang ada bila jumlahnya perlu disesuaikan.";
        }

        $menunggu = $this->pengajuanPoin()
            ->where('status', 'menunggu')
            ->when($kecualiPengajuanId, fn ($q) => $q->whereKeyNot($kecualiPengajuanId))
            ->exists();

        return $menunggu
            ? "Pelanggaran \"{$this->jenis}\" sedang diajukan pengurangan poinnya oleh BK. Putuskan pengajuan tersebut di menu Persetujuan Pengurangan Poin."
            : null;
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnggotaPerpustakaan extends Model
{
    protected $table = 'anggota_perpustakaan';

    protected $fillable = [
        'jenis_anggota',
        'siswa_id',
        'guru_id',
        'user_id',
        'nip_pegawai',
        'nomor_kartu',
        'tanggal_terdaftar',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_terdaftar' => 'date',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function peminjaman(): HasMany
    {
        return $this->hasMany(PeminjamanBuku::class, 'anggota_id');
    }

    public function reservasi(): HasMany
    {
        return $this->hasMany(ReservasiBuku::class, 'anggota_id');
    }

    public function denda(): HasMany
    {
        return $this->hasMany(DendaPerpustakaan::class, 'anggota_id');
    }

    public function getNamaAttribute(): string
    {
        return match ($this->jenis_anggota) {
            'siswa' => $this->siswa?->nama ?? '-',
            'guru' => $this->guru?->nama ?? '-',
            'pegawai' => $this->user?->name ?? '-',
            default => '-',
        };
    }

    public function getNisNisnNipAttribute(): ?string
    {
        return match ($this->jenis_anggota) {
            'siswa' => $this->siswa?->nis,
            'guru' => $this->guru?->nip,
            'pegawai' => $this->nip_pegawai,
            default => null,
        };
    }

    public function getKelasUnitAttribute(): ?string
    {
        return match ($this->jenis_anggota) {
            'siswa' => $this->siswa?->kelas?->nama_kelas,
            'guru' => 'Guru',
            'pegawai' => 'Pegawai',
            default => null,
        };
    }
}

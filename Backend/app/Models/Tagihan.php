<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tagihan extends Model
{
    public const JENIS = [
        'spp' => 'SPP',
        'uang_kegiatan' => 'Uang Kegiatan',
        'uang_ujian' => 'Uang Ujian',
        'seragam' => 'Seragam',
        'buku' => 'Buku',
        'study_tour' => 'Study Tour',
        'ekstrakurikuler' => 'Ekstrakurikuler',
        'daftar_ulang' => 'Daftar Ulang',
        'lainnya' => 'Biaya Lainnya',
    ];

    protected $table = 'tagihan';

    protected $fillable = [
        'siswa_id',
        'jenis',
        'judul',
        'periode',
        'jumlah',
        'jatuh_tempo',
        'status',
        'alasan_batal',
        'dibatalkan_at',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'jatuh_tempo' => 'date',
            'dibatalkan_at' => 'datetime',
        ];
    }

    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('status', '!=', 'dibatalkan');
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function pembayaran(): HasMany
    {
        return $this->hasMany(Pembayaran::class);
    }
}

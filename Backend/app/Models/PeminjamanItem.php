<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PeminjamanItem extends Model
{
    protected $table = 'peminjaman_item';

    protected $fillable = [
        'peminjaman_id',
        'eksemplar_id',
        'tanggal_kembali_aktual',
        'kondisi_kembali',
        'catatan_kerusakan',
        'status',
        'diproses_oleh',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_kembali_aktual' => 'date',
        ];
    }

    public function peminjaman(): BelongsTo
    {
        return $this->belongsTo(PeminjamanBuku::class, 'peminjaman_id');
    }

    public function eksemplar(): BelongsTo
    {
        return $this->belongsTo(EksemplarBuku::class, 'eksemplar_id');
    }

    public function diprosesOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }

    public function denda(): HasOne
    {
        return $this->hasOne(DendaPerpustakaan::class, 'peminjaman_item_id');
    }
}

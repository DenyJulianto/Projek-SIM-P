<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EksemplarBuku extends Model
{
    protected $table = 'eksemplar_buku';

    protected $fillable = [
        'buku_id',
        'kode_inventaris',
        'barcode',
        'nomor_eksemplar',
        'kondisi',
        'lokasi',
        'status',
    ];

    public function buku(): BelongsTo
    {
        return $this->belongsTo(Buku::class);
    }

    public function peminjamanItem(): HasMany
    {
        return $this->hasMany(PeminjamanItem::class, 'eksemplar_id');
    }
}

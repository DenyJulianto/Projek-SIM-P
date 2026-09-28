<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BahanLab extends Model
{
    protected $table = 'bahan_lab';

    protected $fillable = [
        'kode_bahan',
        'nama_bahan',
        'jenis_kategori',
        'satuan',
        'jumlah_stok',
        'stok_minimum',
        'laboratorium_id',
        'lokasi_penyimpanan',
        'tanggal_masuk',
        'tanggal_kedaluwarsa',
        'status',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'jumlah_stok' => 'decimal:2',
            'stok_minimum' => 'decimal:2',
            'tanggal_masuk' => 'date',
            'tanggal_kedaluwarsa' => 'date',
        ];
    }

    public function laboratorium(): BelongsTo
    {
        return $this->belongsTo(Laboratorium::class);
    }

    public function mutasi(): HasMany
    {
        return $this->hasMany(BahanLabMutasi::class, 'bahan_id')->orderByDesc('tanggal')->orderByDesc('id');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventaris extends Model
{
    protected $table = 'inventaris';

    protected $fillable = [
        'kode_barang',
        'barcode',
        'nama_barang',
        'kategori',
        'merk',
        'tipe_model',
        'nomor_seri',
        'jumlah',
        'satuan',
        'kondisi',
        'kondisi_lab',
        'lokasi',
        'laboratorium_id',
        'tanggal_perolehan',
        'tahun_pengadaan',
        'sumber_dana',
        'harga',
        'keterangan',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_perolehan' => 'date',
            'harga' => 'decimal:2',
        ];
    }

    public function riwayat(): HasMany
    {
        return $this->hasMany(InventarisRiwayat::class)->orderByDesc('tanggal');
    }

    public function laboratorium(): BelongsTo
    {
        return $this->belongsTo(Laboratorium::class);
    }

    public function pemeliharaan(): HasMany
    {
        return $this->hasMany(PemeliharaanAlat::class, 'inventaris_id')->orderByDesc('tanggal');
    }
}

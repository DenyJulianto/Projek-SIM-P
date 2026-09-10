<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventaris extends Model
{
    protected $table = 'inventaris';

    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'kategori',
        'jumlah',
        'kondisi',
        'lokasi',
        'tanggal_perolehan',
        'keterangan',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_perolehan' => 'date',
        ];
    }

    public function riwayat(): HasMany
    {
        return $this->hasMany(InventarisRiwayat::class)->orderByDesc('tanggal');
    }
}

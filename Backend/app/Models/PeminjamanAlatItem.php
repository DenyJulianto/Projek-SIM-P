<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeminjamanAlatItem extends Model
{
    protected $table = 'peminjaman_alat_item';

    protected $fillable = [
        'peminjaman_alat_id',
        'inventaris_id',
        'jumlah',
        'kondisi_sebelum',
        'kondisi_setelah',
    ];

    public function peminjaman(): BelongsTo
    {
        return $this->belongsTo(PeminjamanAlat::class, 'peminjaman_alat_id');
    }

    public function inventaris(): BelongsTo
    {
        return $this->belongsTo(Inventaris::class);
    }
}

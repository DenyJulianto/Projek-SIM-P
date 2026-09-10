<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventarisRiwayat extends Model
{
    protected $table = 'inventaris_riwayat';

    protected $fillable = [
        'inventaris_id',
        'user_id',
        'jenis',
        'tanggal',
        'keterangan',
        'biaya',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'biaya' => 'decimal:2',
        ];
    }

    public function inventaris(): BelongsTo
    {
        return $this->belongsTo(Inventaris::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

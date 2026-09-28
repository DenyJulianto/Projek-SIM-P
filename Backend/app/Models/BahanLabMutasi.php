<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BahanLabMutasi extends Model
{
    protected $table = 'bahan_lab_mutasi';

    protected $fillable = [
        'bahan_id',
        'jenis',
        'jumlah',
        'stok_setelah',
        'keterangan',
        'user_id',
        'tanggal',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'stok_setelah' => 'decimal:2',
            'tanggal' => 'date',
        ];
    }

    public function bahan(): BelongsTo
    {
        return $this->belongsTo(BahanLab::class, 'bahan_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

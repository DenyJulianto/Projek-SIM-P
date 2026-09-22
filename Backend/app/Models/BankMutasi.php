<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankMutasi extends Model
{
    protected $table = 'bank_mutasi';

    protected $fillable = [
        'tanggal',
        'jumlah',
        'keterangan',
        'nomor_va',
        'sumber',
        'status',
        'tagihan_id',
        'pembayaran_id',
        'dicatat_oleh',
        'dicocokkan_oleh',
        'tanggal_dicocokkan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'jumlah' => 'decimal:2',
            'tanggal_dicocokkan' => 'datetime',
        ];
    }

    public function tagihan(): BelongsTo
    {
        return $this->belongsTo(Tagihan::class);
    }

    public function pembayaran(): BelongsTo
    {
        return $this->belongsTo(Pembayaran::class);
    }

    public function dicatatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }

    public function dicocokkanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicocokkan_oleh');
    }
}

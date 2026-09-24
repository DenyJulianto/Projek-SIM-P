<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pembayaran extends Model
{
    protected $table = 'pembayaran';

    protected $fillable = ['tagihan_id', 'jumlah', 'tanggal_bayar', 'metode', 'catatan', 'dicatat_oleh'];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'tanggal_bayar' => 'date',
        ];
    }

    public function tagihan(): BelongsTo
    {
        return $this->belongsTo(Tagihan::class);
    }

    public function konfirmasi(): HasOne
    {
        return $this->hasOne(KonfirmasiPembayaran::class);
    }
}

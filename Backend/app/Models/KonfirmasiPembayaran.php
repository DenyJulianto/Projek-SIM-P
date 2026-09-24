<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KonfirmasiPembayaran extends Model
{
    protected $table = 'konfirmasi_pembayaran';

    protected $fillable = [
        'tagihan_id',
        'diajukan_oleh',
        'jumlah',
        'tanggal_transfer',
        'metode',
        'bukti_path',
        'catatan',
        'status',
        'diverifikasi_oleh',
        'catatan_verifikasi',
        'tanggal_verifikasi',
        'pembayaran_id',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'tanggal_transfer' => 'date',
            'tanggal_verifikasi' => 'datetime',
        ];
    }

    public function tagihan(): BelongsTo
    {
        return $this->belongsTo(Tagihan::class);
    }

    public function diajukanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diajukan_oleh');
    }

    public function diverifikasiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }

    public function pembayaran(): BelongsTo
    {
        return $this->belongsTo(Pembayaran::class);
    }
}

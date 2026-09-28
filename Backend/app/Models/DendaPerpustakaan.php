<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DendaPerpustakaan extends Model
{
    protected $table = 'denda_perpustakaan';

    protected $fillable = [
        'anggota_id',
        'peminjaman_item_id',
        'jenis_denda',
        'jumlah',
        'tanggal',
        'status_pembayaran',
        'petugas_id',
        'catatan',
        'dibayar_at',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'tanggal' => 'date',
            'dibayar_at' => 'datetime',
        ];
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(AnggotaPerpustakaan::class, 'anggota_id');
    }

    public function peminjamanItem(): BelongsTo
    {
        return $this->belongsTo(PeminjamanItem::class, 'peminjaman_item_id');
    }

    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservasiBuku extends Model
{
    protected $table = 'reservasi_buku';

    protected $fillable = [
        'nomor_reservasi',
        'anggota_id',
        'buku_id',
        'tanggal_reservasi',
        'batas_pengambilan',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_reservasi' => 'date',
            'batas_pengambilan' => 'date',
        ];
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(AnggotaPerpustakaan::class, 'anggota_id');
    }

    public function buku(): BelongsTo
    {
        return $this->belongsTo(Buku::class);
    }
}

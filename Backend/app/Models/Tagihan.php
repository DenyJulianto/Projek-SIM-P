<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tagihan extends Model
{
    protected $table = 'tagihan';

    protected $fillable = ['siswa_id', 'judul', 'jumlah', 'jatuh_tempo', 'status'];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'jatuh_tempo' => 'date',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function pembayaran(): HasMany
    {
        return $this->hasMany(Pembayaran::class);
    }
}

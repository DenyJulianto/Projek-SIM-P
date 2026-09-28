<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PemeliharaanAlat extends Model
{
    protected $table = 'pemeliharaan_alat';

    protected $fillable = [
        'inventaris_id',
        'jenis_pemeliharaan',
        'tanggal',
        'teknisi',
        'kondisi_sebelum',
        'tindakan',
        'kondisi_setelah',
        'biaya',
        'catatan',
        'tanggal_berikutnya',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'biaya' => 'decimal:2',
            'tanggal_berikutnya' => 'date',
        ];
    }

    public function inventaris(): BelongsTo
    {
        return $this->belongsTo(Inventaris::class);
    }

    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}

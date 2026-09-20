<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HariEfektif extends Model
{
    protected $table = 'hari_efektif';

    protected $fillable = ['periode_id', 'tanggal', 'jenis', 'keterangan'];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(HariEfektifPeriode::class, 'periode_id');
    }
}

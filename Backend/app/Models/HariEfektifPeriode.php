<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HariEfektifPeriode extends Model
{
    protected $table = 'hari_efektif_periode';

    protected $fillable = [
        'tahun_ajaran_id',
        'semester',
        'tanggal_mulai',
        'tanggal_selesai',
        'hari_sekolah',
        'status',
        'catatan',
        'dibuat_oleh',
    ];

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function hari(): HasMany
    {
        return $this->hasMany(HariEfektif::class, 'periode_id')->orderBy('tanggal');
    }
}

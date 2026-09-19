<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TujuanPembelajaran extends Model
{
    protected $table = 'tujuan_pembelajaran';

    protected $fillable = [
        'capaian_pembelajaran_id',
        'tingkat',
        'semester',
        'urutan',
        'deskripsi',
        'materi_terkait',
        'alokasi_waktu',
        'status',
        'progres',
        'dibuat_oleh',
    ];

    public function capaianPembelajaran(): BelongsTo
    {
        return $this->belongsTo(CapaianPembelajaran::class);
    }

    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function indikator(): HasMany
    {
        return $this->hasMany(KompetensiIndikator::class)->orderBy('urutan');
    }
}

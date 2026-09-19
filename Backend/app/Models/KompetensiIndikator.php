<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Indikator kompetensi/ketercapaian untuk satu Tujuan Pembelajaran (TP) —
 * digabung di bawah TP (bukan menu "Kompetensi" tersendiri) karena setiap
 * indikator hanya masuk akal dalam konteks TP induknya.
 */
class KompetensiIndikator extends Model
{
    protected $table = 'tp_indikator';

    protected $fillable = [
        'tujuan_pembelajaran_id',
        'urutan',
        'deskripsi',
        'kriteria_ketercapaian',
        'status_ketercapaian',
    ];

    public function tujuanPembelajaran(): BelongsTo
    {
        return $this->belongsTo(TujuanPembelajaran::class);
    }
}

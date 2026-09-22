<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramTahunanItem extends Model
{
    protected $table = 'program_tahunan_item';

    protected $fillable = [
        'program_tahunan_id',
        'tujuan_pembelajaran_id',
        'indikator_id',
        'materi',
        'semester',
        'bulan_mulai',
        'bulan_selesai',
        'alokasi_jp',
        'status_pelaksanaan',
        'catatan',
        'urutan',
    ];

    public function programTahunan(): BelongsTo
    {
        return $this->belongsTo(ProgramTahunan::class);
    }

    public function tujuanPembelajaran(): BelongsTo
    {
        return $this->belongsTo(TujuanPembelajaran::class);
    }

    public function indikator(): BelongsTo
    {
        return $this->belongsTo(KompetensiIndikator::class, 'indikator_id');
    }
}

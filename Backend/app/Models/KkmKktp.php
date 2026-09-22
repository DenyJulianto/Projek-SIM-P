<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class KkmKktp extends Model
{
    protected $table = 'kkm_kktp';

    protected $fillable = [
        'tahun_ajaran_id',
        'mata_pelajaran_id',
        'fase',
        'tingkat',
        'semester',
        'nilai_batas',
        'kriteria_ketercapaian',
        'status',
        'dibuat_oleh',
    ];

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function tujuanPembelajaran(): BelongsToMany
    {
        return $this->belongsToMany(TujuanPembelajaran::class, 'kkm_kktp_tp', 'kkm_kktp_id', 'tujuan_pembelajaran_id');
    }

    public function indikator(): BelongsToMany
    {
        return $this->belongsToMany(KompetensiIndikator::class, 'kkm_kktp_indikator', 'kkm_kktp_id', 'tp_indikator_id');
    }
}

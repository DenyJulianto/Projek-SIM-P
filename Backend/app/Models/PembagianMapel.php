<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PembagianMapel extends Model
{
    protected $table = 'pembagian_mapel';

    protected $fillable = [
        'tahun_ajaran_id',
        'semester',
        'kelas_id',
        'mata_pelajaran_id',
        'guru_id',
        'alokasi_jp',
        'status',
        'catatan',
        'dibuat_oleh',
    ];

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }
}

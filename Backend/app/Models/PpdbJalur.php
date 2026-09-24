<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpdbJalur extends Model
{
    protected $table = 'ppdb_jalur';

    protected $fillable = ['ppdb_periode_id', 'nama', 'kuota', 'deskripsi', 'kriteria', 'nilai_minimal', 'aktif', 'urutan'];

    protected function casts(): array
    {
        return ['kriteria' => 'array', 'aktif' => 'boolean'];
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(PpdbPeriode::class, 'ppdb_periode_id');
    }
}

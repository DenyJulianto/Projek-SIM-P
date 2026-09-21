<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PpdbPersyaratan extends Model
{
    protected $table = 'ppdb_persyaratan';

    protected $fillable = ['ppdb_periode_id', 'ppdb_jalur_id', 'tahap', 'nama', 'wajib', 'keterangan', 'urutan'];

    protected function casts(): array
    {
        return ['wajib' => 'boolean'];
    }
}

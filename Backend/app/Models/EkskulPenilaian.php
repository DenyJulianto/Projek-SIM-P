<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EkskulPenilaian extends Model
{
    protected $table = 'ekskul_penilaian';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['aspek' => 'array', 'nilai' => 'float', 'tanggal_validasi' => 'datetime', 'tanggal_kunci' => 'datetime'];
    }
}

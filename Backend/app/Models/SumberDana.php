<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SumberDana extends Model
{
    public const KATEGORI = [
        'pemerintah' => 'Pemerintah',
        'pemerintah_daerah' => 'Pemerintah Daerah',
        'komite' => 'Komite',
        'swasta' => 'Swasta',
        'sosial' => 'Sosial',
        'lainnya' => 'Lainnya',
    ];

    protected $table = 'sumber_dana';

    protected $fillable = ['tahun_ajaran', 'nama', 'kategori', 'keterangan', 'jumlah'];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
        ];
    }
}

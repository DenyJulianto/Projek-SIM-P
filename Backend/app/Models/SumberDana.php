<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SumberDana extends Model
{
    protected $table = 'sumber_dana';

    protected $fillable = ['tahun_ajaran', 'nama', 'keterangan', 'jumlah'];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
        ];
    }
}

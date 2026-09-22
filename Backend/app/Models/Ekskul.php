<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ekskul extends Model
{
    protected $table = 'ekskul';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['aspek_penilaian' => 'array'];
    }
}

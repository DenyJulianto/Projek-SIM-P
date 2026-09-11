<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JamBelajar extends Model
{
    protected $table = 'jam_belajar';

    protected $fillable = ['jam_ke', 'label', 'jam_mulai', 'jam_selesai'];
}

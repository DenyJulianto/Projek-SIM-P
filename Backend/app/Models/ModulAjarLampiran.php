<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModulAjarLampiran extends Model
{
    public const JENIS = [
        'lkpd' => 'LKPD',
        'rubrik' => 'Rubrik Penilaian',
        'bahan_bacaan' => 'Bahan Bacaan',
        'lainnya' => 'Lainnya',
    ];

    protected $table = 'modul_ajar_lampiran';

    protected $fillable = ['modul_ajar_id', 'jenis', 'nama_file', 'path', 'ukuran'];

    protected $hidden = ['path'];

    public function modulAjar(): BelongsTo
    {
        return $this->belongsTo(ModulAjar::class);
    }
}

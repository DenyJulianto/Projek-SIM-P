<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KalenderLampiran extends Model
{
    protected $table = 'kalender_lampiran';

    protected $fillable = ['kegiatan_id', 'nama_asli', 'path', 'mime', 'ukuran', 'diunggah_oleh'];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(KalenderKegiatan::class, 'kegiatan_id');
    }
}

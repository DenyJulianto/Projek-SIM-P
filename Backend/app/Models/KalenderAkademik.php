<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KalenderAkademik extends Model
{
    protected $table = 'kalender_akademik';

    protected $fillable = ['tahun_ajaran_id', 'status', 'catatan', 'diubah_oleh'];

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }
}

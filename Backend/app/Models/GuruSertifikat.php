<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuruSertifikat extends Model
{
    protected $table = 'guru_sertifikat';

    protected $fillable = ['guru_id', 'nama_file', 'path'];

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }
}

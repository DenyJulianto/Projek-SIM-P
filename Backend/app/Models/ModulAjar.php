<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModulAjar extends Model
{
    protected $table = 'modul_ajar';

    protected $fillable = ['guru_id', 'kurikulum', 'judul', 'mata_pelajaran', 'kelas', 'status', 'data'];

    protected function casts(): array
    {
        return ['data' => 'array'];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }
}

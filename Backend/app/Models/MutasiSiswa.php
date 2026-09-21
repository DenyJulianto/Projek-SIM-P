<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutasiSiswa extends Model
{
    protected $table = 'mutasi_siswa';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['tanggal' => 'date', 'status_siswa_diterapkan' => 'boolean'];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }
}

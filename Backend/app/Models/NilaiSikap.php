<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NilaiSikap extends Model
{
    protected $table = 'nilai_sikap';

    protected $fillable = ['siswa_id', 'guru_id', 'jenis', 'predikat', 'deskripsi', 'semester', 'tahun_ajaran'];

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }
}

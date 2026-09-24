<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ujian extends Model
{
    protected $table = 'ujian';

    protected $fillable = ['kelas_id', 'mata_pelajaran_id', 'guru_id', 'judul', 'deskripsi', 'waktu_mulai', 'waktu_selesai', 'durasi_menit', 'kkm'];

    protected function casts(): array
    {
        return [
            'waktu_mulai' => 'datetime',
            'waktu_selesai' => 'datetime',
            'kkm' => 'integer',
        ];
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function soal(): HasMany
    {
        return $this->hasMany(UjianSoal::class)->orderBy('urutan');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(UjianAttempt::class);
    }
}

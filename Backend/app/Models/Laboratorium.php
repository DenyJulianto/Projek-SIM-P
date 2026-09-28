<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laboratorium extends Model
{
    protected $table = 'laboratorium';

    protected $fillable = [
        'nama',
        'kategori',
        'penanggung_jawab_guru_id',
        'kapasitas',
        'foto_path',
        'deskripsi',
        'status',
        'dibuat_oleh',
    ];

    public function penanggungJawab(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'penanggung_jawab_guru_id');
    }

    public function peralatan(): HasMany
    {
        return $this->hasMany(Inventaris::class, 'laboratorium_id');
    }

    public function jadwal(): HasMany
    {
        return $this->hasMany(JadwalLab::class, 'laboratorium_id');
    }

    public function bahan(): HasMany
    {
        return $this->hasMany(BahanLab::class, 'laboratorium_id');
    }
}

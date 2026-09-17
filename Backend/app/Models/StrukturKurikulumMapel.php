<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StrukturKurikulumMapel extends Model
{
    protected $table = 'struktur_kurikulum_mapel';

    protected $fillable = [
        'struktur_kurikulum_id',
        'kelompok',
        'mata_pelajaran_id',
        'nama_custom',
        'jenis',
        'is_muatan_lokal',
        'is_projek',
        'jp_per_minggu',
        'alokasi_jp_ganjil',
        'alokasi_jp_genap',
        'urutan',
    ];

    protected $appends = ['nama'];

    protected function casts(): array
    {
        return [
            'is_muatan_lokal' => 'boolean',
            'is_projek' => 'boolean',
        ];
    }

    public function strukturKurikulum(): BelongsTo
    {
        return $this->belongsTo(StrukturKurikulum::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function getNamaAttribute(): string
    {
        return $this->mataPelajaran?->nama_mapel ?? $this->nama_custom ?? '-';
    }
}

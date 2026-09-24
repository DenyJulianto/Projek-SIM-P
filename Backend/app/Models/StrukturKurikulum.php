<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StrukturKurikulum extends Model
{
    protected $table = 'struktur_kurikulum';

    protected $fillable = [
        'tahun_ajaran_id',
        'tingkat',
        'fase',
        'kurikulum',
        'keterangan',
        'is_aktif',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'is_aktif' => 'boolean',
        ];
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function mapel(): HasMany
    {
        return $this->hasMany(StrukturKurikulumMapel::class)->orderBy('urutan');
    }
}

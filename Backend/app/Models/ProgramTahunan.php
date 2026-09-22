<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramTahunan extends Model
{
    protected $table = 'program_tahunan';

    protected $fillable = [
        'tahun_ajaran_id',
        'kelas_id',
        'fase',
        'mata_pelajaran_id',
        'guru_id',
        'minggu_efektif_ganjil',
        'minggu_efektif_genap',
        'catatan',
        'status_dokumen',
        'diverifikasi_oleh',
        'tanggal_verifikasi',
        'catatan_verifikasi',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return ['tanggal_verifikasi' => 'datetime'];
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
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

    public function diverifikasiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }

    public function item(): HasMany
    {
        return $this->hasMany(ProgramTahunanItem::class)
            ->orderByRaw("case semester when 'ganjil' then 0 else 1 end")
            ->orderBy('urutan');
    }
}

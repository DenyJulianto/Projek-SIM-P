<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramSemester extends Model
{
    protected $table = 'program_semester';

    protected $fillable = [
        'tahun_ajaran_id',
        'semester',
        'kelas_id',
        'fase',
        'mata_pelajaran_id',
        'guru_id',
        'catatan',
        'status_dokumen',
        'disahkan_oleh',
        'tanggal_pengesahan',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return ['tanggal_pengesahan' => 'datetime'];
    }

    public function disahkanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disahkan_oleh');
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

    public function item(): HasMany
    {
        return $this->hasMany(ProgramSemesterItem::class)->orderBy('minggu_ke')->orderBy('urutan');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Silabus, Pemetaan ATP, atau Jurnal Harian milik guru (lihat StrukturDokumenPendukung). */
class DokumenPendukung extends Model
{
    protected $table = 'dokumen_pendukung';

    protected $fillable = ['jenis', 'tahun_ajaran_id', 'kelas_id', 'mata_pelajaran_id', 'semester', 'data'];

    protected function casts(): array
    {
        return ['data' => 'array'];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
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
}

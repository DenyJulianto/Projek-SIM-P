<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerifikasiNilai extends Model
{
    protected $table = 'verifikasi_nilai';

    protected $fillable = [
        'tahun_ajaran_id', 'semester', 'kelas_id', 'mata_pelajaran_id', 'status',
        'verifikator_id', 'tanggal_verifikasi', 'catatan', 'hasil_pemeriksaan',
    ];

    protected function casts(): array
    {
        return ['hasil_pemeriksaan' => 'array'];
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function verifikator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verifikator_id');
    }
}

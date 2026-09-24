<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaporanAkademikRiwayat extends Model
{
    protected $table = 'laporan_akademik_riwayat';

    protected $fillable = [
        'jenis', 'judul', 'format', 'tahun_ajaran_id', 'semester', 'periode', 'parameter',
        'file_path', 'file_nama', 'ukuran', 'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return ['parameter' => 'array'];
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}

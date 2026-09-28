<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KegiatanLab extends Model
{
    protected $table = 'kegiatan_lab';

    protected $fillable = [
        'nama_kegiatan',
        'jenis_kegiatan',
        'laboratorium_id',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'penanggung_jawab',
        'kelas_id',
        'peserta_lainnya',
        'mata_pelajaran_id',
        'tujuan',
        'peralatan_digunakan',
        'bahan_digunakan',
        'dokumentasi_path',
        'catatan',
        'status',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function laboratorium(): BelongsTo
    {
        return $this->belongsTo(Laboratorium::class);
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

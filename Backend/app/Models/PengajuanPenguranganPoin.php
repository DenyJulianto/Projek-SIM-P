<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pengajuan BK untuk mengurangi poin kedisiplinan seorang siswa atas suatu
 * pelanggaran. Poin siswa TIDAK berubah saat baris ini dibuat — hanya
 * berubah setelah Kesiswaan menyetujuinya lewat
 * PengajuanPenguranganPoinController::setujui().
 */
class PengajuanPenguranganPoin extends Model
{
    protected $table = 'pengajuan_pengurangan_poin';

    protected $fillable = [
        'siswa_id',
        'pelanggaran_id',
        'diajukan_oleh',
        'poin_diajukan',
        'alasan',
        'status',
        'catatan_kesiswaan',
        'diputuskan_oleh',
        'diputuskan_at',
    ];

    protected function casts(): array
    {
        return [
            'diputuskan_at' => 'datetime',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function pelanggaran(): BelongsTo
    {
        return $this->belongsTo(Pelanggaran::class);
    }

    public function diajukanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diajukan_oleh');
    }

    public function diputuskanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diputuskan_oleh');
    }
}

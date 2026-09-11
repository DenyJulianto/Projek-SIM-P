<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengajuanKepegawaian extends Model
{
    protected $table = 'pengajuan_kepegawaian';

    protected $fillable = [
        'jenis', 'judul', 'guru_id', 'keterangan', 'status',
        'diajukan_oleh', 'disetujui_oleh', 'catatan_persetujuan', 'tanggal_keputusan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_keputusan' => 'datetime',
        ];
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function diajukanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diajukan_oleh');
    }

    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }
}

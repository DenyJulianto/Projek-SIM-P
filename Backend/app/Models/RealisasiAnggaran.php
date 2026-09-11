<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RealisasiAnggaran extends Model
{
    protected $table = 'realisasi_anggaran';

    protected $fillable = ['pengajuan_anggaran_id', 'jumlah', 'tanggal', 'keterangan', 'dicatat_oleh'];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'tanggal' => 'date',
        ];
    }

    public function pengajuanAnggaran(): BelongsTo
    {
        return $this->belongsTo(PengajuanAnggaran::class);
    }
}

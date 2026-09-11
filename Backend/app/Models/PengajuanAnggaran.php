<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PengajuanAnggaran extends Model
{
    protected $table = 'pengajuan_anggaran';

    protected $fillable = [
        'anggaran_pos_id', 'judul', 'jumlah', 'keterangan', 'status',
        'diajukan_oleh', 'disetujui_oleh', 'catatan_persetujuan', 'tanggal_keputusan',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'tanggal_keputusan' => 'datetime',
        ];
    }

    public function anggaranPos(): BelongsTo
    {
        return $this->belongsTo(AnggaranPos::class);
    }

    public function diajukanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diajukan_oleh');
    }

    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }

    public function realisasi(): HasMany
    {
        return $this->hasMany(RealisasiAnggaran::class);
    }
}

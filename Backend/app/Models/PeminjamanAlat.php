<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeminjamanAlat extends Model
{
    protected $table = 'peminjaman_alat';

    protected $fillable = [
        'nomor_transaksi',
        'peminjam_user_id',
        'jabatan_kelas',
        'tujuan_penggunaan',
        'tanggal_pinjam',
        'tanggal_kembali_rencana',
        'tanggal_kembali_aktual',
        'petugas_id',
        'disetujui_oleh',
        'disetujui_at',
        'catatan_kerusakan',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pinjam' => 'date',
            'tanggal_kembali_rencana' => 'date',
            'tanggal_kembali_aktual' => 'date',
            'disetujui_at' => 'datetime',
        ];
    }

    public function peminjam(): BelongsTo
    {
        return $this->belongsTo(User::class, 'peminjam_user_id');
    }

    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }

    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }

    public function item(): HasMany
    {
        return $this->hasMany(PeminjamanAlatItem::class, 'peminjaman_alat_id');
    }
}

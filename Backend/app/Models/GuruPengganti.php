<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuruPengganti extends Model
{
    protected $table = 'guru_pengganti';

    protected $fillable = [
        'tanggal',
        'jadwal_id',
        'kelas_id',
        'mata_pelajaran_id',
        'jam_mulai',
        'jam_selesai',
        'guru_berhalangan_id',
        'guru_pengganti_id',
        'alasan',
        'status',
        'catatan',
        'catatan_keputusan',
        'diputuskan_oleh',
        'tanggal_keputusan',
        'dibuat_oleh',
    ];

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function guruBerhalangan(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'guru_berhalangan_id');
    }

    public function guruPengganti(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'guru_pengganti_id');
    }

    public function diputuskanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diputuskan_oleh');
    }
}

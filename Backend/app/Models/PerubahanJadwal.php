<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerubahanJadwal extends Model
{
    protected $table = 'perubahan_jadwal';

    protected $fillable = [
        'jadwal_id', 'kelas_id', 'mata_pelajaran_id', 'jenis', 'tanggal_perubahan', 'tanggal_baru',
        'hari_lama', 'jam_mulai_lama', 'jam_selesai_lama', 'guru_lama_id', 'ruang_lama',
        'hari_baru', 'jam_mulai_baru', 'jam_selesai_baru', 'guru_baru_id', 'ruang_baru',
        'alasan', 'catatan', 'status', 'catatan_keputusan', 'diputuskan_oleh', 'tanggal_keputusan',
        'diterapkan_at', 'dibuat_oleh',
    ];

    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(JadwalPelajaran::class, 'jadwal_id');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class);
    }

    public function guruLama(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'guru_lama_id');
    }

    public function guruBaru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'guru_baru_id');
    }

    public function pengaju(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function diputuskanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diputuskan_oleh');
    }
}

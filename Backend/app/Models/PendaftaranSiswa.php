<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendaftaranSiswa extends Model
{
    protected $table = 'pendaftaran_siswa';

    protected $fillable = [
        'nama_lengkap', 'nisn', 'nis', 'tanggal_lahir', 'jenis_kelamin', 'email', 'no_hp',
        'nama_wali', 'no_hp_wali', 'status', 'alasan_penolakan', 'kelas_id', 'siswa_id',
        'diproses_oleh', 'diproses_at', 'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date:Y-m-d',
            'diproses_at' => 'datetime',
        ];
    }

    public function pemroses(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }
}

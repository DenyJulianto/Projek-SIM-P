<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KegiatanPerpustakaan extends Model
{
    protected $table = 'kegiatan_perpustakaan';

    protected $fillable = [
        'nama_kegiatan',
        'jenis_kegiatan',
        'tanggal',
        'lokasi',
        'penanggung_jawab',
        'jumlah_peserta',
        'deskripsi',
        'dokumentasi_path',
        'status',
        'dibuat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }
}

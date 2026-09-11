<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PemanggilanOrangTua extends Model
{
    protected $table = 'pemanggilan_orang_tua';

    protected $fillable = [
        'siswa_id',
        'kasus_id',
        'guru_id',
        'tanggal_pemanggilan',
        'alasan',
        'status',
        'catatan_pertemuan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pemanggilan' => 'date',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }

    public function kasus(): BelongsTo
    {
        return $this->belongsTo(KasusSiswa::class, 'kasus_id');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }
}

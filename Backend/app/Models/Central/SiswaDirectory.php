<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Models\Sekolah;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Salinan data siswa lintas sekolah untuk direktori nasional Super Admin.
 * Selalu baca lewat model ini (bukan App\Models\Siswa) di luar konteks
 * tenant, karena tabel ini hidup di database central, bukan per-sekolah.
 */
class SiswaDirectory extends Model
{
    protected $table = 'siswa_direktori_nasional';

    protected $fillable = [
        'sekolah_id',
        'siswa_id',
        'nis',
        'nama',
        'jenis_kelamin',
        'kelas',
        'tahun_masuk',
        'status',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'synced_at' => 'datetime',
        ];
    }

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    public function sekolah(): BelongsTo
    {
        return $this->belongsTo(Sekolah::class, 'sekolah_id');
    }
}

<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Models\Sekolah;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Salinan data guru lintas sekolah untuk direktori nasional Super Admin.
 * Selalu baca lewat model ini (bukan App\Models\Guru) di luar konteks
 * tenant, karena tabel ini hidup di database central, bukan per-sekolah.
 */
class GuruDirectory extends Model
{
    protected $table = 'guru_direktori_nasional';

    protected $fillable = [
        'sekolah_id',
        'guru_id',
        'nip',
        'nuptk',
        'nama',
        'gelar',
        'jabatan',
        'mata_pelajaran',
        'status_kepegawaian',
        'pendidikan_terakhir',
        'jenis_kelamin',
        'no_telepon',
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

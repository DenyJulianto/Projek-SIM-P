<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

/** Tab "Manfaat untuk Setiap Pengguna" (per peran) di landing platform. */
class LandingManfaat extends Model
{
    public const GAMBAR_BAWAAN = ['guru', 'siswa', 'orangtua', 'admin'];

    protected $table = 'landing_manfaat';

    protected $fillable = ['peran', 'judul', 'teks', 'poin', 'gambar_bawaan', 'gambar', 'urutan', 'aktif'];

    protected $appends = ['gambar_url'];

    protected function casts(): array
    {
        return [
            'poin' => 'array',
            'urutan' => 'integer',
            'aktif' => 'boolean',
        ];
    }

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    public function getGambarUrlAttribute(): ?string
    {
        return $this->gambar ? url('api/platform/gambar/'.$this->gambar) : null;
    }
}

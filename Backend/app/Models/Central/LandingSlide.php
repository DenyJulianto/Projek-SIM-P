<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

/**
 * Slide hero landing platform. Judul ditampilkan tiga bagian: putih, emas,
 * lalu baris lanjutan. Tanpa gambar, landing memakai foto hero bawaan.
 */
class LandingSlide extends Model
{
    protected $table = 'landing_slide';

    protected $fillable = ['judul_putih', 'judul_emas', 'judul_lanjutan', 'teks', 'gambar', 'urutan', 'aktif'];

    protected $appends = ['gambar_url'];

    protected function casts(): array
    {
        return [
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

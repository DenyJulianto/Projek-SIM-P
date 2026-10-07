<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

/** Kartu "Fitur Unggulan" di landing platform. */
class LandingFitur extends Model
{
    public const ILUSTRASI = ['foto', 'pengguna', 'tabel', 'grafik'];

    protected $table = 'landing_fitur';

    protected $fillable = ['judul', 'deskripsi', 'label', 'meta', 'ilustrasi', 'gambar', 'urutan', 'aktif'];

    protected $appends = ['gambar_url'];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
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

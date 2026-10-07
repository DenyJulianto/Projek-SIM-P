<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

/** Testimoni asli pengguna untuk landing platform (hanya yang aktif yang tampil). */
class LandingTestimoni extends Model
{
    protected $table = 'landing_testimoni';

    protected $fillable = ['kutipan', 'nama', 'jabatan', 'sekolah', 'urutan', 'aktif'];

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
}

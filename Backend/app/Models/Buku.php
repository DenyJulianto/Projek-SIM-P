<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Buku extends Model
{
    protected $table = 'buku';

    protected $fillable = [
        'isbn',
        'judul',
        'penulis',
        'penerbit',
        'tahun_terbit',
        'kategori',
        'subjek',
        'bahasa',
        'edisi',
        'sinopsis',
        'cover_path',
        'lokasi_rak',
        'status',
        'dibuat_oleh',
    ];

    public function eksemplar(): HasMany
    {
        return $this->hasMany(EksemplarBuku::class);
    }

    public function reservasi(): HasMany
    {
        return $this->hasMany(ReservasiBuku::class);
    }
}

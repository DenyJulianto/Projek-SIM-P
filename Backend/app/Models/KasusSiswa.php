<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KasusSiswa extends Model
{
    protected $table = 'kasus_siswa';

    protected $fillable = [
        'siswa_id',
        'guru_id',
        'judul',
        'kategori',
        'tingkat',
        'deskripsi',
        'tanggal_kejadian',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_kejadian' => 'date',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function tindakan(): HasMany
    {
        return $this->hasMany(KasusTindakan::class, 'kasus_id');
    }

    public function pemanggilan(): HasMany
    {
        return $this->hasMany(PemanggilanOrangTua::class, 'kasus_id');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AkunSiswaBatch extends Model
{
    protected $table = 'akun_siswa_batch';

    protected $fillable = [
        'dibuat_oleh', 'kelas_id', 'sertakan_ortu', 'status', 'total',
        'akun_siswa', 'akun_ortu', 'dilewati', 'file_kredensial', 'pesan',
    ];

    protected $hidden = ['file_kredensial'];

    protected $appends = ['ada_kredensial'];

    protected function casts(): array
    {
        return ['sertakan_ortu' => 'boolean'];
    }

    public function getAdaKredensialAttribute(): bool
    {
        return $this->file_kredensial !== null;
    }

    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }
}

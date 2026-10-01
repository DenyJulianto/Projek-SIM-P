<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Profil akun Super Admin (database central). NIK disimpan terenkripsi dan
 * tidak pernah dikirim utuh ke frontend — hanya versi tersamarnya.
 */
class ProfilSuperAdmin extends Model
{
    protected $table = 'profil_super_admin';

    protected $fillable = [
        'user_id', 'nip', 'nik', 'foto', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
        'instansi', 'unit_kerja', 'jabatan', 'pangkat_golongan', 'alamat_kantor',
        'telepon', 'telepon_kantor', 'preferensi', 'password_diganti_at',
    ];

    protected $hidden = ['nik'];

    protected function casts(): array
    {
        return [
            'nik' => 'encrypted',
            'tanggal_lahir' => 'date:Y-m-d',
            'preferensi' => 'array',
            'password_diganti_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function nikTersamar(): ?string
    {
        if (! $this->nik) {
            return null;
        }

        return str_repeat('•', max(0, strlen($this->nik) - 4)).substr($this->nik, -4);
    }
}

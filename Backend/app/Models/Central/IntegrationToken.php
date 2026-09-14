<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

/**
 * Token untuk akses baca-saja ke API Integrasi (mis. sistem sekolah/dinas
 * lain yang ingin menarik data direktori nasional). BUKAN integrasi resmi
 * dengan Dapodik/Kemendikbud — SIM Pendidikan bukan platform resmi
 * pemerintah — ini cuma mekanisme umum yang bisa dipakai pihak mana pun
 * yang perlu menarik data dari sini, termasuk kalau sekolah/dinas ingin
 * menghubungkannya ke sistem mereka sendiri.
 */
class IntegrationToken extends Model
{
    protected $table = 'integration_tokens';

    protected $fillable = [
        'name',
        'token_hash',
        'abilities',
        'created_by_name',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'array',
            'last_used_at' => 'datetime',
        ];
    }

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    public function can(string $ability): bool
    {
        return in_array($ability, $this->abilities ?? [], true);
    }
}

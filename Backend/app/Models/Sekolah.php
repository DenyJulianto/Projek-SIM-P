<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Central\GuruDirectory;
use App\Models\Central\SiswaDirectory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Sekolah extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    public function guruDirectory(): HasMany
    {
        return $this->hasMany(GuruDirectory::class, 'sekolah_id');
    }

    public function siswaDirectory(): HasMany
    {
        return $this->hasMany(SiswaDirectory::class, 'sekolah_id');
    }

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'nama_sekolah',
            'npsn',
            'jenjang',
            'alamat',
            'kecamatan',
            'kelurahan',
            'kabupaten_kota',
            'provinsi',
            'latitude',
            'longitude',
            'telepon',
            'email',
            'logo',
            'status',
            'module_settings',
        ];
    }

    protected function casts(): array
    {
        return [
            'module_settings' => 'array',
        ];
    }

    /**
     * Modul opsional aktif untuk sekolah ini, digabung dengan default "semua
     * aktif" untuk key yang belum pernah diatur — supaya pemanggil (endpoint
     * central maupun EnsureModuleEnabled) tidak perlu menangani null sendiri.
     */
    public function resolvedModuleSettings(): array
    {
        $defaults = array_fill_keys(array_keys(config('sim.modules')), true);

        return array_merge($defaults, $this->module_settings ?? []);
    }
}

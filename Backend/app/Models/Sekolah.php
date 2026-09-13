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
        ];
    }
}

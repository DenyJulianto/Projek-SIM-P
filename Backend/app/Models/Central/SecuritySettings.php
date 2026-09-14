<?php

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu baris pengaturan keamanan platform (kontrol PII & retensi data).
 * Selalu diakses lewat current() supaya pemanggil tidak perlu tahu ID-nya —
 * baris pertama dibuat otomatis kalau belum ada.
 */
class SecuritySettings extends Model
{
    protected $table = 'security_settings';

    protected $fillable = [
        'mask_pii_enabled',
        'log_retention_days',
        'last_retention_purge_at',
    ];

    protected function casts(): array
    {
        return [
            'mask_pii_enabled' => 'boolean',
            'last_retention_purge_at' => 'datetime',
        ];
    }

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * firstOrCreate([]) tanpa nilai eksplisit akan tetap INSERT baris yang
     * benar (kolom kosong jatuh ke default skema database), TAPI instance
     * yang dikembalikan di memori tidak otomatis terisi nilai default itu
     * kecuali di-refresh — jadi baris PERTAMA kali dibuat akan terlihat
     * null padahal di database sudah benar (0/365). Kasih nilai eksplisit
     * di sini supaya konsisten sejak pertama kali dipanggil, bukan cuma
     * dari panggilan kedua dan seterusnya.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'mask_pii_enabled' => false,
            'log_retention_days' => 365,
        ]);
    }
}

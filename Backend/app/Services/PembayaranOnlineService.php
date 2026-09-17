<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\IntegrationConfig;
use App\Models\Siswa;

/**
 * Pengaturan bersama fitur Pembayaran Online (Virtual Account & QRIS) tanpa
 * payment gateway pihak ketiga. Disimpan lewat tabel integration_configs
 * yang sudah ada (kunci "pembayaran_online") supaya tidak perlu tabel baru
 * hanya untuk satu baris pengaturan.
 */
class PembayaranOnlineService
{
    private const CONFIG_KEY = 'pembayaran_online';

    public function integration(): IntegrationConfig
    {
        return IntegrationConfig::firstOrCreate(
            ['key' => self::CONFIG_KEY],
            [
                'name' => 'Pembayaran Online (Virtual Account & QRIS)',
                'description' => 'Nomor Virtual Account otomatis per siswa dan QRIS dinamis dari QRIS statis milik sekolah, tanpa payment gateway pihak ketiga.',
                'enabled' => false,
            ]
        );
    }

    public function config(): array
    {
        return $this->integration()->config ?? [];
    }

    public function saveConfig(array $data): array
    {
        $integration = $this->integration();
        $integration->config = $data;
        $integration->enabled = true;
        $integration->save();

        return $integration->config;
    }

    public function nomorVa(Siswa $siswa, ?string $prefix = null): ?string
    {
        $prefix ??= $this->config()['va_prefix'] ?? null;
        if (! $prefix) {
            return null;
        }

        $suffix = $siswa->nis ? preg_replace('/\D/', '', (string) $siswa->nis) : '';
        if ($suffix === '' || $suffix === null) {
            $suffix = (string) $siswa->id;
        }

        return $prefix.str_pad($suffix, 8, '0', STR_PAD_LEFT);
    }
}

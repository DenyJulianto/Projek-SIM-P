<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Penyamaran (masking) field data pribadi (PII) — dipakai di ekspor Excel
 * dan API Integrasi (data yang KELUAR dari sistem ke pihak lain/file),
 * bukan di halaman internal Super Admin sendiri (butuh data asli untuk
 * kerja administratif). Diaktifkan/nonaktifkan lewat menu Pengaturan
 * Keamanan > Kontrol Data Pribadi (PII) — lihat SecurityController.
 *
 * Ini BUKAN enkripsi kolom database (data tetap tersimpan utuh di database,
 * cuma disamarkan saat ditampilkan/diekspor) — kecuali untuk secret 2FA
 * yang memang benar-benar dienkripsi lewat cast 'encrypted' di User model.
 */
class PiiMasker
{
    public static function id(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $length = strlen($value);
        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        return substr($value, 0, 2).str_repeat('*', $length - 4).substr($value, -2);
    }

    public static function phone(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $length = strlen($value);
        if ($length <= 6) {
            return str_repeat('*', $length);
        }

        return substr($value, 0, 4).str_repeat('*', $length - 6).substr($value, -2);
    }

    public static function email(?string $value): ?string
    {
        if ($value === null || $value === '' || ! str_contains($value, '@')) {
            return $value;
        }

        [$local, $domain] = explode('@', $value, 2);
        $visible = min(2, strlen($local));

        return substr($local, 0, $visible).str_repeat('*', max(strlen($local) - $visible, 1)).'@'.$domain;
    }
}

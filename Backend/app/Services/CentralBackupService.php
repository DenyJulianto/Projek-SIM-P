<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Storage;

/**
 * Sama seperti BackupService (tenant), tapi khusus database central —
 * dipakai fitur "Backup & Restore Data Nasional" Super Admin. Path database
 * diambil eksplisit dari koneksi central (bukan "default" yang aktif),
 * supaya tetap benar dipanggil dari konteks manapun, bukan cuma saat
 * default connection kebetulan central.
 */
class CentralBackupService
{
    public const DIR = 'central-backups';

    public function databasePath(): string
    {
        return config('database.connections.'.config('tenancy.database.central_connection').'.database');
    }

    public function create(string $prefix = 'backup'): array
    {
        $name = "{$prefix}-".now()->format('Y-m-d_His').'.sqlite';

        Storage::disk('local')->put(self::DIR.'/'.$name, file_get_contents($this->databasePath()));

        return [
            'name' => $name,
            'size' => Storage::disk('local')->size(self::DIR.'/'.$name),
            'created_at' => Storage::disk('local')->lastModified(self::DIR.'/'.$name),
        ];
    }
}

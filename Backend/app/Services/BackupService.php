<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class BackupService
{
    public const DIR = 'backups';

    public function databasePath(): string
    {
        return config('database.connections.'.config('database.default').'.database');
    }

    /**
     * Salin database tenant aktif ke disk 'backups' (tenant-scoped lewat
     * filesystem tenancy bootstrapper). Dipakai baik oleh endpoint manual
     * "Backup Sekarang" maupun oleh scheduler otomatis.
     */
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

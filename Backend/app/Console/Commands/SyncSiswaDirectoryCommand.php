<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Sekolah;
use App\Services\DirectorySyncService;
use Illuminate\Console\Command;

/**
 * Backfill direktori siswa nasional dari seluruh (atau satu) database
 * sekolah. Perubahan sehari-hari sudah otomatis disinkronkan lewat
 * SiswaObserver; perintah ini untuk data yang sudah ada sebelum observer
 * dipasang, atau untuk memperbaiki direktori jika pernah kehilangan job.
 */
class SyncSiswaDirectoryCommand extends Command
{
    protected $signature = 'directory:sync-siswa {--sekolah= : ID sekolah tertentu, kosongkan untuk semua sekolah}';

    protected $description = 'Sinkronkan data siswa dari database setiap sekolah ke direktori siswa nasional (central).';

    public function handle(DirectorySyncService $syncService): int
    {
        $sekolahId = $this->option('sekolah');

        $sekolahs = $sekolahId
            ? Sekolah::where('id', $sekolahId)->get()
            : Sekolah::all();

        if ($sekolahs->isEmpty()) {
            $this->warn('Tidak ada sekolah yang cocok untuk disinkronkan.');

            return self::SUCCESS;
        }

        foreach ($sekolahs as $sekolah) {
            $count = $sekolah->run(fn () => $syncService->syncSiswa($sekolah));

            $this->info("{$sekolah->nama_sekolah}: {$count} siswa disinkronkan.");
        }

        return self::SUCCESS;
    }
}

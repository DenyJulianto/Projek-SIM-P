<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Central\SiswaDirectory;
use App\Models\Sekolah;
use App\Models\Siswa;
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

    public function handle(): int
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
            $count = 0;

            $sekolah->run(function () use ($sekolah, &$count) {
                Siswa::with('kelas')->chunk(100, function ($siswas) use ($sekolah, &$count) {
                    foreach ($siswas as $siswa) {
                        SiswaDirectory::updateOrCreate(
                            ['sekolah_id' => $sekolah->id, 'siswa_id' => $siswa->id],
                            [
                                'nis' => $siswa->nis,
                                'nama' => $siswa->nama,
                                'jenis_kelamin' => $siswa->jenis_kelamin,
                                'kelas' => $siswa->kelas?->nama_kelas,
                                'tahun_masuk' => $siswa->tahun_masuk,
                                'status' => $siswa->status,
                                'synced_at' => now(),
                            ]
                        );
                        $count++;
                    }
                });
            });

            $this->info("{$sekolah->nama_sekolah}: {$count} siswa disinkronkan.");
        }

        return self::SUCCESS;
    }
}

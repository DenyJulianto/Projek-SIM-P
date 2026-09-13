<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Central\GuruDirectory;
use App\Models\Guru;
use App\Models\Sekolah;
use Illuminate\Console\Command;

/**
 * Backfill direktori guru nasional dari seluruh (atau satu) database
 * sekolah. Perubahan sehari-hari sudah otomatis disinkronkan lewat
 * GuruObserver; perintah ini untuk data yang sudah ada sebelum observer
 * dipasang, atau untuk memperbaiki direktori jika pernah kehilangan job.
 */
class SyncGuruDirectoryCommand extends Command
{
    protected $signature = 'directory:sync-guru {--sekolah= : ID sekolah tertentu, kosongkan untuk semua sekolah}';

    protected $description = 'Sinkronkan data guru dari database setiap sekolah ke direktori guru nasional (central).';

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
                Guru::query()->chunk(100, function ($gurus) use ($sekolah, &$count) {
                    foreach ($gurus as $guru) {
                        GuruDirectory::updateOrCreate(
                            ['sekolah_id' => $sekolah->id, 'guru_id' => $guru->id],
                            [
                                'nip' => $guru->nip,
                                'nuptk' => $guru->nuptk,
                                'nama' => $guru->nama,
                                'gelar' => $guru->gelar,
                                'jabatan' => $guru->jabatan,
                                'mata_pelajaran' => $guru->mata_pelajaran,
                                'status_kepegawaian' => $guru->status_kepegawaian,
                                'pendidikan_terakhir' => $guru->pendidikan_terakhir,
                                'jenis_kelamin' => $guru->jenis_kelamin,
                                'no_telepon' => $guru->no_telepon,
                                'status' => $guru->status,
                                'synced_at' => now(),
                            ]
                        );
                        $count++;
                    }
                });
            });

            $this->info("{$sekolah->nama_sekolah}: {$count} guru disinkronkan.");
        }

        return self::SUCCESS;
    }
}

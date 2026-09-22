<?php

declare(strict_types=1);

namespace App\Observers;

use App\Jobs\SyncGuruToCentralDirectory;
use App\Models\Guru;

/**
 * Menjaga direktori guru nasional (central) tetap sinkron setiap kali
 * data guru berubah di database sekolah manapun. Lihat juga perintah
 * `php artisan directory:sync-guru` untuk backfill data yang sudah ada.
 */
class GuruObserver
{
    public function saved(Guru $guru): void
    {
        $sekolahId = tenant('id');

        if ($sekolahId === null) {
            return;
        }

        SyncGuruToCentralDirectory::dispatch($sekolahId, $guru->id, $guru->only([
            'nip',
            'nuptk',
            'nama',
            'gelar',
            'jabatan',
            'mata_pelajaran',
            'status_kepegawaian',
            'pendidikan_terakhir',
            'jenis_kelamin',
            'no_telepon',
            'status',
        ]));
    }

    public function deleted(Guru $guru): void
    {
        $sekolahId = tenant('id');

        if ($sekolahId === null) {
            return;
        }

        SyncGuruToCentralDirectory::dispatch($sekolahId, $guru->id, null);
    }
}

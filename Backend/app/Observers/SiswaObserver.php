<?php

declare(strict_types=1);

namespace App\Observers;

use App\Jobs\SyncSiswaToCentralDirectory;
use App\Models\Siswa;

/**
 * Menjaga direktori siswa nasional (central) tetap sinkron setiap kali
 * data siswa berubah di database sekolah manapun. Lihat juga perintah
 * `php artisan directory:sync-siswa` untuk backfill data yang sudah ada.
 */
class SiswaObserver
{
    public function saved(Siswa $siswa): void
    {
        $sekolahId = tenant('id');

        if ($sekolahId === null) {
            return;
        }

        SyncSiswaToCentralDirectory::dispatch($sekolahId, $siswa->id, [
            'nis' => $siswa->nis,
            'nama' => $siswa->nama,
            'jenis_kelamin' => $siswa->jenis_kelamin,
            'kelas' => $siswa->kelas?->nama_kelas,
            'tahun_masuk' => $siswa->tahun_masuk,
            'status' => $siswa->status,
        ]);
    }

    public function deleted(Siswa $siswa): void
    {
        $sekolahId = tenant('id');

        if ($sekolahId === null) {
            return;
        }

        SyncSiswaToCentralDirectory::dispatch($sekolahId, $siswa->id, null);
    }
}

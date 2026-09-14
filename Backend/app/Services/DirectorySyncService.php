<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Central\GuruDirectory;
use App\Models\Central\SiswaDirectory;
use App\Models\Guru;
use App\Models\Sekolah;
use App\Models\Siswa;

/**
 * Logika inti sinkronisasi data guru & siswa satu sekolah ke direktori
 * nasional (central). Perubahan sehari-hari sudah otomatis tersinkron lewat
 * GuruObserver/SiswaObserver (per-baris, lewat queue) — service ini untuk
 * sinkronisasi PENUH sekolah sekaligus, dipicu manual: oleh Admin Sekolah
 * lewat menu Sinkronisasi Data, oleh Super Admin lewat menu Log
 * Sinkronisasi, atau lewat perintah artisan `directory:sync-guru` /
 * `directory:sync-siswa` untuk backfill data lama.
 *
 * Method di sini mengasumsikan SUDAH berjalan di dalam konteks tenant yang
 * dituju — baik karena request asli datang dari domain sekolah, maupun
 * karena pemanggil (kode sisi central) membungkusnya lewat $sekolah->run().
 */
class DirectorySyncService
{
    public function syncGuru(Sekolah $sekolah): int
    {
        $count = 0;

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

        return $count;
    }

    public function syncSiswa(Sekolah $sekolah): int
    {
        $count = 0;

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

        return $count;
    }

    /**
     * Sinkronkan guru & siswa sekaligus — dipakai oleh tombol "Tarik Data
     * Sekarang" (Admin Sekolah) dan aksi paksa-sinkron Super Admin, supaya
     * satu klik menyegarkan seluruh direktori nasional sekolah tersebut.
     */
    public function syncAll(Sekolah $sekolah): array
    {
        return [
            'guru' => $this->syncGuru($sekolah),
            'siswa' => $this->syncSiswa($sekolah),
        ];
    }
}

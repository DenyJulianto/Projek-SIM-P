<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Central\SiswaDirectory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Menyalin (upsert) satu baris siswa dari database sekolah ke direktori
 * nasional central. Menerima snapshot data mentah, bukan model Siswa,
 * karena saat job ini dieksekusi oleh queue worker konteks tenant yang
 * aktif ketika job di-dispatch sudah tidak berlaku lagi.
 */
class SyncSiswaToCentralDirectory implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>|null  $data  Null berarti baris siswa dihapus dari sumbernya.
     */
    public function __construct(
        public readonly string $sekolahId,
        public readonly int $siswaId,
        public readonly ?array $data,
    ) {}

    public function handle(): void
    {
        if ($this->data === null) {
            SiswaDirectory::where('sekolah_id', $this->sekolahId)
                ->where('siswa_id', $this->siswaId)
                ->delete();

            return;
        }

        SiswaDirectory::updateOrCreate(
            ['sekolah_id' => $this->sekolahId, 'siswa_id' => $this->siswaId],
            [
                'nis' => $this->data['nis'],
                'nama' => $this->data['nama'],
                'jenis_kelamin' => $this->data['jenis_kelamin'] ?? null,
                'kelas' => $this->data['kelas'] ?? null,
                'tahun_masuk' => $this->data['tahun_masuk'] ?? null,
                'status' => $this->data['status'] ?? 'aktif',
                'synced_at' => now(),
            ]
        );
    }
}

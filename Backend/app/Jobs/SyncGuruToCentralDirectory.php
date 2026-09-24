<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Central\GuruDirectory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Menyalin (upsert) satu baris guru dari database sekolah ke direktori
 * nasional central. Menerima snapshot data mentah, bukan model Guru,
 * karena saat job ini dieksekusi oleh queue worker konteks tenant yang
 * aktif ketika job di-dispatch sudah tidak berlaku lagi.
 */
class SyncGuruToCentralDirectory implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>|null  $data  Null berarti baris guru dihapus dari sumbernya.
     */
    public function __construct(
        public readonly string $sekolahId,
        public readonly int $guruId,
        public readonly ?array $data,
    ) {}

    public function handle(): void
    {
        if ($this->data === null) {
            GuruDirectory::where('sekolah_id', $this->sekolahId)
                ->where('guru_id', $this->guruId)
                ->delete();

            return;
        }

        GuruDirectory::updateOrCreate(
            ['sekolah_id' => $this->sekolahId, 'guru_id' => $this->guruId],
            [
                'nip' => $this->data['nip'] ?? null,
                'nuptk' => $this->data['nuptk'] ?? null,
                'nama' => $this->data['nama'],
                'gelar' => $this->data['gelar'] ?? null,
                'jabatan' => $this->data['jabatan'] ?? null,
                'mata_pelajaran' => $this->data['mata_pelajaran'] ?? null,
                'status_kepegawaian' => $this->data['status_kepegawaian'] ?? null,
                'pendidikan_terakhir' => $this->data['pendidikan_terakhir'] ?? null,
                'jenis_kelamin' => $this->data['jenis_kelamin'] ?? null,
                'no_telepon' => $this->data['no_telepon'] ?? null,
                'status' => $this->data['status'] ?? 'aktif',
                'synced_at' => now(),
            ]
        );
    }
}

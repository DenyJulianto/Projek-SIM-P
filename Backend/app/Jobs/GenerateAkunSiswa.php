<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\AkunSiswaBatch;
use App\Models\Siswa;
use App\Support\AkunSiswa;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Membuat akun siswa (username = NISN) dan akun orang tua/wali
 * (username = ortu.NISN) untuk siswa aktif yang belum punya akun. Semua akun
 * baru wajib ganti password saat login pertama. Daftar kredensial disimpan
 * terenkripsi dan hanya bisa diunduh lewat endpoint admin.
 */
class GenerateAkunSiswa implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 900;

    public function __construct(public int $batchId)
    {
    }

    public function handle(): void
    {
        $batch = AkunSiswaBatch::findOrFail($this->batchId);

        $query = Siswa::where('status', 'aktif')
            ->when($batch->kelas_id, fn ($q) => $q->where('kelas_id', $batch->kelas_id))
            ->with('kelas:id,nama_kelas')
            ->withExists('walis')
            ->orderBy('kelas_id')
            ->orderBy('nama');

        $batch->update(['status' => 'proses', 'total' => (clone $query)->count()]);

        $baris = [];
        $hitung = ['akun_siswa' => 0, 'akun_ortu' => 0, 'dilewati' => 0];

        $query->chunkById(100, function ($daftar) use ($batch, &$baris, &$hitung) {
            foreach ($daftar as $siswa) {
                $baris = array_merge($baris, $this->prosesSiswa($siswa, $batch->sertakan_ortu, $hitung));
            }
            $batch->update($hitung);
        });

        $path = "kredensial/akun-siswa-{$batch->id}.csv.enc";
        Storage::disk('local')->put($path, Crypt::encryptString($this->keCsv($baris)));

        $batch->update($hitung + ['status' => 'selesai', 'file_kredensial' => $path]);
    }

    /**
     * @param  array<string, int>  $hitung
     * @return array<int, array<int, string>>
     */
    private function prosesSiswa(Siswa $siswa, bool $sertakanOrtu, array &$hitung): array
    {
        $kelas = $siswa->kelas?->nama_kelas ?? '-';
        $nisn = trim((string) $siswa->nisn);
        $perluAkunSiswa = ! $siswa->user_id;
        $perluAkunOrtu = $sertakanOrtu && ! $siswa->walis_exists;

        if (! $perluAkunSiswa && ! $perluAkunOrtu) {
            return [];
        }

        if ($nisn === '') {
            $hitung['dilewati']++;

            return [[$kelas, $siswa->nama, '', '', '', '', 'Dilewati: NISN kosong']];
        }

        try {
            return DB::transaction(function () use ($siswa, $kelas, $nisn, $perluAkunSiswa, $perluAkunOrtu, &$hitung) {
                $hasil = [];

                if ($perluAkunSiswa) {
                    $password = AkunSiswa::passwordAcak();
                    $user = AkunSiswa::buatAkun($siswa->nama, $nisn, "{$nisn}@siswa.invalid", $password, 'Siswa');
                    $siswa->user_id = $user->id;
                    $siswa->save();
                    $hitung['akun_siswa']++;
                    $hasil[] = [$kelas, $siswa->nama, $nisn, 'Siswa', $nisn, $password, ''];
                }

                if ($perluAkunOrtu) {
                    $password = AkunSiswa::passwordAcak();
                    $nama = trim((string) $siswa->nama_wali) ?: "Orang Tua/Wali {$siswa->nama}";
                    $username = "ortu.{$nisn}";
                    $user = AkunSiswa::buatAkun($nama, $username, "{$username}@ortu.invalid", $password, 'Orang Tua');
                    $siswa->walis()->attach($user->id, ['hubungan' => 'wali']);
                    $hitung['akun_ortu']++;
                    $hasil[] = [$kelas, $siswa->nama, $nisn, 'Orang Tua', $username, $password, ''];
                }

                return $hasil;
            });
        } catch (\Throwable $e) {
            Log::warning('Gagal membuat akun siswa/orang tua.', ['siswa_id' => $siswa->id, 'error' => $e->getMessage()]);
            $hitung['dilewati']++;

            return [[$kelas, $siswa->nama, $nisn, '', '', '', 'Dilewati: '.$this->alasan($e)]];
        }
    }

    private function alasan(\Throwable $e): string
    {
        return $e instanceof \RuntimeException ? $e->getMessage() : 'kesalahan sistem';
    }

    /** @param  array<int, array<int, string>>  $baris */
    private function keCsv(array $baris): string
    {
        $f = fopen('php://temp', 'r+');
        fwrite($f, "\xEF\xBB\xBF");
        fputcsv($f, ['Kelas', 'Nama Siswa', 'NISN', 'Jenis Akun', 'Username', 'Password Sementara', 'Keterangan']);
        foreach ($baris as $b) {
            fputcsv($f, $b);
        }
        rewind($f);
        $csv = stream_get_contents($f);
        fclose($f);

        return $csv;
    }

    public function failed(\Throwable $e): void
    {
        AkunSiswaBatch::whereKey($this->batchId)->update([
            'status' => 'gagal',
            'pesan' => 'Proses gagal: '.$e->getMessage(),
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Ekskul;
use App\Models\EkskulAnggota;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

trait EkskulHelpers
{
    protected const LOG_EKSKUL = 'ekskul';

    protected const KATEGORI = [
        'olahraga' => 'Olahraga', 'seni' => 'Seni', 'akademik' => 'Akademik', 'keagamaan' => 'Keagamaan', 'bahasa' => 'Bahasa',
        'teknologi' => 'Teknologi', 'kepemimpinan' => 'Kepemimpinan', 'keterampilan' => 'Keterampilan', 'lainnya' => 'Lainnya',
    ];

    protected const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    protected const JENIS_KEGIATAN = ['rutin' => 'Latihan/Pertemuan Rutin', 'khusus' => 'Kegiatan Khusus', 'lomba' => 'Lomba/Kompetisi', 'pertunjukan' => 'Pertunjukan/Pameran', 'pertemuan' => 'Rapat/Pertemuan', 'lainnya' => 'Lainnya'];

    protected const STATUS_KEGIATAN = ['terjadwal' => 'Terjadwal', 'terlaksana' => 'Terlaksana', 'dibatalkan' => 'Dibatalkan'];

    protected const STATUS_HADIR = ['hadir' => 'Hadir', 'izin' => 'Izin', 'sakit' => 'Sakit', 'alpha' => 'Alpa'];

    /** Aspek bawaan; sekolah bebas menambah aspek sendiri per ekskul. */
    protected const ASPEK_BAWAAN = ['Kehadiran', 'Kedisiplinan', 'Keaktifan', 'Keterampilan', 'Kerja sama', 'Tanggung jawab', 'Perkembangan kompetensi'];

    protected function logEkskul(Request $request, Model $subject, string $event, string $deskripsi, array $properties = []): void
    {
        activity(self::LOG_EKSKUL)->performedOn($subject)->causedBy($request->user())->event($event)->withProperties($properties + ['ip' => $request->ip()])->log($deskripsi);
    }

    /**
     * Predikat otomatis dari nilai 0–100.
     * Skala: A ≥ 90 (Sangat Baik), B ≥ 80 (Baik), C ≥ 70 (Cukup), D < 70 (Perlu Bimbingan).
     *
     * @return array{0: string, 1: string}|null
     */
    protected function predikat(?float $nilai): ?array
    {
        return match (true) {
            $nilai === null => null,
            $nilai >= 90 => ['A', 'Sangat Baik'],
            $nilai >= 80 => ['B', 'Baik'],
            $nilai >= 70 => ['C', 'Cukup'],
            default => ['D', 'Perlu Bimbingan'],
        };
    }

    protected function namaHari(string $tanggal): string
    {
        return self::HARI[(Carbon::parse($tanggal)->dayOfWeekIso) - 1];
    }

    /** Jumlah anggota aktif sebuah ekskul (dipakai validasi kuota). */
    protected function terisi(Ekskul $e): int
    {
        return EkskulAnggota::where('ekskul_id', $e->id)->where('status', 'aktif')->count();
    }

    protected function hm(?string $t): ?string
    {
        return $t ? substr($t, 0, 5) : null;
    }
}

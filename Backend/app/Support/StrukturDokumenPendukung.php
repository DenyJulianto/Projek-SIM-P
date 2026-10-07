<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Struktur isian dokumen pendukung modul ajar (Silabus, Pemetaan ATP, Jurnal
 * Harian). Semua isian berupa teks polos (boleh beberapa baris); dokumen
 * dicetak sebagai tabel oleh DokumenPendukungCetak.
 */
class StrukturDokumenPendukung
{
    public const JENIS = [
        'silabus' => 'Silabus',
        'pemetaan_atp' => 'Pemetaan Alur Tujuan Pembelajaran',
        'jurnal' => 'Jurnal Harian Guru',
    ];

    /** Kolom teks per baris tabel beserta panjang maksimalnya. */
    private const KOLOM_TEKS = [
        'silabus' => ['elemen' => 255, 'cp' => 3000, 'tp' => 3000, 'materi' => 3000, 'kegiatan' => 5000, 'asesmen' => 3000, 'alokasi' => 255, 'media' => 3000],
        'pemetaan_atp' => ['elemen' => 255, 'tp' => 3000, 'atp' => 3000],
        'jurnal' => ['jam_ke' => 50, 'atp' => 3000, 'materi' => 3000, 'asesmen' => 3000, 'catatan' => 3000],
    ];

    public const MAKS_BARIS = 200;

    public const MAKS_PERTEMUAN = 60;

    /** Bersihkan isian dari form: hanya kunci yang dikenal, teks dipangkas, angka dibatasi. */
    public static function bersihkan(string $jenis, array $data): array
    {
        $hasil = [];
        if ($jenis === 'silabus') {
            $hasil['cp_umum'] = self::teks($data['cp_umum'] ?? '', 5000);
        }
        if ($jenis === 'pemetaan_atp') {
            $hasil['jumlah_pertemuan'] = self::angka($data['jumlah_pertemuan'] ?? null, 1, self::MAKS_PERTEMUAN) ?? 1;
        }
        $hasil['catatan'] = self::teks($data['catatan'] ?? '', 3000);

        $baris = [];
        foreach (array_slice(array_values((array) ($data['baris'] ?? [])), 0, self::MAKS_BARIS) as $b) {
            if (! is_array($b)) {
                continue;
            }
            $r = [];
            foreach (self::KOLOM_TEKS[$jenis] as $k => $maks) {
                $r[$k] = self::teks($b[$k] ?? '', $maks);
            }
            if ($jenis === 'silabus') {
                $r['profil'] = array_values(array_intersect(StrukturPerangkatAjar::PROFIL_PELAJAR, (array) ($b['profil'] ?? [])));
            }
            if ($jenis === 'pemetaan_atp') {
                $r['alokasi_jp'] = self::angka($b['alokasi_jp'] ?? null, 0, 200);
                $p = array_map('intval', array_filter((array) ($b['pertemuan'] ?? []), 'is_numeric'));
                $p = array_values(array_unique(array_filter($p, fn ($n) => $n >= 1 && $n <= $hasil['jumlah_pertemuan'])));
                sort($p);
                $r['pertemuan'] = $p;
            }
            if ($jenis === 'jurnal') {
                $tanggal = (string) ($b['tanggal'] ?? '');
                $r['tanggal'] = preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal) && strtotime($tanggal) ? $tanggal : null;
                $r['pertemuan_ke'] = self::angka($b['pertemuan_ke'] ?? null, 1, 200);
                $r['hadir'] = self::angka($b['hadir'] ?? null, 0, 999);
                $r['tidak_hadir'] = self::angka($b['tidak_hadir'] ?? null, 0, 999);
                $r['terlaksana'] = in_array($b['terlaksana'] ?? null, ['ya', 'sebagian', 'tidak'], true) ? $b['terlaksana'] : null;
            }
            if (self::kosong($r)) {
                continue;
            }
            $baris[] = $r;
        }
        if ($jenis === 'jurnal') {
            // Jurnal selalu urut tanggal pelaksanaan; baris tanpa tanggal di akhir.
            usort($baris, fn ($a, $b) => [$a['tanggal'] === null, $a['tanggal']] <=> [$b['tanggal'] === null, $b['tanggal']]);
        }
        $hasil['baris'] = $baris;

        return $hasil;
    }

    /** Label kolom tabel untuk cetak (PDF/Word) beserta lebar relatifnya. */
    public static function kolomCetak(string $jenis, array $data): array
    {
        return match ($jenis) {
            'silabus' => [
                ['No', 4], ['Elemen & Capaian Pembelajaran', 16], ['Tujuan Pembelajaran', 14], ['Profil Pelajar Pancasila', 10],
                ['Materi Pokok', 11], ['Kegiatan Pembelajaran', 14], ['Asesmen', 11], ['Alokasi Waktu', 9], ['Media / Sumber Belajar', 11],
            ],
            'pemetaan_atp' => array_merge(
                [['No', 4], ['Elemen', 11], ['Tujuan Pembelajaran', 22], ['Alur Tujuan Pembelajaran', 30], ['JP', 5]],
                array_map(fn ($n) => ["P{$n}", 0], range(1, (int) ($data['jumlah_pertemuan'] ?? 1))),
            ),
            'jurnal' => [
                ['No', 4], ['Hari, Tanggal', 12], ['Pert. / Jam ke', 8], ['ATP / Tujuan Pembelajaran', 20], ['Materi', 15],
                ['Asesmen', 13], ['Kehadiran', 9], ['Keterlaksanaan', 11], ['Catatan / Kendala', 12],
            ],
        };
    }

    /** Isi sel tiap baris untuk cetak (teks polos, tanda ✓ untuk matriks). */
    public static function barisCetak(string $jenis, array $data): array
    {
        $hasil = [];
        foreach ($data['baris'] ?? [] as $i => $b) {
            $no = (string) ($i + 1);
            $hasil[] = match ($jenis) {
                'silabus' => [
                    $no,
                    trim(($b['elemen'] ? $b['elemen']."\n" : '').$b['cp']),
                    $b['tp'], implode("\n", array_map(fn ($p) => "• {$p}", $b['profil'])), $b['materi'], $b['kegiatan'], $b['asesmen'], $b['alokasi'], $b['media'],
                ],
                'pemetaan_atp' => array_merge(
                    [$no, $b['elemen'], $b['tp'], $b['atp'], $b['alokasi_jp'] === null ? '' : (string) $b['alokasi_jp']],
                    array_map(fn ($n) => in_array($n, $b['pertemuan'], true) ? '✓' : '', range(1, (int) ($data['jumlah_pertemuan'] ?? 1))),
                ),
                'jurnal' => [
                    $no,
                    $b['tanggal'] ? Carbon::parse($b['tanggal'])->locale('id')->translatedFormat('l, j F Y') : '',
                    trim(($b['pertemuan_ke'] ? "Pert. {$b['pertemuan_ke']}" : '').($b['jam_ke'] !== '' ? "\nJam ke-{$b['jam_ke']}" : '')),
                    $b['atp'], $b['materi'], $b['asesmen'],
                    $b['hadir'] === null && $b['tidak_hadir'] === null ? '' : 'Hadir: '.($b['hadir'] ?? '-')."\nTidak hadir: ".($b['tidak_hadir'] ?? '-'),
                    ['ya' => 'Terlaksana', 'sebagian' => 'Sebagian', 'tidak' => 'Tidak terlaksana'][$b['terlaksana']] ?? '',
                    $b['catatan'],
                ],
            };
        }

        return $hasil;
    }

    /** Baris tanpa isian sama sekali (dibuang saat disimpan). */
    public static function kosong(array $baris): bool
    {
        foreach ($baris as $v) {
            if (is_array($v) ? $v !== [] : ($v !== null && $v !== '')) {
                return false;
            }
        }

        return true;
    }

    private static function teks($v, int $maks): string
    {
        $t = is_scalar($v) ? (string) $v : '';
        $t = str_replace(["\r\n", "\r"], "\n", strip_tags($t));

        return mb_substr(trim(preg_replace("/\n{3,}/", "\n\n", $t)), 0, $maks);
    }

    private static function angka($v, int $min, int $maks): ?int
    {
        if ($v === null || $v === '' || ! is_numeric($v)) {
            return null;
        }

        return max($min, min($maks, (int) $v));
    }
}

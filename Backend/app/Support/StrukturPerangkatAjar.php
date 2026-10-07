<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Struktur isian perangkat ajar per kurikulum. Harus sejalan dengan
 * Frontend/src/lib/perangkatAjar.js (form, pratinjau) — dipakai di sini
 * untuk membersihkan isian, memeriksa kelengkapan saat diajukan, dan
 * menyusun dokumen PDF/Word.
 *
 * Kurikulum Merdeka memakai kerangka Modul Ajar Kurikulum Merdeka Belajar
 * (RPP+): sampul, A. Informasi Umum, B. Komponen Inti (1–9), C. Lampiran,
 * dan penutup bertanda tangan. K13 memakai RPP 1 lembar.
 */
class StrukturPerangkatAjar
{
    /** 6 dimensi Profil Pelajar Pancasila. */
    public const PROFIL_PELAJAR = [
        'Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia',
        'Berkebinekaan global',
        'Bergotong royong',
        'Mandiri',
        'Bernalar kritis',
        'Kreatif',
    ];

    public const TARGET_PESERTA = [
        'Peserta didik reguler / tipikal',
        'Peserta didik berkebutuhan khusus',
        'Peserta didik pencapaian tinggi (pengayaan)',
    ];

    public const MODA = ['Tatap muka', 'Daring', 'Blended (tatap muka dan daring)'];

    public const METODE = ['Ceramah', 'Tanya jawab', 'Diskusi', 'Demonstrasi', 'Penugasan'];

    /** Tahap kegiatan tiap pertemuan (bawaan durasi dalam menit, null = sisa waktu). */
    public const TAHAP = [
        'merdeka' => [
            'pendahuluan' => 'Kegiatan Pendahuluan',
            'inti' => 'Kegiatan Inti',
            'penutup' => 'Kegiatan Penutup',
        ],
        'k13' => [
            'pendahuluan' => 'Pendahuluan',
            'inti' => 'Kegiatan Inti',
            'penutup' => 'Penutup',
        ],
    ];

    /** Field teks berformat (HTML dari editor) yang harus dibersihkan. */
    public const TEKS_FORMAT = [
        // Kurikulum Merdeka (RPP+)
        'karakteristik_peserta', 'sarana_prasarana', 'cp_umum', 'tujuan_pembelajaran', 'pemahaman_bermakna', 'materi_inti',
        'asesmen_diagnostik', 'asesmen_formatif', 'asesmen_sumatif', 'kegiatan_alternatif',
        'refleksi_guru', 'refleksi_siswa', 'pemetaan_kemampuan', 'interaksi_ortu',
        'bahan_bacaan', 'lkpd', 'rubrik_sikap', 'rubrik_pengetahuan', 'remedial', 'pengayaan', 'daftar_pustaka',
        // K13
        'kompetensi_dasar', 'penilaian_sikap', 'penilaian_pengetahuan', 'penilaian_keterampilan',
    ];

    /** Field teks satu baris. */
    public const TEKS_BIASA = [
        'materi_pokok', 'kkm', 'model_pembelajaran', 'semester', 'nama_guru', 'nip_guru', 'institusi', 'nama_sekolah',
        'kota', 'jenjang', 'tahun_penyusunan', 'tahun_ajaran', 'fase', 'bab_tema', 'moda', 'metode_lain',
        'jumlah_peserta', 'rumus_nilai',
    ];

    /** Bagian RPP K13 (setelah tabel identitas). Tiap butir: [kunci, label]; _pertemuan = tabel kegiatan. */
    public const BAGIAN_K13 = [
        ['Tujuan Pembelajaran', [
            ['kompetensi_dasar', 'Kompetensi Dasar (KD)'],
            ['tujuan_pembelajaran', 'Tujuan Pembelajaran'],
            ['kkm', 'Kriteria Ketuntasan Minimal (KKM)'],
        ]],
        ['Langkah-Langkah Pembelajaran', [
            ['model_pembelajaran', 'Model Pembelajaran'],
            ['_pertemuan', null],
        ]],
        ['Penilaian Pembelajaran', [
            ['penilaian_sikap', 'Penilaian Sikap'],
            ['penilaian_pengetahuan', 'Penilaian Pengetahuan'],
            ['penilaian_keterampilan', 'Penilaian Keterampilan'],
        ]],
    ];

    /** Field teks berformat wajib saat diajukan (selain identitas, alokasi, dan pertemuan). */
    public const WAJIB = [
        'merdeka' => [
            'materi_inti' => 'Materi inti',
            'asesmen_formatif' => 'Asesmen formatif',
            'asesmen_sumatif' => 'Asesmen sumatif',
        ],
        'k13' => [
            'materi_pokok' => 'Materi pokok',
            'kompetensi_dasar' => 'Kompetensi dasar',
            'tujuan_pembelajaran' => 'Tujuan pembelajaran',
            'kkm' => 'KKM',
            'model_pembelajaran' => 'Model pembelajaran',
            'penilaian_pengetahuan' => 'Penilaian pengetahuan',
        ],
    ];

    public const RUMUS_NILAI_BAWAAN = 'Nilai = (skor perolehan ÷ skor maksimal) × 100';

    /** Fase Kurikulum Merdeka dari tingkat kelas (angka atau romawi). */
    public static function faseDariTingkat(?string $tingkat): ?string
    {
        $romawi = ['I' => 1, 'II' => 2, 'III' => 3, 'IV' => 4, 'V' => 5, 'VI' => 6, 'VII' => 7, 'VIII' => 8, 'IX' => 9, 'X' => 10, 'XI' => 11, 'XII' => 12];
        $t = strtoupper(trim((string) $tingkat));
        $n = ctype_digit($t) ? (int) $t : ($romawi[$t] ?? null);

        return match (true) {
            $n === null => null,
            $n <= 2 => 'A',
            $n <= 4 => 'B',
            $n <= 6 => 'C',
            $n <= 9 => 'D',
            $n === 10 => 'E',
            default => 'F',
        };
    }

    /** Fase ditampilkan beserta tingkat kelasnya, mis. "Kelas XI–XII (Fase F)". */
    public static function labelFase(string $fase): string
    {
        $kelas = ['A' => 'Kelas I–II', 'B' => 'Kelas III–IV', 'C' => 'Kelas V–VI', 'D' => 'Kelas VII–IX', 'E' => 'Kelas X', 'F' => 'Kelas XI–XII'][$fase] ?? null;

        return $kelas ? "{$kelas} (Fase {$fase})" : "Fase {$fase}";
    }

    /** Menit per JP bawaan menurut jenjang sekolah. */
    public static function menitPerJp(?string $jenjang): int
    {
        return match (strtoupper((string) $jenjang)) {
            'SD', 'MI' => 35,
            'SMP', 'MTS' => 40,
            default => 45,
        };
    }

    /** Bersihkan isian dari form sesuai struktur kurikulum. */
    public static function bersihkan(array $data, string $kurikulum): array
    {
        $hasil = [];
        foreach (self::TEKS_FORMAT as $k) {
            if (array_key_exists($k, $data) && is_string($data[$k])) {
                $hasil[$k] = HtmlAman::bersihkan($data[$k]);
            }
        }
        foreach (self::TEKS_BIASA as $k) {
            if (array_key_exists($k, $data) && (is_string($data[$k]) || is_numeric($data[$k]))) {
                $hasil[$k] = mb_substr(trim((string) $data[$k]), 0, 255);
            }
        }
        if (isset($data['semester']) && ! in_array($hasil['semester'] ?? '', ['Ganjil', 'Genap'], true)) {
            $hasil['semester'] = '';
        }
        if (isset($hasil['fase']) && ! in_array($hasil['fase'], ['A', 'B', 'C', 'D', 'E', 'F'], true)) {
            $hasil['fase'] = '';
        }

        $alokasi = is_array($data['alokasi'] ?? null) ? $data['alokasi'] : [];
        $hasil['alokasi'] = [
            'pertemuan' => self::angka($alokasi['pertemuan'] ?? null, 1, 50),
            'jp' => self::angka($alokasi['jp'] ?? null, 1, 20),
            'menit_per_jp' => self::angka($alokasi['menit_per_jp'] ?? null, 10, 120),
        ];

        $tahap = array_keys(self::TAHAP[$kurikulum]);
        $hasil['pertemuan'] = [];
        foreach (array_slice(is_array($data['pertemuan'] ?? null) ? $data['pertemuan'] : [], 0, 50) as $p) {
            if (! is_array($p)) {
                continue;
            }
            $baris = ['topik' => mb_substr(trim((string) ($p['topik'] ?? '')), 0, 255), 'tahap' => []];
            foreach ($tahap as $t) {
                $isi = $p['tahap'][$t] ?? [];
                $baris['tahap'][$t] = [
                    'isi' => HtmlAman::bersihkan(is_string($isi['isi'] ?? null) ? $isi['isi'] : ''),
                    'durasi' => self::angka($isi['durasi'] ?? null, 1, 600),
                ];
            }
            $hasil['pertemuan'][] = $baris;
        }

        if ($kurikulum === 'merdeka') {
            $hasil['profil_pelajar'] = array_values(array_intersect(self::PROFIL_PELAJAR, (array) ($data['profil_pelajar'] ?? [])));
            $hasil['target_peserta'] = array_values(array_intersect(self::TARGET_PESERTA, (array) ($data['target_peserta'] ?? [])));
            $hasil['metode'] = array_values(array_intersect(self::METODE, (array) ($data['metode'] ?? [])));
            if (isset($hasil['moda']) && ! in_array($hasil['moda'], self::MODA, true)) {
                $hasil['moda'] = '';
            }

            // Alur Tujuan Pembelajaran: "Melalui kegiatan …, peserta didik dapat …" per minggu/pertemuan.
            $hasil['atp'] = [];
            foreach (array_slice(is_array($data['atp'] ?? null) ? $data['atp'] : [], 0, 60) as $a) {
                if (! is_array($a)) {
                    continue;
                }
                $hasil['atp'][] = [
                    'waktu' => mb_substr(trim((string) ($a['waktu'] ?? '')), 0, 60),
                    'kegiatan' => mb_substr(trim((string) ($a['kegiatan'] ?? '')), 0, 500),
                    'kemampuan' => mb_substr(trim((string) ($a['kemampuan'] ?? '')), 0, 500),
                ];
            }
        }

        return $hasil;
    }

    /** Baris ATP yang lengkap (kegiatan & kemampuan terisi). */
    public static function atpLengkap(array $d): array
    {
        return array_values(array_filter(
            (array) ($d['atp'] ?? []),
            fn ($a) => filled($a['kegiatan'] ?? null) && filled($a['kemampuan'] ?? null),
        ));
    }

    /** Daftar kekurangan sebelum perangkat ajar boleh diajukan. */
    public static function kekurangan(array $modul): array
    {
        $d = $modul['data'] ?? [];
        $kurikulum = $modul['kurikulum'];
        $kurang = [];

        if (! filled($modul['judul'] ?? null)) {
            $kurang[] = 'Judul';
        }
        if (! ($modul['mata_pelajaran_id'] ?? null)) {
            $kurang[] = 'Mata pelajaran';
        }
        if (! ($modul['kelas_id'] ?? null)) {
            $kurang[] = 'Kelas';
        }
        if (! filled($d['semester'] ?? null)) {
            $kurang[] = 'Semester';
        }
        $a = $d['alokasi'] ?? [];
        if (! ($a['pertemuan'] ?? null) || ! ($a['jp'] ?? null) || ! ($a['menit_per_jp'] ?? null)) {
            $kurang[] = 'Alokasi waktu';
        }
        if ($kurikulum === 'merdeka') {
            if (! filled($d['tahun_ajaran'] ?? null)) {
                $kurang[] = 'Tahun ajaran';
            }
            if (! filled($d['moda'] ?? null)) {
                $kurang[] = 'Moda pembelajaran';
            }
            if (empty($d['metode']) && ! filled($d['metode_lain'] ?? null)) {
                $kurang[] = 'Metode pembelajaran';
            }
            if (! filled($d['model_pembelajaran'] ?? null)) {
                $kurang[] = 'Model pembelajaran';
            }
            if (empty($d['profil_pelajar'])) {
                $kurang[] = 'Profil Pelajar Pancasila';
            }
            if (empty($d['cp'])) {
                $kurang[] = 'Capaian pembelajaran';
            }
            if (empty($d['tp_master']) && HtmlAman::teksPolos($d['tujuan_pembelajaran'] ?? '') === '') {
                $kurang[] = 'Tujuan pembelajaran';
            }
            if (! self::atpLengkap($d)) {
                $kurang[] = 'Alur tujuan pembelajaran (minimal 1 baris)';
            }
        }
        foreach (self::WAJIB[$kurikulum] as $k => $label) {
            if (HtmlAman::teksPolos((string) ($d[$k] ?? '')) === '') {
                $kurang[] = $label;
            }
        }
        $pertemuan = $d['pertemuan'] ?? [];
        if (! $pertemuan) {
            $kurang[] = 'Kegiatan pembelajaran (minimal 1 pertemuan)';
        }
        foreach ($pertemuan as $i => $p) {
            foreach (self::TAHAP[$kurikulum] as $t => $label) {
                if (HtmlAman::teksPolos($p['tahap'][$t]['isi'] ?? '') === '') {
                    $kurang[] = 'Pertemuan '.($i + 1).': '.$label;
                }
            }
        }

        return $kurang;
    }

    /** Seragamkan data lama supaya tetap bisa dibuka di form dan dicetak. */
    public static function normalisasi(array $d, string $kurikulum): array
    {
        if (empty($d['pertemuan']) && (filled($d['pendahuluan'] ?? null) || filled($d['kegiatan_inti'] ?? null) || filled($d['penutup'] ?? null))) {
            $tahap = [];
            foreach (array_keys(self::TAHAP[$kurikulum]) as $t) {
                $tahap[$t] = ['isi' => '', 'durasi' => null];
            }
            $tahap['pendahuluan']['isi'] = (string) ($d['pendahuluan'] ?? '');
            $tahap['inti']['isi'] = (string) ($d['kegiatan_inti'] ?? '');
            $tahap['penutup']['isi'] = (string) ($d['penutup'] ?? '');
            $d['pertemuan'] = [['topik' => '', 'tahap' => $tahap]];
        }

        return $d;
    }

    /** Kalimat ATP: "Melalui kegiatan …, peserta didik dapat …." (awalan ganda dibuang). */
    public static function kalimatAtp(string $kegiatan, string $kemampuan): string
    {
        $kegiatan = preg_replace('/^melalui kegiatan\s+/i', '', rtrim(trim($kegiatan), ' .,'));
        $kemampuan = preg_replace('/^peserta didik (dapat|mampu)\s+/i', '', rtrim(trim($kemampuan), ' .'));

        return 'Melalui kegiatan '.lcfirst($kegiatan).', peserta didik dapat '.lcfirst($kemampuan).'.';
    }

    /** Teks alokasi waktu, mis. "2 pertemuan × 2 JP × 45 menit (180 menit)". */
    public static function teksAlokasi(array $d): ?string
    {
        $a = $d['alokasi'] ?? [];
        if (($a['pertemuan'] ?? null) && ($a['jp'] ?? null) && ($a['menit_per_jp'] ?? null)) {
            $total = $a['pertemuan'] * $a['jp'] * $a['menit_per_jp'];

            return "{$a['pertemuan']} pertemuan × {$a['jp']} JP × {$a['menit_per_jp']} menit ({$total} menit)";
        }

        return filled($d['alokasi_waktu'] ?? null) ? (string) $d['alokasi_waktu'] : null;
    }

    private static function angka($v, int $min, int $maks): ?int
    {
        if ($v === null || $v === '' || ! is_numeric($v)) {
            return null;
        }

        return max($min, min($maks, (int) $v));
    }
}

<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Struktur isian perangkat ajar per kurikulum. Harus sejalan dengan
 * Frontend/src/lib/perangkatAjar.js (form, pratinjau) — dipakai di sini
 * untuk membersihkan isian, memeriksa kelengkapan saat diajukan, dan
 * menyusun dokumen PDF/Word.
 */
class StrukturPerangkatAjar
{
    /** 8 Dimensi Profil Lulusan (kerangka Pembelajaran Mendalam). */
    public const DIMENSI_PROFIL = [
        'Keimanan dan Ketakwaan terhadap Tuhan YME',
        'Kewargaan',
        'Penalaran Kritis',
        'Kreativitas',
        'Kolaborasi',
        'Kemandirian',
        'Kesehatan',
        'Komunikasi',
    ];

    public const TARGET_PESERTA = [
        'Peserta didik reguler / tipikal',
        'Peserta didik dengan kesulitan belajar',
        'Peserta didik dengan pencapaian tinggi',
    ];

    /** Tahap kegiatan tiap pertemuan. */
    public const TAHAP = [
        'merdeka' => [
            'pendahuluan' => 'Pendahuluan',
            'memahami' => 'Memahami',
            'mengaplikasi' => 'Mengaplikasi',
            'merefleksi' => 'Merefleksi',
            'penutup' => 'Penutup',
        ],
        'k13' => [
            'pendahuluan' => 'Pendahuluan',
            'inti' => 'Kegiatan Inti',
            'penutup' => 'Penutup',
        ],
    ];

    /** Field teks berformat (HTML dari editor) yang harus dibersihkan. */
    public const TEKS_FORMAT = [
        'tujuan_pembelajaran', 'kompetensi_awal', 'sarana_prasarana', 'pemahaman_bermakna', 'pertanyaan_pemantik',
        'praktik_pedagogis', 'kemitraan_pembelajaran', 'lingkungan_pembelajaran', 'pemanfaatan_digital', 'lintas_disiplin',
        'strategi_diferensiasi', 'asesmen_diagnostik', 'asesmen_formatif', 'asesmen_sumatif', 'kktp',
        'pengayaan', 'remedial', 'refleksi_guru', 'refleksi_siswa', 'glosarium', 'daftar_pustaka',
        'kompetensi_dasar', 'penilaian_sikap', 'penilaian_pengetahuan', 'penilaian_keterampilan',
    ];

    /** Field teks satu baris. */
    public const TEKS_BIASA = ['materi_pokok', 'kkm', 'model_pembelajaran', 'semester', 'nama_guru', 'institusi', 'nama_sekolah', 'jenjang', 'tahun_penyusunan', 'fase'];

    /**
     * Bagian dokumen (setelah tabel identitas). Tiap butir: [kunci, label].
     * Kunci khusus: _cp, _tp, _dimensi, _target, _pertemuan.
     */
    public const BAGIAN = [
        'merdeka' => [
            ['Capaian Pembelajaran', [['_cp', null]]],
            ['Tujuan Pembelajaran', [['_tp', null]]],
            ['Dimensi Profil Lulusan', [['_dimensi', null]]],
            ['Kompetensi Awal', [['kompetensi_awal', null]]],
            ['Sarana dan Prasarana', [['sarana_prasarana', null]]],
            ['Target Peserta Didik', [['_target', null]]],
            ['Pemahaman Bermakna', [['pemahaman_bermakna', null]]],
            ['Pertanyaan Pemantik', [['pertanyaan_pemantik', null]]],
            ['Desain Pembelajaran Mendalam', [
                ['praktik_pedagogis', 'Praktik Pedagogis (Model / Metode)'],
                ['kemitraan_pembelajaran', 'Kemitraan Pembelajaran'],
                ['lingkungan_pembelajaran', 'Lingkungan Pembelajaran'],
                ['pemanfaatan_digital', 'Pemanfaatan Digital'],
                ['lintas_disiplin', 'Lintas Disiplin Ilmu'],
            ]],
            ['Kegiatan Pembelajaran', [['_pertemuan', null], ['strategi_diferensiasi', 'Strategi Diferensiasi']]],
            ['Asesmen', [
                ['asesmen_diagnostik', 'Asesmen Diagnostik (Awal)'],
                ['asesmen_formatif', 'Asesmen Formatif (Proses)'],
                ['asesmen_sumatif', 'Asesmen Sumatif (Akhir)'],
                ['kktp', 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)'],
            ]],
            ['Pengayaan dan Remedial', [['pengayaan', 'Pengayaan'], ['remedial', 'Remedial']]],
            ['Refleksi', [['refleksi_guru', 'Refleksi Guru'], ['refleksi_siswa', 'Refleksi Peserta Didik']]],
            ['Glosarium', [['glosarium', null]]],
            ['Daftar Pustaka', [['daftar_pustaka', null]]],
        ],
        'k13' => [
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
        ],
    ];

    /** Field wajib saat diajukan (selain identitas, alokasi, dan pertemuan). */
    public const WAJIB = [
        'merdeka' => [
            'praktik_pedagogis' => 'Praktik pedagogis',
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
            $hasil['dimensi_profil'] = array_values(array_intersect(self::DIMENSI_PROFIL, (array) ($data['dimensi_profil'] ?? [])));
            $hasil['target_peserta'] = array_values(array_intersect(self::TARGET_PESERTA, (array) ($data['target_peserta'] ?? [])));
        }

        return $hasil;
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
            if (empty($d['cp'])) {
                $kurang[] = 'Capaian pembelajaran';
            }
            if (empty($d['tp_master']) && HtmlAman::teksPolos($d['tujuan_pembelajaran'] ?? '') === '') {
                $kurang[] = 'Tujuan pembelajaran';
            }
            if (empty($d['dimensi_profil'])) {
                $kurang[] = 'Dimensi profil lulusan';
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

    /**
     * Seragamkan data lama (sebelum struktur ini) supaya tetap bisa dibuka
     * di form dan dicetak: P3 6 dimensi -> 8 dimensi profil lulusan,
     * kegiatan tunggal -> pertemuan 1, alokasi teks bebas dipertahankan.
     */
    public static function normalisasi(array $d, string $kurikulum): array
    {
        if (empty($d['dimensi_profil']) && ! empty($d['profil_pelajar'])) {
            $peta = [
                'Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia' => 'Keimanan dan Ketakwaan terhadap Tuhan YME',
                'Berkebinekaan global' => 'Kewargaan',
                'Bergotong royong' => 'Kolaborasi',
                'Mandiri' => 'Kemandirian',
                'Bernalar kritis' => 'Penalaran Kritis',
                'Kreatif' => 'Kreativitas',
            ];
            $d['dimensi_profil'] = array_values(array_unique(array_filter(array_map(fn ($x) => $peta[$x] ?? null, (array) $d['profil_pelajar']))));
        }
        if (empty($d['pertemuan']) && (filled($d['pendahuluan'] ?? null) || filled($d['kegiatan_inti'] ?? null) || filled($d['penutup'] ?? null))) {
            $inti = $kurikulum === 'merdeka' ? 'memahami' : 'inti';
            $tahap = [];
            foreach (array_keys(self::TAHAP[$kurikulum]) as $t) {
                $tahap[$t] = ['isi' => '', 'durasi' => null];
            }
            $tahap['pendahuluan']['isi'] = (string) ($d['pendahuluan'] ?? '');
            $tahap[$inti]['isi'] = (string) ($d['kegiatan_inti'] ?? '');
            $tahap['penutup']['isi'] = (string) ($d['penutup'] ?? '');
            $d['pertemuan'] = [['topik' => '', 'tahap' => $tahap]];
        }
        if (! empty($d['target_peserta'])) {
            $d['target_peserta'] = array_values(array_map(
                fn ($x) => str_replace('Siswa ', 'Peserta didik ', (string) $x),
                (array) $d['target_peserta'],
            ));
        }

        return $d;
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

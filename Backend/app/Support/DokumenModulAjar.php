<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Guru;
use App\Models\ModulAjar;
use App\Models\ModulAjarLampiran;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\Element\AbstractContainer;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\Shared\Html;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\Style\ListItem;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menyusun dokumen RPP (K13) / Modul Ajar Kurikulum Merdeka Belajar (RPP+)
 * dalam format PDF dan Word (.docx) dari isian perangkat ajar guru.
 *
 * Isi dokumen disusun dulu dalam bentuk netral (isi()) lalu dirender ke PDF
 * (Blade modul-ajar.dokumen) maupun Word. Tiap bagian punya judul yang sudah
 * bernomor dan daftar butir bertipe: html, daftar, cp, pertemuan, info
 * (pasangan label–nilai), atp, lkpd.
 */
class DokumenModulAjar
{
    public function __construct(private ModulAjar $modul) {}

    public function respons(string $format): Response
    {
        if ($format === 'pdf') {
            return $this->pdf()->download($this->namaFile('pdf'));
        }

        return response()->download($this->docx(), $this->namaFile('docx'), [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend();
    }

    public function namaFile(string $ekstensi): string
    {
        $jenis = $this->modul->kurikulum === 'merdeka' ? 'modul-ajar' : 'rpp';

        return $jenis.'-'.(Str::slug((string) $this->modul->judul) ?: ($this->modul->id ?: 'baru')).'.'.$ekstensi;
    }

    public function isi(): array
    {
        $m = $this->modul;
        $kurikulum = $m->kurikulum;
        $merdeka = $kurikulum === 'merdeka';
        $d = StrukturPerangkatAjar::normalisasi($m->data ?? [], $kurikulum);
        [$kelas, $semesterLama] = $this->pisahKelasSemester($m->kelas);
        $semester = ($d['semester'] ?? null) ?: $semesterLama;
        $guru = $m->guru;
        $namaGuru = ($d['nama_guru'] ?? null) ?: $this->namaGuru($guru);
        $nipGuru = ($d['nip_guru'] ?? null) ?: $guru?->nip;
        $sekolah = ($d['institusi'] ?? null) ?: ($d['nama_sekolah'] ?? null) ?: (tenant('nama_sekolah') ?: null);
        $kota = ($d['kota'] ?? null) ?: (tenant('kabupaten_kota') ?: null);

        // Tanda tangan kepala sekolah: peninjau bila ia Kepala Sekolah,
        // selain itu kepala sekolah yang terdaftar.
        $peninjau = $m->status === ModulAjar::DISETUJUI && $m->relationLoaded('peninjau') ? $m->peninjau : null;
        $peninjauKepala = $peninjau && $peninjau->hasRole('Kepala Sekolah');
        $kepala = $peninjauKepala
            ? $peninjau->guru
            : Guru::whereHas('user.roles', fn ($q) => $q->where('name', 'Kepala Sekolah'))->first();
        $jenjang = strtoupper((string) (($d['jenjang'] ?? null) ?: tenant('jenjang')));

        $umum = [
            'judul' => (string) $m->judul,
            'status' => $this->teksStatus($m, $peninjau),
            'tanggal' => ($peninjau && $m->ditinjau_at ? $m->ditinjau_at : now())->locale('id')->translatedFormat('j F Y'),
            'kota' => $kota,
            'guru' => ['nama' => $namaGuru, 'nip' => $nipGuru, 'jabatan' => in_array($jenjang, ['SD', 'MI'], true) ? 'Guru Kelas' : 'Guru Mata Pelajaran'],
            'kepala' => ['nama' => $this->namaGuru($kepala) ?: ($peninjauKepala ? $peninjau->name : null), 'nip' => $kepala?->nip],
        ];

        if (! $merdeka) {
            return $umum + $this->isiK13($m, $d, $kelas, $semester, $namaGuru, $sekolah);
        }

        return $umum + $this->isiMerdeka($m, $d, $kelas, $semester, $namaGuru, $nipGuru, $sekolah, $kota);
    }

    /** Modul Ajar Kurikulum Merdeka Belajar (RPP+). */
    private function isiMerdeka(ModulAjar $m, array $d, ?string $kelas, ?string $semester, ?string $namaGuru, ?string $nipGuru, ?string $sekolah, ?string $kota): array
    {
        $fase = filled($d['fase'] ?? null) ? 'Fase '.$d['fase'] : null;
        $jenjang = ($d['jenjang'] ?? null) ?: (tenant('jenjang') ?: null);
        $metode = array_values(array_filter([...($d['metode'] ?? []), $d['metode_lain'] ?? null]));

        $sampul = [
            'judul' => 'MODUL AJAR KURIKULUM MERDEKA BELAJAR (RPP+)',
            'topik' => (string) $m->judul,
            'baris' => array_filter([
                'Penyusun' => $namaGuru,
                'NIP' => $nipGuru ?: '-',
                'Kelas / Semester' => trim(implode(' / ', array_filter([$kelas, $semester]))) ?: null,
                'Mata Pelajaran' => $m->mata_pelajaran,
            ], fn ($v) => filled($v)),
            'sekolah' => $sekolah,
            'kota' => $kota,
            'tahun_ajaran' => ($d['tahun_ajaran'] ?? null) ? 'Tahun Ajaran '.$d['tahun_ajaran'] : null,
        ];

        // A. INFORMASI UMUM
        $info = array_filter([
            'Nama Penyusun' => $namaGuru,
            'Institusi' => $sekolah,
            'Mata Pelajaran' => $m->mata_pelajaran,
            'Bab / Tema / Unit' => $d['bab_tema'] ?? null,
            'Jenjang / Fase / Kelas / Semester' => trim(implode(', ', array_filter([$jenjang, $fase, $kelas ? 'Kelas '.$kelas : null, $semester ? 'Semester '.$semester : null]))) ?: null,
            'Alokasi Waktu' => StrukturPerangkatAjar::teksAlokasi($d),
            'Tahun Ajaran' => $d['tahun_ajaran'] ?? null,
            'Moda Pembelajaran' => $d['moda'] ?? null,
            'Metode Pembelajaran' => $metode ? implode(', ', $metode) : null,
            'Model Pembelajaran' => $d['model_pembelajaran'] ?? null,
            'Target Peserta Didik' => ! empty($d['target_peserta']) ? implode('; ', $d['target_peserta']) : null,
            'Jumlah Peserta Didik' => filled($d['jumlah_peserta'] ?? null) ? $d['jumlah_peserta'].' peserta didik' : null,
        ], fn ($v) => filled($v));

        $a = [['tipe' => 'info', 'label' => null, 'nilai' => $info]];
        $this->tambahHtml($a, $d, 'karakteristik_peserta', 'Karakteristik Peserta Didik');
        if (! empty($d['profil_pelajar'])) {
            $a[] = ['tipe' => 'daftar', 'label' => 'Profil Pelajar Pancasila', 'nilai' => $d['profil_pelajar']];
        }
        $this->tambahHtml($a, $d, 'sarana_prasarana', 'Sarana dan Prasarana');

        // B. KOMPONEN INTI
        $b = [];
        $no = 0;
        $judul = function (string $teks) use (&$no) {
            return ++$no.'. '.$teks;
        };

        $cp = [];
        $this->tambahHtml($cp, $d, 'cp_umum', 'Capaian Pembelajaran Umum'.($fase ? " ({$fase})" : ''));
        if (! empty($d['cp'])) {
            $cp[] = ['tipe' => 'cp', 'label' => 'Capaian Pembelajaran per Elemen', 'nilai' => $d['cp']];
        }
        $this->sub($b, $judul('Capaian Pembelajaran (CP)'), $cp);

        $tp = $this->butirTp($d);
        $this->sub($b, $judul('Tujuan Pembelajaran (TP)'), $tp ? [['label' => null] + $tp] : []);

        $atp = StrukturPerangkatAjar::atpLengkap($d);
        $this->sub($b, $judul('Alur Tujuan Pembelajaran (ATP)'), $atp ? [['tipe' => 'atp', 'label' => null, 'nilai' => $this->kelompokAtp($atp)]] : []);

        $this->sub($b, $judul('Pemahaman Bermakna'), $this->htmlSaja($d, 'pemahaman_bermakna'));
        $this->sub($b, $judul('Materi Inti'), $this->htmlSaja($d, 'materi_inti'));

        $asesmen = [];
        $this->tambahHtml($asesmen, $d, 'asesmen_diagnostik', 'Asesmen Diagnostik (awal pembelajaran)');
        $this->tambahHtml($asesmen, $d, 'asesmen_formatif', 'Asesmen Formatif (selama pembelajaran)');
        $this->tambahHtml($asesmen, $d, 'asesmen_sumatif', 'Asesmen Sumatif (akhir pembelajaran)');
        $this->sub($b, $judul('Asesmen'), $asesmen);

        $kegiatan = [];
        if (! empty($d['pertemuan'])) {
            $kegiatan[] = ['tipe' => 'pertemuan', 'label' => null, 'nilai' => $this->pertemuan($d['pertemuan'], StrukturPerangkatAjar::TAHAP['merdeka'])];
        }
        $this->tambahHtml($kegiatan, $d, 'kegiatan_alternatif', 'Kegiatan Alternatif (bila media utama tidak tersedia)');
        $this->sub($b, $judul('Kegiatan Pembelajaran'), $kegiatan);

        $refleksi = [];
        $this->tambahHtml($refleksi, $d, 'refleksi_guru', 'Refleksi Guru');
        $this->tambahHtml($refleksi, $d, 'refleksi_siswa', 'Refleksi Peserta Didik');
        $this->tambahHtml($refleksi, $d, 'pemetaan_kemampuan', 'Pemetaan Kemampuan Peserta Didik (untuk Diferensiasi)');
        $this->sub($b, $judul('Refleksi'), $refleksi);

        $this->sub($b, $judul('Interaksi dengan Orang Tua / Wali'), $this->htmlSaja($d, 'interaksi_ortu'));

        // C. LAMPIRAN
        $c = [];
        $this->tambahHtml($c, $d, 'bahan_bacaan', 'Bahan Bacaan Guru dan Peserta Didik');
        if (HtmlAman::teksPolos((string) ($d['lkpd'] ?? '')) !== '') {
            $c[] = ['tipe' => 'lkpd', 'label' => 'Lembar Kerja Peserta Didik (LKPD)', 'nilai' => HtmlAman::bersihkan((string) $d['lkpd'])];
        }
        $this->tambahHtml($c, $d, 'rubrik_sikap', 'Rubrik Penilaian Sikap (skor 1–4)');
        $this->tambahHtml($c, $d, 'rubrik_pengetahuan', 'Rubrik Penilaian Pengetahuan dan Keterampilan');
        if ($c || filled($d['rumus_nilai'] ?? null)) {
            $c[] = ['tipe' => 'html', 'label' => 'Pengolahan Nilai', 'nilai' => '<p>'.e(($d['rumus_nilai'] ?? '') ?: StrukturPerangkatAjar::RUMUS_NILAI_BAWAAN).'</p>'];
        }
        $this->tambahHtml($c, $d, 'remedial', 'Remedial');
        $this->tambahHtml($c, $d, 'pengayaan', 'Pengayaan');
        $berkas = $m->relationLoaded('lampiran') ? $m->lampiran : collect();
        if ($berkas->isNotEmpty()) {
            $c[] = ['tipe' => 'daftar', 'label' => 'Berkas Lampiran', 'nilai' => $berkas->map(fn ($l) => (ModulAjarLampiran::JENIS[$l->jenis] ?? 'Lampiran').': '.$l->nama_file)->all()];
        }
        $this->tambahHtml($c, $d, 'daftar_pustaka', 'Daftar Pustaka');

        // Rekapitulasi di bagian penutup: topik & TP per elemen.
        $rekap = [];
        $topik = array_values(array_filter(array_map(fn ($p) => trim((string) ($p['topik'] ?? '')), $d['pertemuan'] ?? [])));
        if ($topik) {
            $rekap[] = ['tipe' => 'daftar', 'label' => 'Daftar Topik / Materi yang Dibahas', 'nilai' => $topik];
        }
        $tpPerElemen = [];
        foreach ($d['tp_master'] ?? [] as $t) {
            $tpPerElemen[$t['elemen'] ?? 'Tujuan Pembelajaran'][] = $t['deskripsi'];
        }
        foreach ($tpPerElemen as $elemen => $daftar) {
            $rekap[] = ['tipe' => 'daftar', 'label' => "Tujuan Pembelajaran — Elemen {$elemen}", 'nilai' => $daftar];
        }

        return [
            'judul_dokumen' => 'MODUL AJAR',
            'sub_judul' => 'Kurikulum Merdeka Belajar (RPP+)',
            'sampul' => $sampul,
            'identitas' => [],
            'bagian' => array_values(array_filter([
                $a ? ['judul' => 'A. Informasi Umum', 'butir' => $a] : null,
                $b ? ['judul' => 'B. Komponen Inti', 'butir' => $b] : null,
                $c ? ['judul' => 'C. Lampiran', 'butir' => $c] : null,
                $rekap ? ['judul' => 'Rekapitulasi', 'butir' => $rekap] : null,
            ])),
        ];
    }

    /** RPP 1 lembar Kurikulum 2013. */
    private function isiK13(ModulAjar $m, array $d, ?string $kelas, ?string $semester, ?string $namaGuru, ?string $sekolah): array
    {
        $identitas = array_filter([
            'Satuan Pendidikan' => $sekolah,
            'Nama Guru' => $namaGuru,
            'Mata Pelajaran' => $m->mata_pelajaran,
            'Kelas / Semester' => trim(implode(' / ', array_filter([$kelas, $semester]))) ?: null,
            'Materi Pokok' => $d['materi_pokok'] ?? null,
            'Alokasi Waktu' => StrukturPerangkatAjar::teksAlokasi($d),
            'Tahun Penyusunan' => $d['tahun_penyusunan'] ?? null,
        ], fn ($v) => filled($v));

        $bagian = [];
        foreach (StrukturPerangkatAjar::BAGIAN_K13 as [$judul, $fields]) {
            $butir = [];
            foreach ($fields as [$kunci, $label]) {
                $b = $kunci === '_pertemuan'
                    ? (! empty($d['pertemuan']) ? ['tipe' => 'pertemuan', 'nilai' => $this->pertemuan($d['pertemuan'], StrukturPerangkatAjar::TAHAP['k13'])] : null)
                    : (HtmlAman::teksPolos((string) ($d[$kunci] ?? '')) !== '' ? ['tipe' => 'html', 'nilai' => HtmlAman::bersihkan((string) $d[$kunci])] : null);
                if ($b) {
                    $butir[] = ['label' => $label] + $b;
                }
            }
            if ($butir) {
                $bagian[] = ['judul' => $judul, 'butir' => $butir];
            }
        }
        $berkas = $m->relationLoaded('lampiran') ? $m->lampiran : collect();
        if ($berkas->isNotEmpty()) {
            $bagian[] = ['judul' => 'Lampiran', 'butir' => [[
                'label' => null,
                'tipe' => 'daftar',
                'nilai' => $berkas->map(fn ($l) => (ModulAjarLampiran::JENIS[$l->jenis] ?? 'Lampiran').': '.$l->nama_file)->all(),
            ]]];
        }
        foreach ($bagian as $i => $b) {
            $bagian[$i]['judul'] = chr(65 + $i).'. '.$b['judul'];
        }

        return [
            'judul_dokumen' => 'RENCANA PELAKSANAAN PEMBELAJARAN (RPP)',
            'sub_judul' => 'Kurikulum 2013',
            'sampul' => null,
            'identitas' => $identitas,
            'bagian' => $bagian,
        ];
    }

    public function pdf()
    {
        return Pdf::loadView('modul-ajar.dokumen', ['dok' => $this->isi()])->setPaper('a4');
    }

    /** Menulis file .docx sementara dan mengembalikan path-nya. */
    public function docx(): string
    {
        $dok = $this->isi();
        // Semua teks di-escape otomatis oleh PhpWord (judul/nama bisa berisi & atau <).
        Settings::setOutputEscapingEnabled(true);
        $word = new PhpWord;
        $word->setDefaultFontName('Times New Roman');
        $word->setDefaultFontSize(12);
        $word->setDefaultParagraphStyle(['spaceAfter' => 0, 'spacing' => 0]);
        $word->addTitleStyle(1, ['bold' => true, 'size' => 12], ['spaceBefore' => 240, 'spaceAfter' => 80, 'keepNext' => true]);
        $word->addTableStyle('Garis', ['borderSize' => 6, 'borderColor' => '000000', 'cellMargin' => 60]);
        $margin = ['marginTop' => 1134, 'marginBottom' => 1134, 'marginLeft' => 1418, 'marginRight' => 1134];
        $tengah = ['alignment' => Jc::CENTER];

        if ($s = $dok['sampul']) {
            $sampul = $word->addSection($margin + ['vAlign' => 'center']);
            $sampul->addText($s['judul'], ['bold' => true, 'size' => 18], $tengah);
            $sampul->addTextBreak(1);
            $sampul->addText(mb_strtoupper($s['topik']), ['bold' => true, 'size' => 14], $tengah);
            $sampul->addTextBreak(3);
            $t = $sampul->addTable(['alignment' => Jc::CENTER, 'cellMargin' => 30]);
            foreach ($s['baris'] as $label => $nilai) {
                $t->addRow();
                $t->addCell(2600)->addText($label);
                $t->addCell(300)->addText(':');
                $t->addCell(4600)->addText((string) $nilai, ['bold' => true]);
            }
            $sampul->addTextBreak(4);
            foreach (array_filter([$s['sekolah'] ? mb_strtoupper($s['sekolah']) : null, $s['kota'] ? mb_strtoupper($s['kota']) : null, $s['tahun_ajaran']]) as $baris) {
                $sampul->addText($baris, ['bold' => true, 'size' => 13], $tengah);
            }
        }

        $sec = $word->addSection($margin);
        $sec->addText($dok['judul_dokumen'], ['bold' => true, 'size' => 14], $tengah);
        $sec->addText($dok['sub_judul'], [], $tengah);
        $sec->addText(mb_strtoupper($dok['judul']), ['bold' => true], $tengah);
        if ($dok['status']) {
            $sec->addText($dok['status'], ['italic' => true, 'size' => 10, 'color' => '555555'], $tengah);
        }
        $sec->addTextBreak(1);

        if ($dok['identitas']) {
            $this->infoKeWord($sec, $dok['identitas']);
        }

        foreach ($dok['bagian'] as $bagian) {
            $sec->addTitle(mb_strtoupper($bagian['judul']), 1);
            foreach ($bagian['butir'] as $butir) {
                if ($butir['label']) {
                    // Sub-judul bernomor ("1. Capaian Pembelajaran") tegak; label butir di dalamnya miring.
                    $sub = ! empty($butir['sub']);
                    $sec->addText($butir['label'], ['bold' => true, 'italic' => ! $sub && $dok['sampul'] !== null], ['spaceBefore' => $sub ? 160 : 100, 'spaceAfter' => 40, 'keepNext' => true]);
                }
                match ($butir['tipe']) {
                    'html' => $this->htmlKeWord($sec, $butir['nilai']),
                    'daftar' => $this->daftarKeWord($sec, $butir['nilai']),
                    'cp' => $this->cpKeWord($sec, $butir['nilai']),
                    'pertemuan' => $this->pertemuanKeWord($sec, $butir['nilai']),
                    'info' => $this->infoKeWord($sec, $butir['nilai']),
                    'atp' => $this->atpKeWord($sec, $butir['nilai']),
                    'lkpd' => $this->lkpdKeWord($sec, $butir['nilai']),
                    'judul' => null,
                };
            }
        }

        $sec->addTextBreak(1);
        $ttd = $sec->addTable();
        // Blok tanda tangan tidak boleh terpotong ke halaman berikutnya.
        $ttd->addRow(null, ['cantSplit' => true]);
        $kiri = $ttd->addCell(4700);
        $kanan = $ttd->addCell(4700);
        $kiri->addText('');
        $kiri->addText('Mengetahui,');
        $kiri->addText('Kepala Sekolah', [], ['spaceAfter' => 900]);
        $kiri->addText($dok['kepala']['nama'] ?: '(.................................)', ['bold' => true, 'underline' => 'single']);
        $kiri->addText('NIP. '.($dok['kepala']['nip'] ?: '-'));
        $kanan->addText(trim(($dok['kota'] ? $dok['kota'].', ' : '').$dok['tanggal']));
        $kanan->addText('');
        $kanan->addText($dok['guru']['jabatan'], [], ['spaceAfter' => 900]);
        $kanan->addText($dok['guru']['nama'] ?: '(.................................)', ['bold' => true, 'underline' => 'single']);
        $kanan->addText('NIP. '.($dok['guru']['nip'] ?: '-'));

        $path = tempnam(sys_get_temp_dir(), 'rpp').'.docx';
        IOFactory::createWriter($word, 'Word2007')->save($path);

        return $path;
    }

    /* ------------------------- bantu: penyusunan isi ------------------------- */

    /** Tambah sub-bagian bernomor (mis. "1. Capaian Pembelajaran") bila ada isinya. */
    private function sub(array &$bagian, string $judul, array $butir): void
    {
        if (! $butir) {
            return;
        }
        $bagian[] = ['tipe' => 'judul', 'label' => $judul, 'sub' => true];
        array_push($bagian, ...$butir);
    }

    private function tambahHtml(array &$butir, array $d, string $kunci, ?string $label): void
    {
        if (HtmlAman::teksPolos((string) ($d[$kunci] ?? '')) !== '') {
            $butir[] = ['tipe' => 'html', 'label' => $label, 'nilai' => HtmlAman::bersihkan((string) $d[$kunci])];
        }
    }

    private function htmlSaja(array $d, string $kunci): array
    {
        $butir = [];
        $this->tambahHtml($butir, $d, $kunci, null);

        return $butir;
    }

    /** ATP dikelompokkan per minggu/pertemuan: [['waktu' => ..., 'kalimat' => [...]], ...]. */
    private function kelompokAtp(array $atp): array
    {
        $grup = [];
        foreach ($atp as $a) {
            $waktu = $a['waktu'] ?: 'Tanpa keterangan waktu';
            $grup[$waktu][] = StrukturPerangkatAjar::kalimatAtp($a['kegiatan'], $a['kemampuan']);
        }

        return array_map(fn ($w, $k) => ['waktu' => $w, 'kalimat' => $k], array_keys($grup), $grup);
    }

    private function butirTp(array $d): ?array
    {
        $daftar = array_values(array_filter(array_map(fn ($t) => $t['deskripsi'] ?? null, $d['tp_master'] ?? [])));
        $tambahan = HtmlAman::teksPolos((string) ($d['tujuan_pembelajaran'] ?? '')) !== '' ? HtmlAman::bersihkan((string) $d['tujuan_pembelajaran']) : null;
        if (! $daftar && ! $tambahan) {
            return null;
        }
        if (! $daftar) {
            return ['tipe' => 'html', 'nilai' => $tambahan];
        }
        $html = '<ol>'.implode('', array_map(fn ($x) => '<li>'.e($x).'</li>', $daftar)).'</ol>'.($tambahan ?? '');

        return ['tipe' => 'html', 'nilai' => $html];
    }

    private function pertemuan(array $pertemuan, array $tahap): array
    {
        $hasil = [];
        foreach ($pertemuan as $i => $p) {
            $baris = [];
            $total = 0;
            foreach ($tahap as $k => $label) {
                $isi = HtmlAman::teksPolos($p['tahap'][$k]['isi'] ?? '') !== '' ? HtmlAman::bersihkan($p['tahap'][$k]['isi']) : '';
                $durasi = $p['tahap'][$k]['durasi'] ?? null;
                $total += (int) $durasi;
                $baris[] = ['label' => $label, 'isi' => $isi, 'durasi' => $durasi];
            }
            $judul = 'Pertemuan '.($i + 1).(filled($p['topik'] ?? null) ? ': '.$p['topik'] : '').($total ? " ({$total} menit)" : '');
            $hasil[] = ['judul' => $judul, 'tahap' => $baris];
        }

        return $hasil;
    }

    /* ----------------------------- bantu: Word ----------------------------- */

    private function htmlKeWord(AbstractContainer $wadah, string $html): void
    {
        // Tabel dari editor diberi garis supaya tampil seperti di layar.
        $html = HtmlAman::keXhtml($html);
        $html = str_replace('<table>', '<table style="border: 1px solid #000000; width: 100%;">', $html);
        $html = preg_replace('/<(td|th)>/', '<$1 style="border: 1px solid #000000;">', $html);
        Html::addHtml($wadah, $html, false, false);
    }

    /** PhpWord mengurai HTML sebagai XML, jadi ubah dulu ke XHTML. */
    private function htmlWord(AbstractContainer $wadah, string $html): void
    {
        Html::addHtml($wadah, HtmlAman::keXhtml($html), false, false);
    }

    private function daftarKeWord(AbstractContainer $wadah, array $daftar): void
    {
        foreach ($daftar as $x) {
            $wadah->addListItem((string) $x, 0, null, ['listType' => ListItem::TYPE_BULLET_FILLED]);
        }
    }

    private function infoKeWord(AbstractContainer $wadah, array $info): void
    {
        $tabel = $wadah->addTable(['cellMargin' => 30]);
        foreach ($info as $label => $nilai) {
            $tabel->addRow();
            $tabel->addCell(3200)->addText($label);
            $tabel->addCell(300)->addText(':');
            $tabel->addCell(5600)->addText((string) $nilai);
        }
    }

    private function cpKeWord(AbstractContainer $wadah, array $cp): void
    {
        foreach ($cp as $c) {
            $wadah->addText('Elemen: '.$c['elemen'], ['bold' => true], ['spaceBefore' => 60, 'keepNext' => true]);
            $wadah->addText((string) $c['deskripsi'], [], ['alignment' => Jc::BOTH]);
        }
    }

    private function atpKeWord(AbstractContainer $wadah, array $grup): void
    {
        $tabel = $wadah->addTable('Garis');
        $tabel->addRow(null, ['tblHeader' => true]);
        $tabel->addCell(2000, ['bgColor' => 'E8F3EE'])->addText('Waktu', ['bold' => true]);
        $tabel->addCell(7100, ['bgColor' => 'E8F3EE'])->addText('Alur Tujuan Pembelajaran', ['bold' => true]);
        foreach ($grup as $g) {
            $tabel->addRow();
            $tabel->addCell(2000)->addText($g['waktu'], ['bold' => true]);
            $sel = $tabel->addCell(7100);
            foreach ($g['kalimat'] as $k) {
                $sel->addListItem($k, 0, null, ['listType' => ListItem::TYPE_NUMBER]);
            }
        }
    }

    private function lkpdKeWord(AbstractContainer $wadah, string $html): void
    {
        $kepala = $wadah->addTable('Garis');
        $kepala->addRow();
        $kepala->addCell(6100)->addText('Nama: ...............................................');
        $kepala->addCell(3000)->addText('Nilai: ............');
        $wadah->addTextBreak(1);
        $this->htmlKeWord($wadah, $html);
    }

    private function pertemuanKeWord(AbstractContainer $wadah, array $pertemuan): void
    {
        foreach ($pertemuan as $p) {
            $wadah->addText($p['judul'], ['bold' => true, 'italic' => true], ['spaceBefore' => 120, 'spaceAfter' => 60, 'keepNext' => true]);
            $tabel = $wadah->addTable('Garis');
            $tabel->addRow(null, ['tblHeader' => true]);
            $tabel->addCell(1900, ['bgColor' => 'E8F3EE'])->addText('Tahap', ['bold' => true]);
            $tabel->addCell(6100, ['bgColor' => 'E8F3EE'])->addText('Kegiatan', ['bold' => true]);
            $tabel->addCell(1100, ['bgColor' => 'E8F3EE'])->addText('Durasi', ['bold' => true]);
            foreach ($p['tahap'] as $t) {
                $tabel->addRow();
                $tabel->addCell(1900)->addText($t['label'], ['bold' => true]);
                $isi = $tabel->addCell(6100);
                $t['isi'] !== '' ? $this->htmlWord($isi, $t['isi']) : $isi->addText('-');
                $tabel->addCell(1100)->addText($t['durasi'] ? $t['durasi'].' menit' : '-');
            }
        }
    }

    /* ------------------------------- lain-lain ------------------------------- */

    private function teksStatus(ModulAjar $m, $peninjau): ?string
    {
        return match ($m->status) {
            ModulAjar::DISETUJUI => 'Disetujui'.($peninjau ? ' oleh '.$peninjau->name : '').($m->ditinjau_at ? ' pada '.$m->ditinjau_at->locale('id')->translatedFormat('j F Y') : ''),
            ModulAjar::DIAJUKAN => 'Status: diajukan, menunggu persetujuan',
            ModulAjar::REVISI => 'Status: perlu revisi',
            default => 'Status: draf (belum diajukan)',
        };
    }

    private function namaGuru(?Guru $guru): ?string
    {
        return $guru ? (implode(', ', array_filter([$guru->nama, $guru->gelar])) ?: null) : null;
    }

    /** Data lama menyimpan "VII / Ganjil" dalam kolom kelas. */
    private function pisahKelasSemester(?string $teks): array
    {
        if ($teks && preg_match('/^(.*?)\s*\/\s*(?:Semester\s+)?(Ganjil|Genap)\s*$/i', $teks, $m)) {
            return [$m[1], ucfirst(strtolower($m[2]))];
        }

        return [$teks, null];
    }
}

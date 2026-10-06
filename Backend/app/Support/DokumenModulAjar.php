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
 * Menyusun dokumen RPP (K13) / Modul Ajar (Kurikulum Merdeka) dalam format
 * PDF dan Word (.docx) dari isian perangkat ajar guru. Struktur bagian ada
 * di StrukturPerangkatAjar.
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

    /**
     * Isi dokumen dalam bentuk netral (dipakai PDF maupun Word). Tiap butir
     * bagian bertipe: html (teks berformat), daftar (array teks), cp,
     * pertemuan.
     */
    public function isi(): array
    {
        $m = $this->modul;
        $kurikulum = $m->kurikulum;
        $merdeka = $kurikulum === 'merdeka';
        $d = StrukturPerangkatAjar::normalisasi($m->data ?? [], $kurikulum);
        [$kelas, $semesterLama] = $this->pisahKelasSemester($m->kelas);
        $semester = ($d['semester'] ?? null) ?: $semesterLama;
        $guru = $m->guru;

        $identitas = array_filter([
            'Satuan Pendidikan' => $d['institusi'] ?? $d['nama_sekolah'] ?? (tenant('nama_sekolah') ?: null),
            'Nama Guru' => ($d['nama_guru'] ?? null) ?: $this->namaGuru($guru),
            'Mata Pelajaran' => $m->mata_pelajaran,
            'Kelas / Semester' => trim(implode(' / ', array_filter([$kelas, $semester]))) ?: null,
            'Jenjang / Fase' => $merdeka ? (trim(implode(' / ', array_filter([$d['jenjang'] ?? null, filled($d['fase'] ?? null) ? StrukturPerangkatAjar::labelFase($d['fase']) : null]))) ?: null) : null,
            'Materi Pokok' => $d['materi_pokok'] ?? null,
            'Alokasi Waktu' => StrukturPerangkatAjar::teksAlokasi($d),
            'Tahun Penyusunan' => $d['tahun_penyusunan'] ?? null,
        ], fn ($v) => filled($v));

        $tahap = StrukturPerangkatAjar::TAHAP[$kurikulum];
        $bagian = [];
        foreach (StrukturPerangkatAjar::BAGIAN[$kurikulum] as [$judul, $fields]) {
            $butir = [];
            foreach ($fields as [$kunci, $label]) {
                $b = match ($kunci) {
                    '_cp' => ! empty($d['cp']) ? ['tipe' => 'cp', 'nilai' => $d['cp']] : null,
                    '_tp' => $this->butirTp($d),
                    '_dimensi' => ! empty($d['dimensi_profil']) ? ['tipe' => 'daftar', 'nilai' => $d['dimensi_profil']] : null,
                    '_target' => ! empty($d['target_peserta']) ? ['tipe' => 'daftar', 'nilai' => $d['target_peserta']] : null,
                    '_pertemuan' => ! empty($d['pertemuan']) ? ['tipe' => 'pertemuan', 'nilai' => $this->pertemuan($d['pertemuan'], $tahap)] : null,
                    default => HtmlAman::teksPolos((string) ($d[$kunci] ?? '')) !== ''
                        ? ['tipe' => 'html', 'nilai' => HtmlAman::bersihkan((string) $d[$kunci])]
                        : null,
                };
                if ($b) {
                    $butir[] = ['label' => $label] + $b;
                }
            }
            if ($butir) {
                $bagian[] = ['judul' => $judul, 'butir' => $butir];
            }
        }

        $lampiran = $m->relationLoaded('lampiran') ? $m->lampiran : collect();
        if ($lampiran->isNotEmpty()) {
            $bagian[] = ['judul' => 'Lampiran', 'butir' => [[
                'label' => null,
                'tipe' => 'daftar',
                'nilai' => $lampiran->map(fn ($l) => (ModulAjarLampiran::JENIS[$l->jenis] ?? 'Lampiran').': '.$l->nama_file)->all(),
            ]]];
        }

        // Tanda tangan kepala sekolah: peninjau bila ia Kepala Sekolah,
        // selain itu kepala sekolah yang terdaftar.
        $peninjau = $m->status === ModulAjar::DISETUJUI && $m->relationLoaded('peninjau') ? $m->peninjau : null;
        $peninjauKepala = $peninjau && $peninjau->hasRole('Kepala Sekolah');
        $kepala = $peninjauKepala
            ? $peninjau->guru
            : Guru::whereHas('user.roles', fn ($q) => $q->where('name', 'Kepala Sekolah'))->first();

        return [
            'judul_dokumen' => $merdeka ? 'MODUL AJAR' : 'RENCANA PELAKSANAAN PEMBELAJARAN (RPP)',
            'sub_judul' => $merdeka ? 'Kurikulum Merdeka' : 'Kurikulum 2013',
            'judul' => (string) $m->judul,
            'status' => $this->teksStatus($m, $peninjau),
            'identitas' => $identitas,
            'bagian' => $bagian,
            'tanggal' => ($peninjau && $m->ditinjau_at ? $m->ditinjau_at : now())->locale('id')->translatedFormat('j F Y'),
            'kota' => tenant('kabupaten_kota') ?: null,
            'guru' => ['nama' => ($d['nama_guru'] ?? null) ?: $this->namaGuru($guru), 'nip' => $guru?->nip],
            'kepala' => ['nama' => $this->namaGuru($kepala) ?: ($peninjauKepala ? $peninjau->name : null), 'nip' => $kepala?->nip],
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

        $sec = $word->addSection(['marginTop' => 1134, 'marginBottom' => 1134, 'marginLeft' => 1418, 'marginRight' => 1134]);
        $tengah = ['alignment' => Jc::CENTER];
        $sec->addText($dok['judul_dokumen'], ['bold' => true, 'size' => 14], $tengah);
        $sec->addText($dok['sub_judul'], [], $tengah);
        $sec->addText(mb_strtoupper($dok['judul']), ['bold' => true], $tengah);
        if ($dok['status']) {
            $sec->addText($dok['status'], ['italic' => true, 'size' => 10, 'color' => '555555'], $tengah);
        }
        $sec->addTextBreak(1);

        $tabel = $sec->addTable(['cellMargin' => 30]);
        foreach ($dok['identitas'] as $label => $nilai) {
            $tabel->addRow();
            $tabel->addCell(3000)->addText($label);
            $tabel->addCell(300)->addText(':');
            $tabel->addCell(5800)->addText((string) $nilai);
        }

        foreach ($dok['bagian'] as $i => $bagian) {
            $sec->addTitle(chr(65 + $i).'. '.mb_strtoupper($bagian['judul']), 1);
            foreach ($bagian['butir'] as $butir) {
                if ($butir['label']) {
                    $sec->addText($butir['label'], ['bold' => true], ['spaceBefore' => 100, 'spaceAfter' => 40, 'keepNext' => true]);
                }
                match ($butir['tipe']) {
                    'html' => $this->htmlKeWord($sec, $butir['nilai']),
                    'daftar' => $this->daftarKeWord($sec, $butir['nilai']),
                    'cp' => $this->cpKeWord($sec, $butir['nilai']),
                    'pertemuan' => $this->pertemuanKeWord($sec, $butir['nilai']),
                };
            }
        }

        $sec->addTextBreak(1);
        $ttd = $sec->addTable();
        // Blok tanda tangan tidak boleh terpotong ke halaman berikutnya.
        $ttd->addRow(null, ['cantSplit' => true]);
        $kiri = $ttd->addCell(4700);
        $kanan = $ttd->addCell(4700);
        $kiri->addText('Mengetahui,');
        $kiri->addText('Kepala Sekolah', [], ['spaceAfter' => 900]);
        $kiri->addText($dok['kepala']['nama'] ?: '(.................................)', ['bold' => true, 'underline' => 'single']);
        $kiri->addText('NIP. '.($dok['kepala']['nip'] ?: '-'));
        $kanan->addText(trim(($dok['kota'] ? $dok['kota'].', ' : '').$dok['tanggal']));
        $kanan->addText('Guru Mata Pelajaran', [], ['spaceAfter' => 900]);
        $kanan->addText($dok['guru']['nama'] ?: '(.................................)', ['bold' => true, 'underline' => 'single']);
        $kanan->addText('NIP. '.($dok['guru']['nip'] ?: '-'));

        $path = tempnam(sys_get_temp_dir(), 'rpp').'.docx';
        IOFactory::createWriter($word, 'Word2007')->save($path);

        return $path;
    }

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

    private function cpKeWord(AbstractContainer $wadah, array $cp): void
    {
        foreach ($cp as $c) {
            $wadah->addText('Elemen: '.$c['elemen'], ['bold' => true], ['spaceBefore' => 60, 'keepNext' => true]);
            $wadah->addText((string) $c['deskripsi'], [], ['alignment' => Jc::BOTH]);
        }
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

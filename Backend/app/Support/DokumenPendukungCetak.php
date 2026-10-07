<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\DokumenPendukung;
use App\Models\Guru;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\SimpleType\Jc;
use Symfony\Component\HttpFoundation\Response;

/**
 * Mencetak dokumen pendukung (Silabus, Pemetaan ATP, Jurnal Harian) ke PDF
 * dan Word (.docx) berorientasi lanskap: identitas, tabel isian, catatan,
 * dan tanda tangan Kepala Sekolah serta guru.
 */
class DokumenPendukungCetak
{
    public function __construct(private DokumenPendukung $dokumen) {}

    public function respons(string $format): Response
    {
        if ($format === 'pdf') {
            return Pdf::loadView('dokumen-pendukung.dokumen', ['dok' => $this->isi()])
                ->setPaper('a4', 'landscape')
                // Font DejaVu (untuk tanda ✓) cukup disematkan sebagian supaya file kecil.
                ->setOption('isFontSubsettingEnabled', true)
                ->download($this->namaFile('pdf'));
        }

        return response()->download($this->docx(), $this->namaFile('docx'), [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend();
    }

    public function namaFile(string $ekstensi): string
    {
        $d = $this->dokumen;

        return Str::slug(implode(' ', array_filter([
            str_replace('_', ' ', $d->jenis), $d->mataPelajaran?->nama_mapel, $d->kelas?->nama_kelas, $d->semester,
        ]))).'.'.$ekstensi;
    }

    public function isi(): array
    {
        $d = $this->dokumen;
        $data = StrukturDokumenPendukung::bersihkan($d->jenis, $d->data ?? []);
        $guru = $d->guru;
        $kepala = Guru::whereHas('user.roles', fn ($q) => $q->where('name', 'Kepala Sekolah'))->first();
        $jenjang = strtoupper((string) tenant('jenjang'));
        $fase = StrukturPerangkatAjar::faseDariTingkat($d->kelas?->tingkat);
        $kolom = StrukturDokumenPendukung::kolomCetak($d->jenis, $data);

        return [
            'judul' => mb_strtoupper(StrukturDokumenPendukung::JENIS[$d->jenis]),
            'identitas' => array_filter([
                'Satuan Pendidikan' => tenant('nama_sekolah'),
                'Mata Pelajaran' => $d->mataPelajaran?->nama_mapel,
                'Kelas / Fase' => trim(($d->kelas?->nama_kelas ?? '-').($fase ? " / Fase {$fase}" : '')),
                'Semester' => ucfirst($d->semester),
                'Tahun Ajaran' => $d->tahunAjaran?->nama,
                'Guru' => $this->namaGuru($guru),
            ], fn ($v) => filled($v)),
            'pengantar' => $d->jenis === 'silabus' && $data['cp_umum'] !== '' ? ['Capaian Pembelajaran Fase', $data['cp_umum']] : null,
            'kolom' => $kolom,
            'lebar_persen' => $this->lebarKolom($kolom, 100),
            'baris' => StrukturDokumenPendukung::barisCetak($d->jenis, $data),
            // Kolom matriks pertemuan (P1, P2, …) dan kolom angka dicetak rata tengah.
            'tengah' => $this->kolomTengah($d->jenis, $data),
            'catatan' => $data['catatan'],
            'kota' => tenant('kabupaten_kota') ?: null,
            'tanggal' => now()->locale('id')->translatedFormat('j F Y'),
            'guru' => ['nama' => $this->namaGuru($guru), 'nip' => $guru?->nip, 'jabatan' => in_array($jenjang, ['SD', 'MI'], true) ? 'Guru Kelas' : 'Guru Mata Pelajaran'],
            'kepala' => ['nama' => $this->namaGuru($kepala), 'nip' => $kepala?->nip],
        ];
    }

    /** Menulis file .docx sementara dan mengembalikan path-nya. */
    public function docx(): string
    {
        $dok = $this->isi();
        Settings::setOutputEscapingEnabled(true);
        $word = new PhpWord;
        $word->setDefaultFontName('Times New Roman');
        $word->setDefaultFontSize(10);
        $word->setDefaultParagraphStyle(['spaceAfter' => 0, 'spacing' => 0]);
        $sec = $word->addSection([
            'orientation' => 'landscape',
            'marginTop' => 1000, 'marginBottom' => 1000, 'marginLeft' => 1000, 'marginRight' => 1000,
        ]);
        $lebarHalaman = 16838 - 2000;
        $tengah = ['alignment' => Jc::CENTER];

        $sec->addText($dok['judul'], ['bold' => true, 'size' => 14], $tengah);
        $sec->addTextBreak(1);
        $info = $sec->addTable(['cellMargin' => 20]);
        foreach ($dok['identitas'] as $label => $nilai) {
            $info->addRow();
            $info->addCell(2600)->addText($label);
            $info->addCell(300)->addText(':');
            $info->addCell(9000)->addText((string) $nilai, ['bold' => true]);
        }
        $sec->addTextBreak(1);

        if ($dok['pengantar']) {
            $sec->addText($dok['pengantar'][0], ['bold' => true]);
            $this->teksBaris($sec, $dok['pengantar'][1]);
            $sec->addTextBreak(1);
        }

        $lebar = $this->lebarKolom($dok['kolom'], $lebarHalaman);
        $t = $sec->addTable(['borderSize' => 6, 'borderColor' => '000000', 'cellMargin' => 50]);
        $t->addRow(null, ['tblHeader' => true, 'cantSplit' => true]);
        foreach ($dok['kolom'] as $i => [$label]) {
            $t->addCell((int) $lebar[$i], ['bgColor' => 'E8F3EE', 'valign' => 'center'])->addText($label, ['bold' => true], $tengah);
        }
        if (! $dok['baris']) {
            $t->addRow();
            $t->addCell($lebarHalaman, ['gridSpan' => count($dok['kolom'])])->addText('Belum ada isian.', ['italic' => true], $tengah);
        }
        foreach ($dok['baris'] as $baris) {
            $t->addRow(null, ['cantSplit' => true]);
            foreach ($baris as $i => $sel) {
                $this->teksBaris($t->addCell((int) $lebar[$i]), $sel, in_array($i, $dok['tengah'], true) ? $tengah : []);
            }
        }

        if ($dok['catatan'] !== '') {
            $sec->addTextBreak(1);
            $sec->addText('Catatan:', ['bold' => true]);
            $this->teksBaris($sec, $dok['catatan']);
        }

        $sec->addTextBreak(1);
        $ttd = $sec->addTable();
        $ttd->addRow(null, ['cantSplit' => true]);
        $kiri = $ttd->addCell($lebarHalaman / 2);
        $kanan = $ttd->addCell($lebarHalaman / 2);
        $kiri->addText('', [], $tengah);
        $kiri->addText('Mengetahui,', [], $tengah);
        $kiri->addText('Kepala Sekolah', [], $tengah + ['spaceAfter' => 900]);
        $kiri->addText($dok['kepala']['nama'] ?: '(.................................)', ['bold' => true, 'underline' => 'single'], $tengah);
        $kiri->addText('NIP. '.($dok['kepala']['nip'] ?: '-'), [], $tengah);
        $kanan->addText(trim(($dok['kota'] ? $dok['kota'].', ' : '').$dok['tanggal']), [], $tengah);
        $kanan->addText('', [], $tengah);
        $kanan->addText($dok['guru']['jabatan'], [], $tengah + ['spaceAfter' => 900]);
        $kanan->addText($dok['guru']['nama'] ?: '(.................................)', ['bold' => true, 'underline' => 'single'], $tengah);
        $kanan->addText('NIP. '.($dok['guru']['nip'] ?: '-'), [], $tengah);

        $path = tempnam(sys_get_temp_dir(), 'dok').'.docx';
        IOFactory::createWriter($word, 'Word2007')->save($path);

        return $path;
    }

    /**
     * Lebar tiap kolom (twip untuk Word, persen untuk PDF): kolom berbobot 0
     * (matriks pertemuan) berbagi sisa lebar secara rata.
     */
    public function lebarKolom(array $kolom, float $total): array
    {
        $bobot = array_column($kolom, 1);
        $tetap = array_sum($bobot);
        $nol = count(array_filter($bobot, fn ($b) => $b === 0));
        $sisa = $nol ? max(100 - $tetap, 2 * $nol) / $nol : 0;
        $skala = $total / ($tetap + $sisa * $nol);

        return array_map(fn ($b) => round(($b ?: $sisa) * $skala, 2), $bobot);
    }

    private function kolomTengah(string $jenis, array $data): array
    {
        return match ($jenis) {
            'silabus' => [0, 7],
            'pemetaan_atp' => array_merge([0, 4], range(5, 4 + (int) ($data['jumlah_pertemuan'] ?? 1))),
            'jurnal' => [0, 2, 7],
        };
    }

    private function teksBaris($wadah, string $teks, array $paragraf = []): void
    {
        $baris = explode("\n", $teks);
        foreach ($baris as $b) {
            $wadah->addText($b, [], $paragraf);
        }
    }

    private function namaGuru(?Guru $guru): ?string
    {
        return $guru ? (implode(', ', array_filter([$guru->nama, $guru->gelar])) ?: null) : null;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PeminjamanItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PerpusLaporanController extends Controller
{
    private function query(Request $request)
    {
        $in = $request->validate([
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date'],
            'jenis_anggota' => ['nullable', 'in:siswa,guru,pegawai'],
            'kelas_id' => ['nullable', 'integer'],
            'kategori' => ['nullable', 'string'],
            'status' => ['nullable', 'in:dipinjam,dikembalikan,hilang'],
        ]);

        return [$in, PeminjamanItem::with(['peminjaman.anggota.siswa.kelas', 'peminjaman.anggota.guru', 'peminjaman.anggota.user', 'eksemplar.buku'])
            ->when(! empty($in['tanggal_mulai']), fn ($q) => $q->whereHas('peminjaman', fn ($p) => $p->whereDate('tanggal_pinjam', '>=', $in['tanggal_mulai'])))
            ->when(! empty($in['tanggal_selesai']), fn ($q) => $q->whereHas('peminjaman', fn ($p) => $p->whereDate('tanggal_pinjam', '<=', $in['tanggal_selesai'])))
            ->when(! empty($in['jenis_anggota']), fn ($q) => $q->whereHas('peminjaman.anggota', fn ($a) => $a->where('jenis_anggota', $in['jenis_anggota'])))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->whereHas('peminjaman.anggota.siswa', fn ($s) => $s->where('kelas_id', $in['kelas_id'])))
            ->when(! empty($in['kategori']), fn ($q) => $q->whereHas('eksemplar.buku', fn ($b) => $b->where('kategori', $in['kategori'])))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderByDesc('created_at')];
    }

    private function baris(PeminjamanItem $i): array
    {
        return [
            'nomor_transaksi' => $i->peminjaman->nomor_transaksi,
            'anggota' => $i->peminjaman->anggota?->nama,
            'jenis_anggota' => $i->peminjaman->anggota?->jenis_anggota,
            'kelas_unit' => $i->peminjaman->anggota?->kelas_unit,
            'judul_buku' => $i->eksemplar->buku->judul,
            'kode_inventaris' => $i->eksemplar->kode_inventaris,
            'tanggal_pinjam' => $i->peminjaman->tanggal_pinjam->format('Y-m-d'),
            'tanggal_jatuh_tempo' => $i->peminjaman->tanggal_jatuh_tempo->format('Y-m-d'),
            'tanggal_kembali' => $i->tanggal_kembali_aktual ? $i->tanggal_kembali_aktual->format('Y-m-d') : null,
            'status' => $i->status,
        ];
    }

    public function index(Request $request)
    {
        [, $query] = $this->query($request);
        $item = $query->paginate($request->integer('per_page', 15));
        $item->getCollection()->transform(fn (PeminjamanItem $i) => $this->baris($i));

        return response()->json($item);
    }

    public function export(Request $request): StreamedResponse
    {
        [, $query] = $this->query($request);
        $baris = $query->get()->map(fn (PeminjamanItem $i) => $this->baris($i));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Perpustakaan');
        $header = ['No', 'Nomor Transaksi', 'Anggota', 'Jenis', 'Kelas/Unit', 'Judul Buku', 'Kode Inventaris', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Status'];
        $sheet->fromArray($header, null, 'A1');
        $sheet->getStyle('A1:K1')->getFont()->setBold(true);
        $sheet->fromArray(
            $baris->values()->map(fn (array $b, int $i) => [
                $i + 1, $b['nomor_transaksi'], $b['anggota'], ucfirst((string) $b['jenis_anggota']), $b['kelas_unit'],
                $b['judul_buku'], $b['kode_inventaris'], $b['tanggal_pinjam'], $b['tanggal_jatuh_tempo'], $b['tanggal_kembali'] ?? '-', ucfirst($b['status']),
            ])->all(),
            null,
            'A2'
        );
        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'laporan-perpustakaan-'.now()->format('Y-m-d').'.xlsx';

        return response()->streamDownload(fn () => $writer->save('php://output'), $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function pdf(Request $request): Response
    {
        [$in, $query] = $this->query($request);
        $baris = $query->limit(500)->get()->map(fn (PeminjamanItem $i) => $this->baris($i));

        return Pdf::loadView('perpustakaan.laporan', [
            'sekolah' => tenant()->nama_sekolah ?: 'Sekolah',
            'baris' => $baris,
            'filter' => $in,
        ])->setPaper('a4', 'landscape')->download('laporan-perpustakaan-'.now()->format('Y-m-d').'.pdf');
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanLab;
use App\Models\BahanLabMutasi;
use App\Models\Inventaris;
use App\Models\KegiatanLab;
use App\Models\Laboratorium;
use App\Models\PemeliharaanAlat;
use App\Models\PeminjamanAlat;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LabLaporanController extends Controller
{
    private const JENIS = ['laboratorium', 'inventaris', 'peminjaman', 'pemeliharaan', 'persediaan', 'kegiatan'];

    private function data(string $jenis, Request $request): array
    {
        abort_unless(in_array($jenis, self::JENIS, true), 404);

        return match ($jenis) {
            'laboratorium' => $this->laboratorium(),
            'inventaris' => $this->inventaris($request),
            'peminjaman' => $this->peminjaman($request),
            'pemeliharaan' => $this->pemeliharaan($request),
            'persediaan' => $this->persediaan($request),
            'kegiatan' => $this->kegiatan($request),
        };
    }

    private function laboratorium(): array
    {
        $header = ['Nama Lab', 'Kategori', 'Kapasitas', 'Penanggung Jawab', 'Jumlah Alat', 'Status'];
        $baris = Laboratorium::withCount('peralatan')->with('penanggungJawab:id,nama')->orderBy('nama')->get()
            ->map(fn (Laboratorium $l) => [$l->nama, $l->kategori ?? '-', $l->kapasitas ?? '-', $l->penanggungJawab?->nama ?? '-', $l->peralatan_count, ucfirst($l->status)]);

        return [$header, $baris];
    }

    private function inventaris(Request $request): array
    {
        $in = $request->validate(['laboratorium_id' => ['nullable', 'integer']]);
        $header = ['Nama Alat', 'Kategori', 'Lab', 'Jumlah', 'Kondisi', 'Harga Satuan', 'Nilai Total', 'Status'];
        $baris = Inventaris::whereNotNull('laboratorium_id')
            ->when(! empty($in['laboratorium_id']), fn ($q) => $q->where('laboratorium_id', $in['laboratorium_id']))
            ->with('laboratorium:id,nama')->orderBy('nama_barang')->get()
            ->map(fn (Inventaris $i) => [
                $i->nama_barang, $i->kategori ?? '-', $i->laboratorium?->nama ?? '-', $i->jumlah,
                ucfirst(str_replace('_', ' ', $i->kondisi_lab ?: $i->kondisi)), (float) $i->harga, (float) $i->harga * $i->jumlah, ucfirst($i->status),
            ]);

        return [$header, $baris];
    }

    private function peminjaman(Request $request): array
    {
        $in = $request->validate(['tanggal_mulai' => ['nullable', 'date'], 'tanggal_selesai' => ['nullable', 'date'], 'status' => ['nullable', 'string']]);
        $header = ['Nomor Transaksi', 'Peminjam', 'Jabatan/Kelas', 'Tanggal Pinjam', 'Rencana Kembali', 'Kembali Aktual', 'Status', 'Keterlambatan (hari)'];
        $baris = PeminjamanAlat::with('peminjam:id,name')
            ->when(! empty($in['tanggal_mulai']), fn ($q) => $q->whereDate('tanggal_pinjam', '>=', $in['tanggal_mulai']))
            ->when(! empty($in['tanggal_selesai']), fn ($q) => $q->whereDate('tanggal_pinjam', '<=', $in['tanggal_selesai']))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderByDesc('tanggal_pinjam')->get()
            ->map(function (PeminjamanAlat $p) {
                $rencana = Carbon::parse($p->tanggal_kembali_rencana);
                $akhir = $p->tanggal_kembali_aktual ? Carbon::parse($p->tanggal_kembali_aktual) : Carbon::today();
                $terlambat = $akhir->gt($rencana) ? $rencana->diffInDays($akhir) : 0;

                return [
                    $p->nomor_transaksi, $p->peminjam?->name ?? '-', $p->jabatan_kelas ?? '-',
                    $p->tanggal_pinjam->format('Y-m-d'), $p->tanggal_kembali_rencana->format('Y-m-d'), $p->tanggal_kembali_aktual ? $p->tanggal_kembali_aktual->format('Y-m-d') : '-',
                    ucfirst($p->status), $terlambat,
                ];
            });

        return [$header, $baris];
    }

    private function pemeliharaan(Request $request): array
    {
        $in = $request->validate(['tanggal_mulai' => ['nullable', 'date'], 'tanggal_selesai' => ['nullable', 'date']]);
        $header = ['Alat', 'Jenis', 'Tanggal', 'Teknisi', 'Biaya', 'Tanggal Berikutnya'];
        $baris = PemeliharaanAlat::with('inventaris:id,nama_barang')
            ->when(! empty($in['tanggal_mulai']), fn ($q) => $q->whereDate('tanggal', '>=', $in['tanggal_mulai']))
            ->when(! empty($in['tanggal_selesai']), fn ($q) => $q->whereDate('tanggal', '<=', $in['tanggal_selesai']))
            ->orderByDesc('tanggal')->get()
            ->map(fn (PemeliharaanAlat $p) => [
                $p->inventaris?->nama_barang ?? '-', ucfirst(str_replace('_', ' ', $p->jenis_pemeliharaan)), $p->tanggal->format('Y-m-d'),
                $p->teknisi ?? '-', (float) $p->biaya, $p->tanggal_berikutnya ? $p->tanggal_berikutnya->format('Y-m-d') : '-',
            ]);

        return [$header, $baris];
    }

    private function persediaan(Request $request): array
    {
        $in = $request->validate(['tanggal_mulai' => ['nullable', 'date'], 'tanggal_selesai' => ['nullable', 'date']]);
        $awal = $in['tanggal_mulai'] ?? now()->startOfMonth()->toDateString();
        $akhir = $in['tanggal_selesai'] ?? now()->toDateString();

        $header = ['Nama Bahan', 'Stok Awal', 'Masuk', 'Keluar', 'Stok Akhir', 'Status'];
        $baris = BahanLab::orderBy('nama_bahan')->get()->map(function (BahanLab $b) use ($awal, $akhir) {
            $mutasiPeriode = BahanLabMutasi::where('bahan_id', $b->id)->whereDate('tanggal', '>=', $awal)->whereDate('tanggal', '<=', $akhir);
            $masuk = (clone $mutasiPeriode)->where('jenis', 'masuk')->sum('jumlah');
            $keluar = (clone $mutasiPeriode)->where('jenis', 'keluar')->sum('jumlah');
            $stokAwal = $b->jumlah_stok - $masuk + $keluar;

            return [
                $b->nama_bahan, (float) $stokAwal, (float) $masuk, (float) $keluar, (float) $b->jumlah_stok,
                $b->jumlah_stok <= $b->stok_minimum ? 'Hampir Habis' : 'Aman',
            ];
        });

        return [$header, $baris];
    }

    private function kegiatan(Request $request): array
    {
        $in = $request->validate(['laboratorium_id' => ['nullable', 'integer'], 'kelas_id' => ['nullable', 'integer'], 'tanggal_mulai' => ['nullable', 'date'], 'tanggal_selesai' => ['nullable', 'date']]);
        $header = ['Nama Kegiatan', 'Laboratorium', 'Kelas', 'Tanggal', 'Penanggung Jawab', 'Status'];
        $baris = KegiatanLab::with(['laboratorium:id,nama', 'kelas:id,nama_kelas'])
            ->when(! empty($in['laboratorium_id']), fn ($q) => $q->where('laboratorium_id', $in['laboratorium_id']))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->where('kelas_id', $in['kelas_id']))
            ->when(! empty($in['tanggal_mulai']), fn ($q) => $q->whereDate('tanggal', '>=', $in['tanggal_mulai']))
            ->when(! empty($in['tanggal_selesai']), fn ($q) => $q->whereDate('tanggal', '<=', $in['tanggal_selesai']))
            ->orderByDesc('tanggal')->get()
            ->map(fn (KegiatanLab $k) => [$k->nama_kegiatan, $k->laboratorium?->nama ?? '-', $k->kelas?->nama_kelas ?? $k->peserta_lainnya ?? '-', $k->tanggal->format('Y-m-d'), $k->penanggung_jawab ?? '-', ucfirst($k->status)]);

        return [$header, $baris];
    }

    public function index(Request $request, string $jenis): JsonResponse
    {
        [$header, $baris] = $this->data($jenis, $request);

        return response()->json(['header' => $header, 'data' => $baris->values()]);
    }

    public function export(Request $request, string $jenis): StreamedResponse
    {
        [$header, $baris] = $this->data($jenis, $request);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan '.ucfirst($jenis));
        $sheet->fromArray($header, null, 'A1');
        $sheet->getStyle('A1:'.chr(64 + count($header)).'1')->getFont()->setBold(true);
        $sheet->fromArray($baris->values()->all(), null, 'A2');
        foreach (range('A', chr(64 + count($header))) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = "laporan-lab-{$jenis}-".now()->format('Y-m-d').'.xlsx';

        return response()->streamDownload(fn () => $writer->save('php://output'), $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function pdf(Request $request, string $jenis): Response
    {
        [$header, $baris] = $this->data($jenis, $request);

        return Pdf::loadView('laboratorium.laporan', [
            'sekolah' => tenant()->nama_sekolah ?: 'Sekolah',
            'judul' => 'Laporan '.ucfirst($jenis).' Laboratorium',
            'header' => $header,
            'baris' => $baris,
        ])->setPaper('a4', 'landscape')->download("laporan-lab-{$jenis}-".now()->format('Y-m-d').'.pdf');
    }
}

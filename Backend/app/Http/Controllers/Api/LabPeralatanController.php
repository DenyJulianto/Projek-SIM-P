<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventaris;
use App\Models\Laboratorium;
use App\Models\PeminjamanAlatItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LabPeralatanController extends Controller
{
    private const KONDISI = ['baik', 'rusak_ringan', 'rusak_berat', 'dalam_perbaikan', 'hilang', 'tidak_layak'];

    public function opsi(): JsonResponse
    {
        return response()->json([
            'kategori' => Inventaris::whereNotNull('laboratorium_id')->whereNotNull('kategori')->distinct()->orderBy('kategori')->pluck('kategori'),
            'laboratorium' => Laboratorium::where('status', 'aktif')->orderBy('nama')->get(['id', 'nama']),
            'kondisi' => self::KONDISI,
        ]);
    }

    /** Petakan 6 nilai kondisi versi lab ke 3 nilai legacy kolom `kondisi` agar tampilan Sarpras umum tetap konsisten. */
    private function legacyKondisi(string $kondisiLab): string
    {
        return match ($kondisiLab) {
            'baik' => 'baik',
            'rusak_ringan', 'dalam_perbaikan' => 'rusak_ringan',
            default => 'rusak_berat',
        };
    }

    private function dipinjamMap(iterable $ids): \Illuminate\Support\Collection
    {
        return PeminjamanAlatItem::whereIn('inventaris_id', collect($ids)->all())
            ->whereHas('peminjaman', fn ($q) => $q->whereIn('status', ['disetujui', 'dipinjam', 'terlambat']))
            ->selectRaw('inventaris_id, sum(jumlah) as total')
            ->groupBy('inventaris_id')
            ->pluck('total', 'inventaris_id');
    }

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'laboratorium_id' => ['nullable', 'integer'],
            'kategori' => ['nullable', 'string'],
            'kondisi' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $peralatan = Inventaris::whereNotNull('laboratorium_id')
            ->with('laboratorium:id,nama')
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w
                ->where('nama_barang', 'like', "%{$in['search']}%")
                ->orWhere('kode_barang', 'like', "%{$in['search']}%")
                ->orWhere('barcode', 'like', "%{$in['search']}%")))
            ->when(! empty($in['laboratorium_id']), fn ($q) => $q->where('laboratorium_id', $in['laboratorium_id']))
            ->when(! empty($in['kategori']), fn ($q) => $q->where('kategori', $in['kategori']))
            ->when(! empty($in['kondisi']), fn ($q) => $q->where(fn ($w) => $w->where('kondisi_lab', $in['kondisi'])->orWhere(fn ($x) => $x->whereNull('kondisi_lab')->where('kondisi', $in['kondisi']))))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderBy('nama_barang')
            ->paginate($in['per_page'] ?? 15);

        $dipinjam = $this->dipinjamMap($peralatan->pluck('id'));
        $peralatan->getCollection()->transform(function (Inventaris $i) use ($dipinjam) {
            $i->jumlah_dipinjam = (int) ($dipinjam[$i->id] ?? 0);
            $i->jumlah_tersedia = max(0, $i->jumlah - $i->jumlah_dipinjam);

            return $i;
        });

        return response()->json($peralatan);
    }

    private function rules(): array
    {
        return [
            'kode_barang' => ['nullable', 'string', 'max:30', 'unique:inventaris,kode_barang'],
            'nama_barang' => ['required', 'string', 'max:255'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'merk' => ['nullable', 'string', 'max:255'],
            'tipe_model' => ['nullable', 'string', 'max:255'],
            'nomor_seri' => ['nullable', 'string', 'max:100'],
            'tahun_pengadaan' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'sumber_dana' => ['nullable', 'string', 'max:255'],
            'jumlah' => ['required', 'integer', 'min:1'],
            'satuan' => ['nullable', 'string', 'max:30'],
            'laboratorium_id' => ['required', 'integer', 'exists:laboratorium,id'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'kondisi_lab' => ['nullable', 'in:'.implode(',', self::KONDISI)],
            'harga' => ['nullable', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['barcode'] = (string) random_int(1000000000000, 9999999999999);
        while (Inventaris::where('barcode', $data['barcode'])->exists()) {
            $data['barcode'] = (string) random_int(1000000000000, 9999999999999);
        }
        $data['kondisi'] = $this->legacyKondisi($data['kondisi_lab'] ?? 'baik');

        $inventaris = Inventaris::create($data);
        $inventaris->riwayat()->create([
            'user_id' => $request->user()->id,
            'jenis' => 'pengadaan',
            'tanggal' => now()->toDateString(),
            'keterangan' => 'Pengadaan awal peralatan laboratorium.',
        ]);

        return response()->json($inventaris->load('laboratorium'), 201);
    }

    public function show(Inventaris $peralatan): JsonResponse
    {
        $peralatan->load(['laboratorium', 'riwayat.user:id,name', 'pemeliharaan']);
        $dipinjam = $this->dipinjamMap([$peralatan->id]);
        $peralatan->jumlah_dipinjam = (int) ($dipinjam[$peralatan->id] ?? 0);
        $peralatan->jumlah_tersedia = max(0, $peralatan->jumlah - $peralatan->jumlah_dipinjam);

        return response()->json($peralatan);
    }

    public function update(Request $request, Inventaris $peralatan): JsonResponse
    {
        $rules = $this->rules();
        $rules['kode_barang'] = ['nullable', 'string', 'max:30', 'unique:inventaris,kode_barang,'.$peralatan->id];
        $rules['nama_barang'] = ['sometimes', 'string', 'max:255'];
        $rules['jumlah'] = ['sometimes', 'integer', 'min:1'];
        $rules['laboratorium_id'] = ['sometimes', 'integer', 'exists:laboratorium,id'];
        $data = $request->validate($rules);

        if (array_key_exists('kondisi_lab', $data)) {
            $data['kondisi'] = $this->legacyKondisi($data['kondisi_lab']);
        }

        $peralatan->update($data);

        return response()->json($peralatan->load('laboratorium'));
    }

    public function destroy(Inventaris $peralatan): JsonResponse
    {
        $peralatan->update(['status' => 'nonaktif']);

        return response()->json(['message' => 'Peralatan dinonaktifkan.']);
    }

    public function tambahJumlah(Request $request, Inventaris $peralatan): JsonResponse
    {
        $in = $request->validate(['jumlah' => ['required', 'integer', 'min:1'], 'keterangan' => ['nullable', 'string']]);
        $peralatan->increment('jumlah', $in['jumlah']);
        $peralatan->riwayat()->create([
            'user_id' => $request->user()->id,
            'jenis' => 'pengadaan',
            'tanggal' => now()->toDateString(),
            'keterangan' => $in['keterangan'] ?? "Penambahan {$in['jumlah']} unit.",
        ]);

        return response()->json($peralatan->fresh());
    }

    public function kurangiJumlah(Request $request, Inventaris $peralatan): JsonResponse
    {
        $in = $request->validate(['jumlah' => ['required', 'integer', 'min:1'], 'keterangan' => ['nullable', 'string']]);
        abort_if($in['jumlah'] > $peralatan->jumlah, 422, 'Jumlah pengurangan melebihi stok yang ada.');
        $peralatan->decrement('jumlah', $in['jumlah']);
        $peralatan->riwayat()->create([
            'user_id' => $request->user()->id,
            'jenis' => 'perbaikan',
            'tanggal' => now()->toDateString(),
            'keterangan' => $in['keterangan'] ?? "Pengurangan {$in['jumlah']} unit.",
        ]);

        return response()->json($peralatan->fresh());
    }

    public function mutasi(Request $request, Inventaris $peralatan): JsonResponse
    {
        $in = $request->validate([
            'laboratorium_id' => ['nullable', 'integer', 'exists:laboratorium,id'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
        ]);
        $sebelum = "{$peralatan->laboratorium?->nama} — {$peralatan->lokasi}";
        $peralatan->update(array_filter($in, fn ($v, $k) => $k !== 'keterangan', ARRAY_FILTER_USE_BOTH));
        $peralatan->refresh();
        $peralatan->riwayat()->create([
            'user_id' => $request->user()->id,
            'jenis' => 'pemeliharaan',
            'tanggal' => now()->toDateString(),
            'keterangan' => $in['keterangan'] ?? "Mutasi lokasi dari {$sebelum} ke {$peralatan->laboratorium?->nama} — {$peralatan->lokasi}.",
        ]);

        return response()->json($peralatan->load('laboratorium'));
    }

    public function cetakBarcode(Request $request): Response
    {
        $in = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer']]);
        $peralatan = Inventaris::whereIn('id', $in['ids'])->get();

        return Pdf::loadView('laboratorium.barcode', ['peralatan' => $peralatan])->setPaper('a4', 'portrait')->download('label-barcode-alat.pdf');
    }

    public function export(): StreamedResponse
    {
        $peralatan = Inventaris::whereNotNull('laboratorium_id')->with('laboratorium:id,nama')->orderBy('nama_barang')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Peralatan Laboratorium');
        $sheet->fromArray(['No', 'Kode Inventaris', 'Nama Alat', 'Kategori', 'Merk', 'Tipe/Model', 'Lab', 'Jumlah', 'Kondisi', 'Harga', 'Status'], null, 'A1');
        $sheet->getStyle('A1:K1')->getFont()->setBold(true);
        $sheet->fromArray(
            $peralatan->values()->map(fn (Inventaris $i, int $n) => [
                $n + 1, $i->kode_barang, $i->nama_barang, $i->kategori, $i->merk, $i->tipe_model,
                $i->laboratorium?->nama, $i->jumlah, ucfirst(str_replace('_', ' ', $i->kondisi_lab ?: $i->kondisi)), $i->harga, ucfirst($i->status),
            ])->all(),
            null,
            'A2'
        );
        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'peralatan-laboratorium-'.now()->format('Y-m-d').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import Peralatan');
        $sheet->fromArray(['Nama Alat', 'Kategori', 'Merk', 'Tipe/Model', 'ID Laboratorium', 'Jumlah', 'Satuan', 'Lokasi/Rak'], null, 'A1');
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);
        $sheet->fromArray([['Mikroskop', 'Optik', 'Olympus', 'CX23', 1, 5, 'unit', 'Rak A']], null, 'A2');
        foreach (range('A', 'H') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'template-import-peralatan-lab.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120']]);
        $rows = IOFactory::load($request->file('file')->getRealPath())->getActiveSheet()->toArray(null, true, true, false);
        array_shift($rows);
        abort_if(count($rows) > 1000, 422, 'Maksimal 1000 baris per file.');

        $masuk = 0;
        foreach ($rows as $row) {
            $nama = trim((string) ($row[0] ?? ''));
            $labId = is_numeric($row[4] ?? null) ? (int) $row[4] : null;
            if ($nama === '' || ! $labId || ! Laboratorium::where('id', $labId)->exists()) {
                continue;
            }

            $barcode = (string) random_int(1000000000000, 9999999999999);
            while (Inventaris::where('barcode', $barcode)->exists()) {
                $barcode = (string) random_int(1000000000000, 9999999999999);
            }

            Inventaris::create([
                'nama_barang' => $nama,
                'kategori' => trim((string) ($row[1] ?? '')) ?: null,
                'merk' => trim((string) ($row[2] ?? '')) ?: null,
                'tipe_model' => trim((string) ($row[3] ?? '')) ?: null,
                'laboratorium_id' => $labId,
                'jumlah' => max(1, (int) ($row[5] ?? 1)),
                'satuan' => trim((string) ($row[6] ?? '')) ?: 'unit',
                'lokasi' => trim((string) ($row[7] ?? '')) ?: null,
                'barcode' => $barcode,
            ]);
            $masuk++;
        }

        return response()->json(['masuk' => $masuk]);
    }
}

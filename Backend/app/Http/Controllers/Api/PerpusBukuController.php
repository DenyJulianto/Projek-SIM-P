<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Buku;
use App\Models\EksemplarBuku;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PerpusBukuController extends Controller
{
    public function opsi(): JsonResponse
    {
        return response()->json([
            'kategori' => Buku::whereNotNull('kategori')->distinct()->orderBy('kategori')->pluck('kategori'),
            'penerbit' => Buku::whereNotNull('penerbit')->distinct()->orderBy('penerbit')->pluck('penerbit'),
            'tahun_terbit' => Buku::whereNotNull('tahun_terbit')->distinct()->orderByDesc('tahun_terbit')->pluck('tahun_terbit'),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'kategori' => ['nullable', 'string'],
            'penerbit' => ['nullable', 'string'],
            'tahun_terbit' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $buku = Buku::withCount('eksemplar')
            ->withCount(['eksemplar as eksemplar_tersedia_count' => fn ($q) => $q->where('status', 'tersedia')])
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w
                ->where('judul', 'like', "%{$in['search']}%")
                ->orWhere('penulis', 'like', "%{$in['search']}%")
                ->orWhere('isbn', 'like', "%{$in['search']}%")))
            ->when(! empty($in['kategori']), fn ($q) => $q->where('kategori', $in['kategori']))
            ->when(! empty($in['penerbit']), fn ($q) => $q->where('penerbit', $in['penerbit']))
            ->when(! empty($in['tahun_terbit']), fn ($q) => $q->where('tahun_terbit', $in['tahun_terbit']))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderBy('judul')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($buku);
    }

    private function rules(): array
    {
        return [
            'isbn' => ['nullable', 'string', 'max:20'],
            'judul' => ['required', 'string', 'max:255'],
            'penulis' => ['nullable', 'string', 'max:255'],
            'penerbit' => ['nullable', 'string', 'max:255'],
            'tahun_terbit' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'subjek' => ['nullable', 'string', 'max:150'],
            'bahasa' => ['nullable', 'string', 'max:50'],
            'edisi' => ['nullable', 'string', 'max:50'],
            'sinopsis' => ['nullable', 'string'],
            'lokasi_rak' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'jumlah_eksemplar_awal' => ['nullable', 'integer', 'min:0', 'max:200'],
            'cover' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        if ($request->hasFile('cover')) {
            $data['cover_path'] = $request->file('cover')->store('perpustakaan/cover', 'public');
        }

        $jumlahAwal = (int) ($data['jumlah_eksemplar_awal'] ?? 0);
        unset($data['jumlah_eksemplar_awal'], $data['cover']);

        $buku = Buku::create([...$data, 'dibuat_oleh' => $request->user()->id]);

        for ($i = 1; $i <= $jumlahAwal; $i++) {
            $this->buatEksemplar($buku, $i);
        }

        activity()->performedOn($buku)->causedBy($request->user())->log("Menambahkan buku \"{$buku->judul}\".");

        return response()->json($buku->load('eksemplar'), 201);
    }

    public function show(Buku $buku): JsonResponse
    {
        return response()->json($buku->load(['eksemplar' => fn ($q) => $q->orderBy('nomor_eksemplar')]));
    }

    public function update(Request $request, Buku $buku): JsonResponse
    {
        $rules = $this->rules();
        $rules['judul'] = ['sometimes', 'string', 'max:255'];
        unset($rules['jumlah_eksemplar_awal']);
        $data = $request->validate($rules);

        if ($request->hasFile('cover')) {
            $data['cover_path'] = $request->file('cover')->store('perpustakaan/cover', 'public');
        }
        unset($data['cover']);

        $buku->update($data);

        activity()->performedOn($buku)->causedBy($request->user())->log("Memperbarui data buku \"{$buku->judul}\".");

        return response()->json($buku);
    }

    public function destroy(Request $request, Buku $buku): JsonResponse
    {
        $buku->update(['status' => 'nonaktif']);

        activity()->performedOn($buku)->causedBy($request->user())->log("Menonaktifkan buku \"{$buku->judul}\".");

        return response()->json(['message' => 'Buku dinonaktifkan.']);
    }

    public function riwayat(Buku $buku): JsonResponse
    {
        $riwayat = Activity::where('subject_type', Buku::class)
            ->where('subject_id', $buku->id)
            ->with('causer:id,name')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (Activity $a) => [
                'waktu' => $a->created_at,
                'pengguna' => $a->causer?->name ?? 'Sistem',
                'keterangan' => $a->description,
            ]);

        return response()->json($riwayat);
    }

    private function buatEksemplar(Buku $buku, ?int $nomor = null): EksemplarBuku
    {
        $nomor ??= (int) ($buku->eksemplar()->max('nomor_eksemplar') ?? 0) + 1;
        $kodeInventaris = 'BK-'.str_pad((string) $buku->id, 4, '0', STR_PAD_LEFT).'-'.str_pad((string) $nomor, 3, '0', STR_PAD_LEFT);

        do {
            $barcode = (string) random_int(1000000000000, 9999999999999);
        } while (EksemplarBuku::where('barcode', $barcode)->exists());

        return $buku->eksemplar()->create([
            'kode_inventaris' => $kodeInventaris,
            'barcode' => $barcode,
            'nomor_eksemplar' => $nomor,
        ]);
    }

    public function storeEksemplar(Request $request, Buku $buku): JsonResponse
    {
        $in = $request->validate(['jumlah' => ['required', 'integer', 'min:1', 'max:200']]);

        $awal = (int) ($buku->eksemplar()->max('nomor_eksemplar') ?? 0);
        $baru = collect();
        for ($i = 1; $i <= $in['jumlah']; $i++) {
            $baru->push($this->buatEksemplar($buku, $awal + $i));
        }

        activity()->performedOn($buku)->causedBy($request->user())->log("Menambahkan {$in['jumlah']} eksemplar untuk \"{$buku->judul}\".");

        return response()->json($baru, 201);
    }

    public function updateEksemplar(Request $request, EksemplarBuku $eksemplar): JsonResponse
    {
        $data = $request->validate([
            'kondisi' => ['sometimes', 'in:baik,rusak_ringan,rusak_berat,hilang'],
            'lokasi' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'in:tersedia,dipinjam,rusak,hilang,nonaktif'],
        ]);

        $eksemplar->update($data);

        activity()->performedOn($eksemplar->buku)->causedBy($request->user())
            ->log("Memperbarui eksemplar {$eksemplar->kode_inventaris}.");

        return response()->json($eksemplar);
    }

    public function destroyEksemplar(Request $request, EksemplarBuku $eksemplar): JsonResponse
    {
        abort_if($eksemplar->status === 'dipinjam', 422, 'Eksemplar sedang dipinjam dan tidak dapat dihapus.');

        $buku = $eksemplar->buku;
        $kode = $eksemplar->kode_inventaris;
        $eksemplar->delete();

        activity()->performedOn($buku)->causedBy($request->user())->log("Menghapus eksemplar {$kode}.");

        return response()->json(['message' => 'Eksemplar berhasil dihapus.']);
    }

    public function cetakBarcode(Request $request): Response
    {
        $in = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer']]);
        $eksemplar = EksemplarBuku::with('buku')->whereIn('id', $in['ids'])->get();

        return Pdf::loadView('perpustakaan.barcode', ['eksemplar' => $eksemplar])
            ->setPaper('a4', 'portrait')
            ->download('label-barcode-buku.pdf');
    }

    public function export(): StreamedResponse
    {
        $buku = Buku::withCount('eksemplar')->orderBy('judul')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Koleksi Buku');
        $header = ['No', 'ISBN', 'Judul', 'Penulis', 'Penerbit', 'Tahun', 'Kategori', 'Bahasa', 'Jumlah Eksemplar', 'Status'];
        $sheet->fromArray($header, null, 'A1');
        $sheet->getStyle('A1:J1')->getFont()->setBold(true);
        $sheet->fromArray(
            $buku->values()->map(fn (Buku $b, int $i) => [
                $i + 1, $b->isbn, $b->judul, $b->penulis, $b->penerbit, $b->tahun_terbit,
                $b->kategori, $b->bahasa, $b->eksemplar_count, ucfirst($b->status),
            ])->all(),
            null,
            'A2'
        );
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'koleksi-buku-'.now()->format('Y-m-d').'.xlsx';

        return response()->streamDownload(fn () => $writer->save('php://output'), $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import Buku');
        $sheet->fromArray(['ISBN', 'Judul', 'Penulis', 'Penerbit', 'Tahun Terbit', 'Kategori', 'Bahasa', 'Lokasi Rak', 'Jumlah Eksemplar'], null, 'A1');
        $sheet->getStyle('A1:I1')->getFont()->setBold(true);
        $sheet->fromArray([['9780000000000', 'Contoh Judul Buku', 'Nama Penulis', 'Nama Penerbit', 2024, 'Fiksi', 'Indonesia', 'Rak A1', 3]], null, 'A2');
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'template-import-buku.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120']]);

        $rows = IOFactory::load($request->file('file')->getRealPath())
            ->getActiveSheet()
            ->toArray(null, true, true, false);
        array_shift($rows);

        abort_if(count($rows) > 1000, 422, 'Maksimal 1000 baris per file.');

        $masuk = 0;
        $errors = [];
        foreach ($rows as $i => $row) {
            $line = $i + 2;
            $judul = trim((string) ($row[1] ?? ''));
            if ($judul === '') {
                continue;
            }

            $buku = Buku::create([
                'isbn' => trim((string) ($row[0] ?? '')) ?: null,
                'judul' => $judul,
                'penulis' => trim((string) ($row[2] ?? '')) ?: null,
                'penerbit' => trim((string) ($row[3] ?? '')) ?: null,
                'tahun_terbit' => is_numeric($row[4] ?? null) ? (int) $row[4] : null,
                'kategori' => trim((string) ($row[5] ?? '')) ?: null,
                'bahasa' => trim((string) ($row[6] ?? '')) ?: 'Indonesia',
                'lokasi_rak' => trim((string) ($row[7] ?? '')) ?: null,
                'dibuat_oleh' => $request->user()->id,
            ]);

            $jumlah = min(200, max(0, (int) ($row[8] ?? 0)));
            for ($n = 1; $n <= $jumlah; $n++) {
                $this->buatEksemplar($buku, $n);
            }
            $masuk++;
        }

        return response()->json(['masuk' => $masuk, 'errors' => $errors]);
    }
}

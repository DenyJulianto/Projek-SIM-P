<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SekolahController extends Controller
{
    private const IMPORT_HEADERS = [
        'NPSN', 'Nama Sekolah', 'Jenjang', 'Alamat', 'Kelurahan', 'Kecamatan',
        'Kabupaten/Kota', 'Provinsi', 'Latitude', 'Longitude', 'Telepon', 'Email',
    ];

    public function index(Request $request): JsonResponse
    {
        $sekolah = QueryBuilder::for(Sekolah::class)
            ->allowedFilters('nama_sekolah', 'npsn', 'jenjang', 'status', 'provinsi', 'kabupaten_kota')
            ->allowedSorts('nama_sekolah', 'created_at')
            ->with('domains')
            ->withCount(['guruDirectory as jumlah_guru', 'siswaDirectory as jumlah_siswa'])
            ->paginate($request->integer('per_page', 15));

        return response()->json($sekolah);
    }

    /**
     * Export daftar sekolah ke .xlsx. Menghormati filter yang sama seperti
     * index() (nama, NPSN, jenjang, status, provinsi, kabupaten/kota)
     * supaya hasil unduhan sesuai dengan apa yang sedang dicari/ditampilkan
     * di layar, bukan selalu seluruh data.
     */
    public function export(Request $request): StreamedResponse
    {
        $sekolah = QueryBuilder::for(Sekolah::class)
            ->allowedFilters('nama_sekolah', 'npsn', 'jenjang', 'status', 'provinsi', 'kabupaten_kota')
            ->allowedSorts('nama_sekolah', 'created_at')
            ->withCount(['guruDirectory as jumlah_guru', 'siswaDirectory as jumlah_siswa'])
            ->orderBy('nama_sekolah')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Sekolah');

        $headers = [
            'Nama Sekolah', 'NPSN', 'Jenjang', 'Alamat', 'Kelurahan', 'Kecamatan',
            'Kabupaten/Kota', 'Provinsi', 'Telepon', 'Email', 'Jumlah Guru', 'Jumlah Siswa', 'Status',
        ];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);

        $rows = $sekolah->map(fn (Sekolah $s) => [
            $s->nama_sekolah,
            $s->npsn,
            $s->jenjang,
            $s->alamat,
            $s->kelurahan,
            $s->kecamatan,
            $s->kabupaten_kota,
            $s->provinsi,
            $s->telepon,
            $s->email,
            $s->jumlah_guru,
            $s->jumlah_siswa,
            $s->status,
        ])->all();

        $sheet->fromArray($rows, null, 'A2');

        foreach (range('A', 'M') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'data-sekolah-' . now()->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'alpha_dash', 'unique:tenants,id'],
            'nama_sekolah' => ['required', 'string', 'max:255'],
            'npsn' => ['nullable', 'string', 'max:20', 'unique:tenants,npsn'],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'kelurahan' => ['nullable', 'string', 'max:255'],
            'kode_pos' => ['nullable', 'string', 'max:10'],
            'kabupaten_kota' => ['nullable', 'string', 'max:255'],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'telepon' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', 'in:active,inactive'],
            'domain' => ['required', 'string', 'max:255'],
        ]);

        $sekolah = Sekolah::create([
            'id' => $data['id'],
            'nama_sekolah' => $data['nama_sekolah'],
            'npsn' => $data['npsn'] ?? null,
            'jenjang' => $data['jenjang'] ?? null,
            'alamat' => $data['alamat'] ?? null,
            'kecamatan' => $data['kecamatan'] ?? null,
            'kelurahan' => $data['kelurahan'] ?? null,
            'kode_pos' => $data['kode_pos'] ?? null,
            'kabupaten_kota' => $data['kabupaten_kota'] ?? null,
            'provinsi' => $data['provinsi'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'telepon' => $data['telepon'] ?? null,
            'email' => $data['email'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        $sekolah->domains()->create(['domain' => $data['domain']]);

        return response()->json($sekolah->load('domains'), 201);
    }

    public function show(Sekolah $sekolah): JsonResponse
    {
        $sekolah->loadCount(['guruDirectory as jumlah_guru', 'siswaDirectory as jumlah_siswa']);

        return response()->json($sekolah->load('domains'));
    }

    public function update(Request $request, Sekolah $sekolah): JsonResponse
    {
        $data = $request->validate([
            'nama_sekolah' => ['sometimes', 'string', 'max:255'],
            'npsn' => ['nullable', 'string', 'max:20', 'unique:tenants,npsn,' . $sekolah->id],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'kelurahan' => ['nullable', 'string', 'max:255'],
            'kode_pos' => ['nullable', 'string', 'max:10'],
            'kabupaten_kota' => ['nullable', 'string', 'max:255'],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'telepon' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $sekolah->update($data);

        return response()->json($sekolah->load('domains'));
    }

    public function destroy(Sekolah $sekolah): JsonResponse
    {
        $sekolah->delete();

        return response()->json(['message' => 'Sekolah berhasil dihapus.']);
    }

    /**
     * Unduh template .xlsx dengan kolom yang diharapkan import() supaya
     * Super Admin tidak perlu menebak nama/urutan kolom sendiri.
     */
    public function importTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import Sekolah');

        $sheet->fromArray(self::IMPORT_HEADERS, null, 'A1');
        $sheet->getStyle('A1:L1')->getFont()->setBold(true);

        $sheet->fromArray([
            '20223344', 'SDN Contoh 1', 'SD', 'Jl. Contoh No. 1', 'Kelurahan Contoh',
            'Kecamatan Contoh', 'Kabupaten Contoh', 'Jawa Barat', '-6.914744', '107.609810',
            '022-1234567', 'sdncontoh1@example.sch.id',
        ], null, 'A2');

        foreach (range('A', 'L') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template-import-sekolah.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import massal sekolah dari .xlsx (mis. dataset satu provinsi).
     * Setiap baris diproses sendiri-sendiri — baris yang gagal (nama
     * kosong, NPSN duplikat, dll.) dilewati tanpa membatalkan baris lain,
     * dan dilaporkan lewat 'errors' supaya bisa diperbaiki lalu diimpor
     * ulang khusus baris yang gagal itu saja.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120'],
        ]);

        $rows = IOFactory::load($request->file('file')->getRealPath())
            ->getActiveSheet()
            ->toArray(null, true, true, false);

        array_shift($rows);

        if (count($rows) > 1000) {
            return response()->json([
                'message' => 'Maksimal 1000 baris per file. Silakan pecah file menjadi beberapa bagian.',
            ], 422);
        }

        // Import bisa memuat ratusan baris, dan tiap baris memicu pembuatan
        // database tenant baru (migrate + seed) secara sinkron — beri waktu
        // eksekusi tanpa batas supaya tidak terpotong PHP timeout di tengah.
        set_time_limit(0);

        $berhasil = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $rowNumber = $i + 2;
            [$npsn, $namaSekolah, $jenjang, $alamat, $kelurahan, $kecamatan, $kabupatenKota, $provinsi, $latitude, $longitude, $telepon, $email] = array_pad($row, 12, null);

            $namaSekolah = $this->cleanString($namaSekolah);
            if ($namaSekolah === null) {
                $errors[] = "Baris {$rowNumber}: Nama Sekolah kosong, dilewati.";

                continue;
            }

            $npsn = $this->cleanString($npsn);
            if ($npsn !== null && Sekolah::where('npsn', $npsn)->exists()) {
                $errors[] = "Baris {$rowNumber} ({$namaSekolah}): NPSN {$npsn} sudah terdaftar, dilewati.";

                continue;
            }

            try {
                $sekolah = Sekolah::create([
                    'id' => $this->generateUniqueId($npsn, $namaSekolah),
                    'nama_sekolah' => $namaSekolah,
                    'npsn' => $npsn,
                    'jenjang' => $this->cleanString($jenjang),
                    'alamat' => $this->cleanString($alamat),
                    'kelurahan' => $this->cleanString($kelurahan),
                    'kecamatan' => $this->cleanString($kecamatan),
                    'kabupaten_kota' => $this->cleanString($kabupatenKota),
                    'provinsi' => $this->cleanString($provinsi),
                    'latitude' => is_numeric($latitude) ? (float) $latitude : null,
                    'longitude' => is_numeric($longitude) ? (float) $longitude : null,
                    'telepon' => $this->cleanString($telepon),
                    'email' => $this->cleanString($email),
                    'status' => 'active',
                ]);

                $sekolah->domains()->create([
                    'domain' => $sekolah->id . '.' . config('sim.tenant_base_domain'),
                ]);

                $berhasil++;
            } catch (\Throwable $e) {
                report($e);
                $errors[] = "Baris {$rowNumber} ({$namaSekolah}): gagal diproses — " . $e->getMessage();
            }
        }

        return response()->json([
            'total_baris' => count($rows),
            'berhasil' => $berhasil,
            'gagal' => count($errors),
            'errors' => $errors,
        ]);
    }

    private function generateUniqueId(?string $npsn, string $namaSekolah): string
    {
        $base = $npsn ? 'sch-' . Str::slug($npsn) : Str::slug($namaSekolah);
        $base = $base !== '' ? $base : 'sekolah';

        $id = $base;
        $suffix = 1;
        while (Sekolah::where('id', $id)->exists()) {
            $suffix++;
            $id = "{$base}-{$suffix}";
        }

        return $id;
    }

    private function cleanString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return $value === '' || $value === null ? null : (string) $value;
    }
}

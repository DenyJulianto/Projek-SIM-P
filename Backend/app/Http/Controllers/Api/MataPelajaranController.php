<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\MataPelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MataPelajaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $mapel = MataPelajaran::query()
            ->when($request->filled('cari'), function ($q) use ($request) {
                $cari = $request->string('cari');
                $q->where(fn ($qq) => $qq->where('nama_mapel', 'like', "%{$cari}%")->orWhere('kode_mapel', 'like', "%{$cari}%"));
            })
            ->when($request->filled('kelompok'), fn ($q) => $q->where('kelompok', $request->string('kelompok')))
            ->when($request->filled('jenis'), fn ($q) => $q->where('jenis', $request->string('jenis')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderBy('nama_mapel')
            ->paginate($request->integer('per_page', 100));

        return response()->json($mapel);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $mapel = MataPelajaran::create($data);

        activity()->causedBy($request->user())->log("Menambahkan mata pelajaran \"{$mapel->nama_mapel}\".");

        return response()->json($mapel, 201);
    }

    /**
     * Detail lengkap untuk halaman "klik satu mata pelajaran": guru
     * pengampu diambil dari jadwal pelajaran sungguhan (bukan field bebas
     * Guru::mata_pelajaran), dan total JP dari baris Struktur Kurikulum
     * yang benar-benar mereferensikan mapel ini — bukan angka rekaan.
     * Capaian Pembelajaran/Tujuan Pembelajaran/Kompetensi/KKTP/Program
     * Semester/Program Tahunan belum punya modul tersendiri, jadi
     * dikembalikan kosong supaya frontend menampilkannya sebagai "belum
     * tersedia" alih-alih data palsu.
     */
    public function show(MataPelajaran $mataPelajaran): JsonResponse
    {
        $guruPengampu = Guru::query()
            ->whereHas('jadwalPelajaran', fn ($q) => $q->where('mata_pelajaran_id', $mataPelajaran->id))
            ->orderBy('nama')
            ->get(['id', 'nama', 'nip']);

        $strukturPemakai = $mataPelajaran->strukturKurikulumMapel()
            ->with('strukturKurikulum.tahunAjaran:id,nama')
            ->get()
            ->map(fn ($m) => [
                'struktur_kurikulum_id' => $m->struktur_kurikulum_id,
                'tahun_ajaran' => $m->strukturKurikulum?->tahunAjaran?->nama,
                'tingkat' => $m->strukturKurikulum?->tingkat,
                'fase' => $m->strukturKurikulum?->fase,
                'kurikulum' => $m->strukturKurikulum?->kurikulum,
                'is_aktif' => $m->strukturKurikulum?->is_aktif ?? false,
                'jp_per_minggu' => $m->jp_per_minggu,
            ])
            ->values();

        $totalJpAktif = $strukturPemakai->where('is_aktif', true)->sum('jp_per_minggu');

        return response()->json([
            ...$mataPelajaran->toArray(),
            'guru_pengampu' => $guruPengampu,
            'struktur_pemakai' => $strukturPemakai,
            'total_jp_aktif' => $totalJpAktif,
        ]);
    }

    public function update(Request $request, MataPelajaran $mataPelajaran): JsonResponse
    {
        $data = $request->validate($this->rules($mataPelajaran));

        $mataPelajaran->update($data);

        activity()->causedBy($request->user())->log("Memperbarui mata pelajaran \"{$mataPelajaran->nama_mapel}\".");

        return response()->json($mataPelajaran);
    }

    /**
     * Hard delete hanya diizinkan jika mapel belum pernah dipakai di
     * jadwal, nilai, atau struktur kurikulum — kalau sudah, arahkan ke
     * nonaktifkan supaya data historis (jadwal/nilai lama) tidak yatim.
     */
    public function destroy(Request $request, MataPelajaran $mataPelajaran): JsonResponse
    {
        $dipakai = $mataPelajaran->jadwalPelajaran()->exists()
            || $mataPelajaran->nilai()->exists()
            || $mataPelajaran->strukturKurikulumMapel()->exists();

        if ($dipakai) {
            throw ValidationException::withMessages([
                'nama_mapel' => ['Mata pelajaran ini sudah dipakai di jadwal/nilai/struktur kurikulum dan tidak bisa dihapus. Nonaktifkan saja agar tidak dipakai lagi untuk data baru.'],
            ]);
        }

        $nama = $mataPelajaran->nama_mapel;
        $mataPelajaran->delete();

        activity()->causedBy($request->user())->log("Menghapus mata pelajaran \"{$nama}\".");

        return response()->json(['message' => 'Mata pelajaran berhasil dihapus.']);
    }

    public function aktifkan(Request $request, MataPelajaran $mataPelajaran): JsonResponse
    {
        $mataPelajaran->update(['status' => 'aktif']);

        activity()->causedBy($request->user())->log("Mengaktifkan mata pelajaran \"{$mataPelajaran->nama_mapel}\".");

        return response()->json($mataPelajaran);
    }

    public function nonaktifkan(Request $request, MataPelajaran $mataPelajaran): JsonResponse
    {
        $mataPelajaran->update(['status' => 'nonaktif']);

        activity()->causedBy($request->user())->log("Menonaktifkan mata pelajaran \"{$mataPelajaran->nama_mapel}\".");

        return response()->json($mataPelajaran);
    }

    public function export(Request $request): StreamedResponse
    {
        $mapel = MataPelajaran::orderBy('nama_mapel')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Mata Pelajaran');

        $sheet->fromArray($this->kolomImportExport(), null, 'A1');
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);

        $rows = $mapel->map(fn (MataPelajaran $m) => [
            $m->kode_mapel,
            $m->nama_mapel,
            $m->kelompok,
            $this->jenisLabel($m->jenis),
            $m->jenjang,
            $m->alokasi_jp_default,
            $m->status === 'nonaktif' ? 'Nonaktif' : 'Aktif',
            $m->deskripsi,
        ])->all();

        $sheet->fromArray($rows, null, 'A2');

        foreach (range('A', 'H') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'mata-pelajaran-'.now()->format('Y-m-d').'.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import Mata Pelajaran');

        $sheet->fromArray($this->kolomImportExport(), null, 'A1');
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);

        $sheet->fromArray([
            ['MTK', 'Matematika', 'Umum', 'Wajib', 'VII-IX', 5, 'Aktif', ''],
            ['MULOK-SD', 'Bahasa Sunda', 'Muatan Lokal', 'Muatan Lokal', 'VII-IX', 2, 'Aktif', ''],
        ], null, 'A2');

        foreach (range('A', 'H') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template-import-mata-pelajaran.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import massal: baris dengan Kode Mapel yang sudah terdaftar dilewati
     * (tidak menimpa), supaya import berulang aman dijalankan tanpa
     * merusak data yang sudah diedit manual.
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

        if (count($rows) > 2000) {
            return response()->json([
                'message' => 'Maksimal 2000 baris per file. Silakan pecah file menjadi beberapa bagian.',
            ], 422);
        }

        set_time_limit(0);

        $berhasil = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2;
            [$kode, $nama, $kelompok, $jenis, $jenjang, $jpDefault, $status] = array_pad($row, 8, null);

            $kode = $this->cleanString($kode);
            $nama = $this->cleanString($nama);

            if ($kode === null || $nama === null) {
                $errors[] = "Baris {$line}: Kode Mapel dan Nama Mata Pelajaran wajib diisi, dilewati.";

                continue;
            }

            if (MataPelajaran::where('kode_mapel', $kode)->exists()) {
                $errors[] = "Baris {$line}: Kode Mapel \"{$kode}\" sudah terdaftar, dilewati.";

                continue;
            }

            $jenisValue = $this->jenisValue($jenis);
            $deskripsi = $this->cleanString($row[7] ?? null);

            try {
                MataPelajaran::create([
                    'kode_mapel' => $kode,
                    'nama_mapel' => $nama,
                    'kelompok' => $this->cleanString($kelompok),
                    'jenis' => $jenisValue,
                    'jenjang' => $this->cleanString($jenjang),
                    'alokasi_jp_default' => $jpDefault !== null && $jpDefault !== '' ? (int) $jpDefault : null,
                    'status' => mb_strtolower((string) $this->cleanString($status)) === 'nonaktif' ? 'nonaktif' : 'aktif',
                    'deskripsi' => $deskripsi,
                ]);
                $berhasil++;
            } catch (\Throwable $e) {
                report($e);
                $errors[] = "Baris {$line} ({$nama}): gagal diproses — ".$e->getMessage();
            }
        }

        return response()->json([
            'total_baris' => count($rows),
            'berhasil' => $berhasil,
            'gagal' => count($errors),
            'errors' => $errors,
        ]);
    }

    private function rules(?MataPelajaran $mapel = null): array
    {
        $ignoreId = $mapel?->id;

        return [
            'kode_mapel' => ['required', 'string', 'max:20', 'unique:mata_pelajaran,kode_mapel'.($ignoreId ? ",{$ignoreId}" : '')],
            'nama_mapel' => ['required', 'string', 'max:255'],
            'kelompok' => ['nullable', 'string', 'max:100'],
            'jenis' => ['required', 'in:wajib,pilihan,muatan_lokal,lainnya'],
            'jenjang' => ['nullable', 'string', 'max:100'],
            'alokasi_jp_default' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'deskripsi' => ['nullable', 'string'],
        ];
    }

    private function kolomImportExport(): array
    {
        return ['Kode Mapel', 'Nama Mata Pelajaran', 'Kelompok', 'Jenis', 'Jenjang/Kelas', 'Alokasi JP Default', 'Status', 'Deskripsi'];
    }

    private function jenisLabel(string $jenis): string
    {
        return match ($jenis) {
            'pilihan' => 'Pilihan',
            'muatan_lokal' => 'Muatan Lokal',
            'lainnya' => 'Lainnya',
            default => 'Wajib',
        };
    }

    private function jenisValue(mixed $jenis): string
    {
        return match (mb_strtolower((string) $this->cleanString($jenis))) {
            'pilihan' => 'pilihan',
            'muatan lokal', 'muatan_lokal' => 'muatan_lokal',
            'lainnya' => 'lainnya',
            default => 'wajib',
        };
    }

    private function cleanString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return $value === '' || $value === null ? null : (string) $value;
    }
}

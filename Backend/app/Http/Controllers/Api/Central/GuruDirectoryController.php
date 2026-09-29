<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\GuruDirectory;
use App\Models\Central\SecuritySettings;
use App\Models\Guru;
use App\Models\Sekolah;
use App\Support\PiiMasker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Direktori guru lintas sekolah (data master nasional untuk Super Admin).
 * index()/export() baca-saja dari salinan central — sumber kebenarannya
 * tetap database masing-masing sekolah. import() menulis ke sumber
 * kebenaran itu langsung (lewat $sekolah->run(), sama seperti
 * GuruController di sisi sekolah), lalu menyalin ke direktori nasional
 * secara otomatis lewat GuruObserver, seperti proses tambah guru biasa.
 */
class GuruDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $guru = QueryBuilder::for(GuruDirectory::class)
            ->allowedFilters('nama', 'jabatan', 'mata_pelajaran', 'status_kepegawaian', 'status', 'sekolah_id')
            ->allowedSorts('nama', 'jabatan', 'synced_at')
            ->with('sekolah:id,nama_sekolah,npsn,jenjang')
            ->paginate($request->integer('per_page', 15));

        return response()->json($guru);
    }

    public function export(Request $request): StreamedResponse
    {
        $guru = QueryBuilder::for(GuruDirectory::class)
            ->allowedFilters('nama', 'jabatan', 'mata_pelajaran', 'status_kepegawaian', 'status', 'sekolah_id')
            ->allowedSorts('nama', 'jabatan', 'synced_at')
            ->with('sekolah:id,nama_sekolah,npsn')
            ->orderBy('nama')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Guru');

        $headers = [
            'NPSN Sekolah', 'Nama Sekolah', 'Nama Guru', 'Gelar', 'Jenis Kelamin', 'NIP', 'NUPTK',
            'Jabatan', 'Mata Pelajaran', 'Status Kepegawaian', 'Pendidikan Terakhir', 'No. Telepon', 'Status',
        ];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);

        // Data pribadi (NIP/NUPTK/telepon) disamarkan kalau Super Admin
        // mengaktifkannya lewat menu Pengaturan Keamanan > Kontrol Data
        // Pribadi (PII) — lihat App\Support\PiiMasker. Tidak berlaku untuk
        // tampilan internal (index()), cuma untuk file yang keluar sistem.
        $maskPii = SecuritySettings::current()->mask_pii_enabled;

        $rows = $guru->map(fn (GuruDirectory $g) => [
            $g->sekolah?->npsn,
            $g->sekolah?->nama_sekolah,
            $g->nama,
            $g->gelar,
            $g->jenis_kelamin,
            $maskPii ? PiiMasker::id($g->nip) : $g->nip,
            $maskPii ? PiiMasker::id($g->nuptk) : $g->nuptk,
            $g->jabatan,
            $g->mata_pelajaran,
            $g->status_kepegawaian,
            $g->pendidikan_terakhir,
            $maskPii ? PiiMasker::phone($g->no_telepon) : $g->no_telepon,
            $g->status,
        ])->all();

        $sheet->fromArray($rows, null, 'A2');

        foreach (range('A', 'M') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'data-guru-' . now()->format('Y-m-d') . '.xlsx';

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
        $sheet->setTitle('Import Guru');

        $headers = [
            'NPSN Sekolah', 'Nama Guru', 'Jenis Kelamin (L/P)', 'NIP', 'NUPTK', 'Jabatan',
            'Mata Pelajaran', 'Status Kepegawaian', 'Pendidikan Terakhir', 'No. Telepon',
        ];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:J1')->getFont()->setBold(true);

        $sheet->fromArray([
            '20223344', 'Budi Santoso', 'L', '198501012010011001', '1234567890123456',
            'Guru Mata Pelajaran', 'Matematika', 'PNS', 'S1', '081234567890',
        ], null, 'A2');

        foreach (range('A', 'J') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template-import-guru.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import massal guru dari .xlsx lintas sekolah. Setiap baris harus
     * menyebutkan NPSN sekolah tujuan — sekolahnya harus sudah terdaftar
     * lebih dulu (lewat form/import Data Sekolah). Baris dikelompokkan per
     * sekolah supaya tenant hanya dibuka sekali per sekolah, bukan per
     * baris.
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

        set_time_limit(0);

        $bySekolah = [];
        foreach ($rows as $i => $row) {
            $npsn = $this->cleanString($row[0] ?? null);
            $bySekolah[$npsn ?? '']['entries'][] = ['row' => $row, 'line' => $i + 2];
        }

        $berhasil = 0;
        $errors = [];

        foreach ($bySekolah as $npsn => $group) {
            if ($npsn === '') {
                foreach ($group['entries'] as $entry) {
                    $errors[] = "Baris {$entry['line']}: NPSN Sekolah kosong, dilewati.";
                }

                continue;
            }

            $sekolah = Sekolah::where('npsn', $npsn)->first();

            if (! $sekolah) {
                foreach ($group['entries'] as $entry) {
                    $errors[] = "Baris {$entry['line']}: Sekolah dengan NPSN {$npsn} tidak ditemukan. Import Data Sekolah terlebih dahulu.";
                }

                continue;
            }

            $sekolah->run(function () use ($group, &$berhasil, &$errors) {
                foreach ($group['entries'] as $entry) {
                    [, $nama, $jenisKelamin, $nip, $nuptk, $jabatan, $mapel, $statusKepeg, $pendidikan, $telepon] = array_pad($entry['row'], 10, null);

                    $nama = $this->cleanString($nama);
                    if ($nama === null) {
                        $errors[] = "Baris {$entry['line']}: Nama Guru kosong, dilewati.";

                        continue;
                    }

                    $jenisKelamin = strtoupper((string) $this->cleanString($jenisKelamin));
                    if (! in_array($jenisKelamin, ['L', 'P'], true)) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): Jenis Kelamin harus diisi L atau P, dilewati.";

                        continue;
                    }

                    $nip = $this->cleanString($nip);
                    $nuptk = $this->cleanString($nuptk);

                    if ($nip !== null && Guru::where('nip', $nip)->exists()) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): NIP {$nip} sudah terdaftar di sekolah ini, dilewati.";

                        continue;
                    }

                    if ($nuptk !== null && Guru::where('nuptk', $nuptk)->exists()) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): NUPTK {$nuptk} sudah terdaftar di sekolah ini, dilewati.";

                        continue;
                    }

                    try {
                        Guru::create([
                            'nama' => $nama,
                            'jenis_kelamin' => $jenisKelamin,
                            'nip' => $nip,
                            'nuptk' => $nuptk,
                            'jabatan' => $this->cleanString($jabatan),
                            'mata_pelajaran' => $this->cleanString($mapel),
                            'status_kepegawaian' => $this->cleanString($statusKepeg),
                            'pendidikan_terakhir' => $this->cleanString($pendidikan),
                            'no_telepon' => $this->cleanString($telepon),
                            'status' => 'aktif',
                        ]);
                        $berhasil++;
                    } catch (\Throwable $e) {
                        report($e);
                        $errors[] = "Baris {$entry['line']} ({$nama}): gagal diproses — " . $e->getMessage();
                    }
                }
            });
        }

        return response()->json([
            'total_baris' => count($rows),
            'berhasil' => $berhasil,
            'gagal' => count($errors),
            'errors' => $errors,
            'catatan' => 'Guru yang berhasil diimpor akan tampil di Direktori Guru Nasional setelah proses sinkronisasi latar belakang selesai (biasanya beberapa detik).',
        ]);
    }

    /**
     * Alamat rinci guru TIDAK ikut disalin ke direktori nasional (sama
     * seperti alasan SiswaDirectoryController::wali()) — jadi diambil
     * langsung dari database sekolah bersangkutan saat Super Admin membuka
     * detail guru tsb, bukan disinkron & disimpan permanen di central.
     */
    public function alamat(Sekolah $sekolah, int $guruId): JsonResponse
    {
        $guru = $sekolah->run(fn () => Guru::find($guruId, [
            'alamat', 'rt_rw', 'kelurahan', 'kecamatan', 'kota', 'kode_pos',
        ]));

        if (! $guru) {
            return response()->json(['message' => 'Guru tidak ditemukan.'], 404);
        }

        return response()->json([
            'alamat' => $guru->alamat,
            'rt_rw' => $guru->rt_rw,
            'kelurahan' => $guru->kelurahan,
            'kecamatan' => $guru->kecamatan,
            'kota' => $guru->kota,
            'kode_pos' => $guru->kode_pos,
        ]);
    }

    /**
     * Edit identitas guru dari halaman detail Super Admin — menulis
     * langsung ke database sekolah (sumber kebenaran), sama seperti
     * GuruController::update() di sisi sekolah. GuruObserver otomatis
     * menyalin perubahan ini ke direktori nasional lewat job sinkronisasi,
     * jadi tidak perlu update manual ke GuruDirectory di sini.
     */
    public function update(Request $request, Sekolah $sekolah, int $guruId): JsonResponse
    {
        $result = $sekolah->run(function () use ($request, $guruId) {
            $guru = Guru::find($guruId);

            if (! $guru) {
                return null;
            }

            $data = $request->validate([
                'nip' => ['nullable', 'string', 'max:30', 'unique:guru,nip,' . $guru->id],
                'nuptk' => ['nullable', 'string', 'max:30', 'unique:guru,nuptk,' . $guru->id],
                'nama' => ['sometimes', 'string', 'max:255'],
                'gelar' => ['nullable', 'string', 'max:100'],
                'jenis_kelamin' => ['sometimes', 'in:L,P'],
                'jabatan' => ['nullable', 'string', 'max:255'],
                'mata_pelajaran' => ['nullable', 'string', 'max:255'],
                'status_kepegawaian' => ['nullable', 'string', 'max:100'],
                'pendidikan_terakhir' => ['nullable', 'string', 'max:100'],
                'no_telepon' => ['nullable', 'string', 'max:20'],
                'alamat' => ['nullable', 'string'],
                'rt_rw' => ['nullable', 'string', 'max:20'],
                'kelurahan' => ['nullable', 'string', 'max:255'],
                'kecamatan' => ['nullable', 'string', 'max:255'],
                'kota' => ['nullable', 'string', 'max:255'],
                'kode_pos' => ['nullable', 'string', 'max:10'],
            ]);

            $guru->update($data);

            return $guru->toArray();
        });

        if ($result === null) {
            return response()->json(['message' => 'Guru tidak ditemukan.'], 404);
        }

        return response()->json($result);
    }

    /**
     * Hapus permanen data guru dari database sekolah — sama seperti
     * GuruController::destroy() di sisi sekolah. GuruObserver otomatis
     * menghapus salinannya dari direktori nasional lewat job sinkronisasi.
     */
    public function destroy(Sekolah $sekolah, int $guruId): JsonResponse
    {
        $found = $sekolah->run(function () use ($guruId) {
            $guru = Guru::find($guruId);

            if (! $guru) {
                return false;
            }

            $guru->delete();

            return true;
        });

        if (! $found) {
            return response()->json(['message' => 'Guru tidak ditemukan.'], 404);
        }

        return response()->json(['message' => 'Guru berhasil dihapus.']);
    }

    private function cleanString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return $value === '' || $value === null ? null : (string) $value;
    }
}

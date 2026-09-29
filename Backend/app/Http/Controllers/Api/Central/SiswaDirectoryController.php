<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\SecuritySettings;
use App\Models\Central\SiswaDirectory;
use App\Models\Sekolah;
use App\Models\Siswa;
use App\Support\PiiMasker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Direktori siswa lintas sekolah (data master nasional untuk Super Admin).
 * index()/export() baca-saja dari salinan central — sumber kebenarannya
 * tetap database masing-masing sekolah. import() menulis ke sumber
 * kebenaran itu langsung (lewat $sekolah->run(), sama seperti
 * SiswaController di sisi sekolah), lalu menyalin ke direktori nasional
 * secara otomatis lewat SiswaObserver, seperti proses tambah siswa biasa.
 */
class SiswaDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $siswa = QueryBuilder::for(SiswaDirectory::class)
            ->allowedFilters('nama', 'nis', 'kelas', 'status', 'sekolah_id')
            ->allowedSorts('nama', 'kelas', 'synced_at')
            ->with('sekolah:id,nama_sekolah,npsn,jenjang')
            ->paginate($request->integer('per_page', 15));

        return response()->json($siswa);
    }

    public function export(Request $request): StreamedResponse
    {
        $siswa = QueryBuilder::for(SiswaDirectory::class)
            ->allowedFilters('nama', 'nis', 'kelas', 'status', 'sekolah_id')
            ->allowedSorts('nama', 'kelas', 'synced_at')
            ->with('sekolah:id,nama_sekolah,npsn')
            ->orderBy('nama')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Siswa');

        $headers = [
            'NPSN Sekolah', 'Nama Sekolah', 'Nama Siswa', 'NIS', 'Jenis Kelamin',
            'Kelas', 'Tahun Masuk', 'Status',
        ];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);

        $maskPii = SecuritySettings::current()->mask_pii_enabled;

        $rows = $siswa->map(fn (SiswaDirectory $s) => [
            $s->sekolah?->npsn,
            $s->sekolah?->nama_sekolah,
            $s->nama,
            $maskPii ? PiiMasker::id($s->nis) : $s->nis,
            $s->jenis_kelamin,
            $s->kelas,
            $s->tahun_masuk,
            $s->status,
        ])->all();

        $sheet->fromArray($rows, null, 'A2');

        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'data-siswa-' . now()->format('Y-m-d') . '.xlsx';

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
        $sheet->setTitle('Import Siswa');

        $headers = [
            'NPSN Sekolah', 'Nama Siswa', 'NIS', 'NISN', 'Jenis Kelamin (L/P)',
            'Tempat Lahir', 'Tanggal Lahir (YYYY-MM-DD)', 'Alamat', 'Tahun Masuk',
        ];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:I1')->getFont()->setBold(true);

        $sheet->fromArray([
            '20223344', 'Siti Aminah', '2024001', '0051234567', 'P',
            'Bandung', '2010-05-14', 'Jl. Merdeka No. 1', '2024',
        ], null, 'A2');

        foreach (range('A', 'I') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template-import-siswa.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import massal siswa dari .xlsx lintas sekolah. Setiap baris harus
     * menyebutkan NPSN sekolah tujuan — sekolahnya harus sudah terdaftar
     * lebih dulu (lewat form/import Data Sekolah). Baris dikelompokkan per
     * sekolah supaya tenant hanya dibuka sekali per sekolah, bukan per
     * baris. Siswa yang diimpor belum memiliki kelas — admin sekolah bisa
     * menetapkan kelasnya lewat menu Data Siswa di sekolah masing-masing.
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
                    [, $nama, $nis, $nisn, $jenisKelamin, $tempatLahir, $tanggalLahir, $alamat, $tahunMasuk] = array_pad($entry['row'], 9, null);

                    $nama = $this->cleanString($nama);
                    if ($nama === null) {
                        $errors[] = "Baris {$entry['line']}: Nama Siswa kosong, dilewati.";

                        continue;
                    }

                    $nis = $this->cleanString($nis);
                    if ($nis === null) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): NIS wajib diisi, dilewati.";

                        continue;
                    }

                    $jenisKelamin = strtoupper((string) $this->cleanString($jenisKelamin));
                    if (! in_array($jenisKelamin, ['L', 'P'], true)) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): Jenis Kelamin harus diisi L atau P, dilewati.";

                        continue;
                    }

                    if (Siswa::where('nis', $nis)->exists()) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): NIS {$nis} sudah terdaftar di sekolah ini, dilewati.";

                        continue;
                    }

                    $nisn = $this->cleanString($nisn);
                    if ($nisn !== null && Siswa::where('nisn', $nisn)->exists()) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): NISN {$nisn} sudah terdaftar di sekolah ini, dilewati.";

                        continue;
                    }

                    $tanggalLahir = $this->cleanString($tanggalLahir);
                    if ($tanggalLahir !== null && strtotime($tanggalLahir) === false) {
                        $errors[] = "Baris {$entry['line']} ({$nama}): Format Tanggal Lahir tidak valid, dilewati.";

                        continue;
                    }

                    $tahunMasuk = $this->cleanString($tahunMasuk);

                    try {
                        Siswa::create([
                            'nis' => $nis,
                            'nisn' => $nisn,
                            'nama' => $nama,
                            'jenis_kelamin' => $jenisKelamin,
                            'tempat_lahir' => $this->cleanString($tempatLahir),
                            'tanggal_lahir' => $tanggalLahir,
                            'alamat' => $this->cleanString($alamat),
                            'tahun_masuk' => $tahunMasuk !== null ? (int) $tahunMasuk : null,
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
            'catatan' => 'Siswa yang berhasil diimpor akan tampil di Direktori Siswa Nasional setelah proses sinkronisasi latar belakang selesai (biasanya beberapa detik). Kelas belum ditetapkan — atur lewat menu Data Siswa di sekolah masing-masing.',
        ]);
    }

    /**
     * Data orang tua/wali TIDAK ikut disalin ke direktori nasional (siswa_
     * direktori_nasional cuma menyimpan data non-sensitif secukupnya untuk
     * daftar & pencarian) — jadi diambil langsung dari database sekolah
     * yang bersangkutan saat Super Admin benar-benar membuka detail siswa
     * tsb, bukan disinkron & disimpan permanen di central.
     */
    public function wali(Sekolah $sekolah, int $siswaId): JsonResponse
    {
        $wali = $sekolah->run(fn () => Siswa::find($siswaId, ['nama_wali', 'telepon_wali']));

        if (! $wali) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        return response()->json([
            'nama_wali' => $wali->nama_wali,
            'telepon_wali' => $wali->telepon_wali,
        ]);
    }

    /**
     * Alamat rinci siswa TIDAK ikut disalin ke direktori nasional — sama
     * alasannya dengan wali() di atas, diambil langsung dari database
     * sekolah bersangkutan saat Super Admin membuka detail siswa tsb.
     */
    public function alamat(Sekolah $sekolah, int $siswaId): JsonResponse
    {
        $siswa = $sekolah->run(fn () => Siswa::find($siswaId, [
            'alamat', 'rt_rw', 'kelurahan', 'kecamatan', 'kota', 'kode_pos',
        ]));

        if (! $siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        return response()->json([
            'alamat' => $siswa->alamat,
            'rt_rw' => $siswa->rt_rw,
            'kelurahan' => $siswa->kelurahan,
            'kecamatan' => $siswa->kecamatan,
            'kota' => $siswa->kota,
            'kode_pos' => $siswa->kode_pos,
        ]);
    }

    /**
     * Edit identitas siswa dari halaman detail Super Admin — menulis
     * langsung ke database sekolah (sumber kebenaran), sama seperti
     * SiswaController::update() di sisi sekolah. SiswaObserver otomatis
     * menyalin perubahan ini ke direktori nasional lewat job sinkronisasi.
     * Kelas TIDAK bisa diubah dari sini — pemindahan kelas tetap operasi
     * di sisi sekolah karena butuh memilih dari data kelas yang tersedia.
     */
    public function update(Request $request, Sekolah $sekolah, int $siswaId): JsonResponse
    {
        $result = $sekolah->run(function () use ($request, $siswaId) {
            $siswa = Siswa::find($siswaId);

            if (! $siswa) {
                return null;
            }

            $data = $request->validate([
                'nis' => ['sometimes', 'string', 'max:20', 'unique:siswa,nis,' . $siswa->id],
                'nisn' => ['nullable', 'string', 'max:20', 'unique:siswa,nisn,' . $siswa->id],
                'nama' => ['sometimes', 'string', 'max:255'],
                'jenis_kelamin' => ['sometimes', 'in:L,P'],
                'tahun_masuk' => ['nullable', 'integer', 'min:1950', 'max:2100'],
                'alamat' => ['nullable', 'string'],
                'rt_rw' => ['nullable', 'string', 'max:20'],
                'kelurahan' => ['nullable', 'string', 'max:255'],
                'kecamatan' => ['nullable', 'string', 'max:255'],
                'kota' => ['nullable', 'string', 'max:255'],
                'kode_pos' => ['nullable', 'string', 'max:10'],
                'nama_wali' => ['nullable', 'string', 'max:255'],
                'telepon_wali' => ['nullable', 'string', 'max:20'],
            ]);

            $siswa->update($data);

            return $siswa->toArray();
        });

        if ($result === null) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        return response()->json($result);
    }

    /**
     * Hapus permanen data siswa dari database sekolah — sama seperti
     * SiswaController::destroy() di sisi sekolah. SiswaObserver otomatis
     * menghapus salinannya dari direktori nasional lewat job sinkronisasi.
     */
    public function destroy(Sekolah $sekolah, int $siswaId): JsonResponse
    {
        $found = $sekolah->run(function () use ($siswaId) {
            $siswa = Siswa::find($siswaId);

            if (! $siswa) {
                return false;
            }

            $siswa->delete();

            return true;
        });

        if (! $found) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        return response()->json(['message' => 'Siswa berhasil dihapus.']);
    }

    private function cleanString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return $value === '' || $value === null ? null : (string) $value;
    }
}

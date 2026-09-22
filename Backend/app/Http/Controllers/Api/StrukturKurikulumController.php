<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MataPelajaran;
use App\Models\StrukturKurikulum;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Struktur Kurikulum: susunan mata pelajaran per tingkat/fase untuk satu
 * tahun ajaran & kurikulum tertentu (mis. Kurikulum Merdeka Fase D untuk
 * kelas VII), lengkap dengan kelompok mapel, status wajib/pilihan, muatan
 * lokal, projek penguatan profil pelajar, dan alokasi JP per minggu/semester.
 * Setiap baris mapel disimpan di struktur_kurikulum_mapel; menyimpan ulang
 * (store/update) selalu mengganti seluruh baris mapel sekaligus supaya form
 * penyusunan di frontend tetap sederhana (kirim seluruh daftar, bukan diff).
 */
class StrukturKurikulumController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $struktur = StrukturKurikulum::query()
            ->with(['tahunAjaran:id,nama', 'mapel'])
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->when($request->filled('tingkat'), fn ($q) => $q->where('tingkat', $request->string('tingkat')))
            ->when($request->filled('status'), fn ($q) => $q->where('is_aktif', $request->string('status') === 'aktif'))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (StrukturKurikulum $s) => $this->presentRingkas($s));

        return response()->json($struktur);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateStruktur($request);
        $this->assertUnique($data, null);

        $struktur = DB::transaction(function () use ($data, $request) {
            $struktur = StrukturKurikulum::create([
                'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                'tingkat' => $data['tingkat'],
                'fase' => $data['fase'] ?? null,
                'kurikulum' => $data['kurikulum'],
                'keterangan' => $data['keterangan'] ?? null,
                'dibuat_oleh' => $request->user()->id,
            ]);

            $this->syncMapel($struktur, $data['mapel']);

            return $struktur;
        });

        activity()
            ->causedBy($request->user())
            ->log("Menambahkan struktur kurikulum \"{$struktur->kurikulum}\" untuk tingkat {$struktur->tingkat}.");

        return response()->json($struktur->load(['tahunAjaran:id,nama', 'mapel.mataPelajaran:id,nama_mapel,kode_mapel']), 201);
    }

    public function show(StrukturKurikulum $strukturKurikulum): JsonResponse
    {
        return response()->json($strukturKurikulum->load(['tahunAjaran:id,nama', 'mapel.mataPelajaran:id,nama_mapel,kode_mapel']));
    }

    public function update(Request $request, StrukturKurikulum $strukturKurikulum): JsonResponse
    {
        $data = $this->validateStruktur($request);
        $this->assertUnique($data, $strukturKurikulum->id);

        DB::transaction(function () use ($data, $strukturKurikulum) {
            $strukturKurikulum->update([
                'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                'tingkat' => $data['tingkat'],
                'fase' => $data['fase'] ?? null,
                'kurikulum' => $data['kurikulum'],
                'keterangan' => $data['keterangan'] ?? null,
            ]);

            $this->syncMapel($strukturKurikulum, $data['mapel']);
        });

        activity()
            ->causedBy($request->user())
            ->log("Memperbarui struktur kurikulum \"{$strukturKurikulum->kurikulum}\" untuk tingkat {$strukturKurikulum->tingkat}.");

        return response()->json($strukturKurikulum->fresh(['tahunAjaran:id,nama', 'mapel.mataPelajaran:id,nama_mapel,kode_mapel']));
    }

    public function destroy(Request $request, StrukturKurikulum $strukturKurikulum): JsonResponse
    {
        $label = "{$strukturKurikulum->kurikulum} — Tingkat {$strukturKurikulum->tingkat}";
        $strukturKurikulum->delete();

        activity()->causedBy($request->user())->log("Menghapus struktur kurikulum \"{$label}\".");

        return response()->json(['message' => 'Struktur kurikulum berhasil dihapus.']);
    }

    /**
     * Mengaktifkan satu struktur otomatis menonaktifkan struktur lain pada
     * kombinasi tahun ajaran + tingkat + fase yang sama, supaya tidak ada
     * dua struktur kurikulum yang aktif bersamaan untuk jenjang yang sama.
     */
    public function aktifkan(Request $request, StrukturKurikulum $strukturKurikulum): JsonResponse
    {
        DB::transaction(function () use ($strukturKurikulum) {
            StrukturKurikulum::where('tahun_ajaran_id', $strukturKurikulum->tahun_ajaran_id)
                ->where('tingkat', $strukturKurikulum->tingkat)
                ->where('fase', $strukturKurikulum->fase)
                ->where('id', '!=', $strukturKurikulum->id)
                ->update(['is_aktif' => false]);

            $strukturKurikulum->update(['is_aktif' => true]);
        });

        activity()
            ->causedBy($request->user())
            ->log("Mengaktifkan struktur kurikulum \"{$strukturKurikulum->kurikulum}\" untuk tingkat {$strukturKurikulum->tingkat}.");

        return response()->json($strukturKurikulum->fresh(['tahunAjaran:id,nama', 'mapel.mataPelajaran:id,nama_mapel,kode_mapel']));
    }

    public function nonaktifkan(Request $request, StrukturKurikulum $strukturKurikulum): JsonResponse
    {
        $strukturKurikulum->update(['is_aktif' => false]);

        activity()
            ->causedBy($request->user())
            ->log("Menonaktifkan struktur kurikulum \"{$strukturKurikulum->kurikulum}\" untuk tingkat {$strukturKurikulum->tingkat}.");

        return response()->json($strukturKurikulum->fresh(['tahunAjaran:id,nama', 'mapel.mataPelajaran:id,nama_mapel,kode_mapel']));
    }

    /**
     * Duplikasi struktur (header + seluruh baris mapel) ke tahun ajaran
     * lain, mis. menyalin struktur tahun lalu sebagai draf tahun baru.
     * Hasil duplikasi selalu nonaktif supaya ditinjau dulu sebelum dipakai.
     */
    public function duplikasi(Request $request, StrukturKurikulum $strukturKurikulum): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
        ]);

        $this->assertUnique([
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'tingkat' => $strukturKurikulum->tingkat,
            'fase' => $strukturKurikulum->fase,
            'kurikulum' => $strukturKurikulum->kurikulum,
        ], null);

        $salinan = DB::transaction(function () use ($strukturKurikulum, $data, $request) {
            $salinan = StrukturKurikulum::create([
                'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                'tingkat' => $strukturKurikulum->tingkat,
                'fase' => $strukturKurikulum->fase,
                'kurikulum' => $strukturKurikulum->kurikulum,
                'keterangan' => $strukturKurikulum->keterangan,
                'is_aktif' => false,
                'dibuat_oleh' => $request->user()->id,
            ]);

            foreach ($strukturKurikulum->mapel as $m) {
                $salinan->mapel()->create([
                    'kelompok' => $m->kelompok,
                    'mata_pelajaran_id' => $m->mata_pelajaran_id,
                    'nama_custom' => $m->nama_custom,
                    'jenis' => $m->jenis,
                    'is_muatan_lokal' => $m->is_muatan_lokal,
                    'is_projek' => $m->is_projek,
                    'jp_per_minggu' => $m->jp_per_minggu,
                    'alokasi_jp_ganjil' => $m->alokasi_jp_ganjil,
                    'alokasi_jp_genap' => $m->alokasi_jp_genap,
                    'urutan' => $m->urutan,
                ]);
            }

            return $salinan;
        });

        activity()
            ->causedBy($request->user())
            ->log("Menduplikasi struktur kurikulum \"{$strukturKurikulum->kurikulum}\" tingkat {$strukturKurikulum->tingkat} ke tahun ajaran lain.");

        return response()->json($salinan->load(['tahunAjaran:id,nama', 'mapel.mataPelajaran:id,nama_mapel,kode_mapel']), 201);
    }

    public function export(Request $request): StreamedResponse
    {
        $strukturList = StrukturKurikulum::query()
            ->with(['tahunAjaran:id,nama', 'mapel.mataPelajaran:id,nama_mapel'])
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->orderBy('tingkat')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Struktur Kurikulum');

        $headers = $this->kolomImportExport();
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($strukturList as $s) {
            if ($s->mapel->isEmpty()) {
                $sheet->fromArray([$s->tahunAjaran?->nama, $s->tingkat, $s->fase, $s->kurikulum, '', '', '', '', '', '', '', '', $s->keterangan], null, "A{$rowIndex}");
                $rowIndex++;

                continue;
            }

            foreach ($s->mapel as $m) {
                $sheet->fromArray([
                    $s->tahunAjaran?->nama,
                    $s->tingkat,
                    $s->fase,
                    $s->kurikulum,
                    $m->kelompok,
                    $m->mataPelajaran?->nama_mapel ?? $m->nama_custom,
                    $m->jenis === 'pilihan' ? 'Pilihan' : 'Wajib',
                    $m->is_muatan_lokal ? 'Ya' : 'Tidak',
                    $m->is_projek ? 'Ya' : 'Tidak',
                    $m->jp_per_minggu,
                    $m->alokasi_jp_ganjil,
                    $m->alokasi_jp_genap,
                    $s->keterangan,
                ], null, "A{$rowIndex}");
                $rowIndex++;
            }
        }

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'struktur-kurikulum-'.now()->format('Y-m-d').'.xlsx';

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
        $sheet->setTitle('Import Struktur Kurikulum');

        $sheet->fromArray($this->kolomImportExport(), null, 'A1');
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);

        $sheet->fromArray([
            ['2026/2027', 'VII', 'D', 'Kurikulum Merdeka', 'Kelompok A (Umum)', 'Pendidikan Agama', 'Wajib', 'Tidak', 'Tidak', 3, 54, 54, ''],
            ['2026/2027', 'VII', 'D', 'Kurikulum Merdeka', 'Kelompok A (Umum)', 'Matematika', 'Wajib', 'Tidak', 'Tidak', 5, 90, 90, ''],
            ['2026/2027', 'VII', 'D', 'Kurikulum Merdeka', 'Muatan Lokal', 'Bahasa Sunda', 'Wajib', 'Ya', 'Tidak', 2, 36, 36, ''],
            ['2026/2027', 'VII', 'D', 'Kurikulum Merdeka', 'Projek Penguatan Profil Pelajar Pancasila', 'Projek Kearifan Lokal', 'Wajib', 'Tidak', 'Ya', 4, 72, 72, 'Baris dgn Tahun Ajaran+Tingkat+Fase+Kurikulum sama akan digabung jadi 1 struktur.'],
        ], null, 'A2');

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template-import-struktur-kurikulum.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import massal: baris dikelompokkan per kombinasi Tahun Ajaran +
     * Tingkat + Fase + Kurikulum menjadi satu struktur (header dibuat
     * sekali), setiap baris dalam grup menjadi satu baris mapel. Struktur
     * yang kombinasinya sudah ada dilewati (edit manual lewat form, bukan
     * ditimpa import, supaya tidak menghapus data secara tidak sengaja).
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

        $groups = [];
        $errors = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2;
            $tahunAjaranNama = $this->cleanString($row[0] ?? null);
            $tingkat = $this->cleanString($row[1] ?? null);
            $fase = $this->cleanString($row[2] ?? null);
            $kurikulum = $this->cleanString($row[3] ?? null);

            if ($tahunAjaranNama === null || $tingkat === null || $kurikulum === null) {
                $errors[] = "Baris {$line}: Tahun Ajaran, Tingkat, dan Kurikulum wajib diisi, dilewati.";

                continue;
            }

            $key = mb_strtolower($tahunAjaranNama.'|'.$tingkat.'|'.($fase ?? '').'|'.$kurikulum);
            $groups[$key]['header'] = compact('tahunAjaranNama', 'tingkat', 'fase', 'kurikulum');
            $groups[$key]['keterangan'] ??= $this->cleanString($row[12] ?? null);
            $groups[$key]['rows'][] = ['row' => $row, 'line' => $line];
        }

        $berhasilStruktur = 0;
        $berhasilMapel = 0;

        foreach ($groups as $group) {
            $header = $group['header'];

            $tahunAjaran = TahunAjaran::whereRaw('LOWER(nama) = ?', [mb_strtolower($header['tahunAjaranNama'])])->first();
            if (! $tahunAjaran) {
                foreach ($group['rows'] as $entry) {
                    $errors[] = "Baris {$entry['line']}: Tahun Ajaran \"{$header['tahunAjaranNama']}\" tidak ditemukan, dilewati.";
                }

                continue;
            }

            $existing = StrukturKurikulum::where('tahun_ajaran_id', $tahunAjaran->id)
                ->where('tingkat', $header['tingkat'])
                ->where('fase', $header['fase'])
                ->where('kurikulum', $header['kurikulum'])
                ->exists();

            if ($existing) {
                foreach ($group['rows'] as $entry) {
                    $errors[] = "Baris {$entry['line']}: Struktur kurikulum {$header['tahunAjaranNama']} / Tingkat {$header['tingkat']} / {$header['kurikulum']} sudah ada, dilewati.";
                }

                continue;
            }

            $mapelRows = [];
            foreach ($group['rows'] as $entry) {
                [, , , , $kelompok, $namaMapel, $jenis, $mulok, $projek, $jpMinggu, $jpGanjil, $jpGenap] = array_pad($entry['row'], 12, null);

                $namaMapel = $this->cleanString($namaMapel);
                if ($namaMapel === null) {
                    $errors[] = "Baris {$entry['line']}: Nama Mata Pelajaran kosong, baris dilewati.";

                    continue;
                }

                $mapelModel = MataPelajaran::whereRaw('LOWER(nama_mapel) = ?', [mb_strtolower($namaMapel)])->first();

                $mapelRows[] = [
                    'kelompok' => $this->cleanString($kelompok) ?? 'Kelompok Umum',
                    'mata_pelajaran_id' => $mapelModel?->id,
                    'nama_custom' => $mapelModel ? null : $namaMapel,
                    'jenis' => mb_strtolower((string) $this->cleanString($jenis)) === 'pilihan' ? 'pilihan' : 'wajib',
                    'is_muatan_lokal' => mb_strtolower((string) $this->cleanString($mulok)) === 'ya',
                    'is_projek' => mb_strtolower((string) $this->cleanString($projek)) === 'ya',
                    'jp_per_minggu' => (int) ($jpMinggu ?: 0),
                    'alokasi_jp_ganjil' => $jpGanjil !== null && $jpGanjil !== '' ? (int) $jpGanjil : null,
                    'alokasi_jp_genap' => $jpGenap !== null && $jpGenap !== '' ? (int) $jpGenap : null,
                ];
            }

            if (empty($mapelRows)) {
                $errors[] = "Struktur {$header['tahunAjaranNama']} / Tingkat {$header['tingkat']}: tidak ada baris mata pelajaran yang valid, dilewati.";

                continue;
            }

            try {
                DB::transaction(function () use ($tahunAjaran, $header, $group, $mapelRows, &$berhasilStruktur, &$berhasilMapel, $request) {
                    $struktur = StrukturKurikulum::create([
                        'tahun_ajaran_id' => $tahunAjaran->id,
                        'tingkat' => $header['tingkat'],
                        'fase' => $header['fase'],
                        'kurikulum' => $header['kurikulum'],
                        'keterangan' => $group['keterangan'] ?? null,
                        'dibuat_oleh' => $request->user()->id,
                    ]);

                    foreach ($mapelRows as $i => $row) {
                        $struktur->mapel()->create([...$row, 'urutan' => $i]);
                        $berhasilMapel++;
                    }

                    $berhasilStruktur++;
                });
            } catch (\Throwable $e) {
                report($e);
                $errors[] = "Struktur {$header['tahunAjaranNama']} / Tingkat {$header['tingkat']}: gagal diproses — ".$e->getMessage();
            }
        }

        return response()->json([
            'total_baris' => count($rows),
            'struktur_dibuat' => $berhasilStruktur,
            'mapel_ditambahkan' => $berhasilMapel,
            'gagal' => count($errors),
            'errors' => $errors,
        ]);
    }

    private function kolomImportExport(): array
    {
        return [
            'Tahun Ajaran', 'Tingkat', 'Fase', 'Kurikulum', 'Kelompok Mapel', 'Mata Pelajaran',
            'Jenis (Wajib/Pilihan)', 'Muatan Lokal (Ya/Tidak)', 'Projek (Ya/Tidak)',
            'JP per Minggu', 'Alokasi JP Ganjil', 'Alokasi JP Genap', 'Keterangan Struktur',
        ];
    }

    private function presentRingkas(StrukturKurikulum $s): array
    {
        return [
            'id' => $s->id,
            'tahun_ajaran_id' => $s->tahun_ajaran_id,
            'tahun_ajaran' => $s->tahunAjaran?->nama,
            'tingkat' => $s->tingkat,
            'fase' => $s->fase,
            'kurikulum' => $s->kurikulum,
            'keterangan' => $s->keterangan,
            'is_aktif' => $s->is_aktif,
            'jumlah_mapel' => $s->mapel->count(),
            'total_jp_per_minggu' => $s->mapel->sum('jp_per_minggu'),
            'created_at' => $s->created_at,
        ];
    }

    private function validateStruktur(Request $request): array
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'tingkat' => ['required', 'string', 'max:20'],
            'fase' => ['nullable', 'string', 'max:10'],
            'kurikulum' => ['required', 'string', 'max:100'],
            'keterangan' => ['nullable', 'string'],
            'mapel' => ['required', 'array', 'min:1'],
            'mapel.*.kelompok' => ['required', 'string', 'max:100'],
            'mapel.*.mata_pelajaran_id' => ['nullable', 'exists:mata_pelajaran,id'],
            'mapel.*.nama_custom' => ['nullable', 'string', 'max:255'],
            'mapel.*.jenis' => ['required', 'in:wajib,pilihan'],
            'mapel.*.is_muatan_lokal' => ['nullable', 'boolean'],
            'mapel.*.is_projek' => ['nullable', 'boolean'],
            'mapel.*.jp_per_minggu' => ['required', 'integer', 'min:0', 'max:100'],
            'mapel.*.alokasi_jp_ganjil' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'mapel.*.alokasi_jp_genap' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        foreach ($data['mapel'] as $i => $row) {
            if (empty($row['mata_pelajaran_id']) && trim((string) ($row['nama_custom'] ?? '')) === '') {
                throw ValidationException::withMessages([
                    "mapel.{$i}.nama_custom" => ['Pilih mata pelajaran dari daftar atau isi nama mata pelajaran/kegiatan.'],
                ]);
            }
        }

        return $data;
    }

    private function assertUnique(array $data, ?int $ignoreId): void
    {
        $exists = StrukturKurikulum::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('tingkat', $data['tingkat'])
            ->where('fase', $data['fase'] ?? null)
            ->where('kurikulum', $data['kurikulum'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'tingkat' => ['Struktur kurikulum untuk tahun ajaran, tingkat, fase, dan kurikulum ini sudah ada.'],
            ]);
        }
    }

    private function syncMapel(StrukturKurikulum $struktur, array $rows): void
    {
        $struktur->mapel()->delete();

        foreach ($rows as $i => $row) {
            $struktur->mapel()->create([
                'kelompok' => $row['kelompok'],
                'mata_pelajaran_id' => $row['mata_pelajaran_id'] ?? null,
                'nama_custom' => ! empty($row['mata_pelajaran_id']) ? null : ($row['nama_custom'] ?? null),
                'jenis' => $row['jenis'],
                'is_muatan_lokal' => $row['is_muatan_lokal'] ?? false,
                'is_projek' => $row['is_projek'] ?? false,
                'jp_per_minggu' => $row['jp_per_minggu'],
                'alokasi_jp_ganjil' => $row['alokasi_jp_ganjil'] ?? null,
                'alokasi_jp_genap' => $row['alokasi_jp_genap'] ?? null,
                'urutan' => $i,
            ]);
        }
    }

    private function cleanString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return $value === '' || $value === null ? null : (string) $value;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CapaianPembelajaran;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Capaian Pembelajaran (CP): deskripsi capaian per mata pelajaran, fase, dan
 * elemen untuk satu tahun ajaran. Setiap perubahan dicatat lewat activity
 * log (performedOn) supaya riwayat perubahan bisa ditampilkan per CP —
 * bukan sekadar timestamp updated_at, tapi jejak siapa mengubah apa.
 */
class CapaianPembelajaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cp = CapaianPembelajaran::query()
            ->with(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel'])
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
            ->when($request->filled('fase'), fn ($q) => $q->where('fase', $request->string('fase')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('cari'), function ($q) use ($request) {
                $cari = $request->string('cari');
                $q->where(fn ($qq) => $qq->where('elemen', 'like', "%{$cari}%")->orWhere('deskripsi', 'like', "%{$cari}%"));
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($cp);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateCp($request);
        $this->assertUnique($data, null);

        $cp = CapaianPembelajaran::create([
            ...$data,
            'dibuat_oleh' => $request->user()->id,
        ]);

        $cp->load(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel']);

        activity()
            ->performedOn($cp)
            ->causedBy($request->user())
            ->event('created')
            ->withProperties(['deskripsi' => $cp->deskripsi, 'status' => $cp->status])
            ->log("Menambahkan CP {$cp->mataPelajaran->nama_mapel} — Fase {$cp->fase} — {$cp->elemen}.");

        return response()->json($cp, 201);
    }

    public function show(CapaianPembelajaran $capaianPembelajaran): JsonResponse
    {
        $capaianPembelajaran->load(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel']);

        $riwayat = Activity::where('subject_type', CapaianPembelajaran::class)
            ->where('subject_id', $capaianPembelajaran->id)
            ->with('causer:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Activity $a) => [
                'id' => $a->id,
                'event' => $a->event,
                'description' => $a->description,
                'causer' => $a->causer?->name,
                'properties' => $a->properties,
                'created_at' => $a->created_at,
            ]);

        return response()->json([
            ...$capaianPembelajaran->toArray(),
            'riwayat' => $riwayat,
        ]);
    }

    public function update(Request $request, CapaianPembelajaran $capaianPembelajaran): JsonResponse
    {
        $data = $this->validateCp($request);
        $this->assertUnique($data, $capaianPembelajaran->id);

        $old = $capaianPembelajaran->only(['tahun_ajaran_id', 'mata_pelajaran_id', 'fase', 'elemen', 'deskripsi', 'status']);

        $capaianPembelajaran->update($data);
        $capaianPembelajaran->load(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel']);

        activity()
            ->performedOn($capaianPembelajaran)
            ->causedBy($request->user())
            ->event('updated')
            ->withProperties([
                'old' => $old,
                'new' => $capaianPembelajaran->only(['tahun_ajaran_id', 'mata_pelajaran_id', 'fase', 'elemen', 'deskripsi', 'status']),
            ])
            ->log("Memperbarui CP {$capaianPembelajaran->mataPelajaran->nama_mapel} — Fase {$capaianPembelajaran->fase} — {$capaianPembelajaran->elemen}.");

        return response()->json($capaianPembelajaran);
    }

    public function destroy(Request $request, CapaianPembelajaran $capaianPembelajaran): JsonResponse
    {
        $capaianPembelajaran->loadMissing('mataPelajaran:id,nama_mapel');
        $label = "{$capaianPembelajaran->mataPelajaran->nama_mapel} — Fase {$capaianPembelajaran->fase} — {$capaianPembelajaran->elemen}";

        activity()
            ->performedOn($capaianPembelajaran)
            ->causedBy($request->user())
            ->event('deleted')
            ->log("Menghapus CP {$label}.");

        $capaianPembelajaran->delete();

        return response()->json(['message' => 'Capaian Pembelajaran berhasil dihapus.']);
    }

    /**
     * Duplikasi satu CP ke tahun ajaran lain sebagai draf (status selalu
     * "draft" di hasil duplikasi supaya ditinjau ulang sebelum dipakai).
     */
    public function duplikasi(Request $request, CapaianPembelajaran $capaianPembelajaran): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
        ]);

        $this->assertUnique([
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'mata_pelajaran_id' => $capaianPembelajaran->mata_pelajaran_id,
            'fase' => $capaianPembelajaran->fase,
            'elemen' => $capaianPembelajaran->elemen,
        ], null);

        $salinan = CapaianPembelajaran::create([
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'mata_pelajaran_id' => $capaianPembelajaran->mata_pelajaran_id,
            'fase' => $capaianPembelajaran->fase,
            'elemen' => $capaianPembelajaran->elemen,
            'deskripsi' => $capaianPembelajaran->deskripsi,
            'status' => 'draft',
            'dibuat_oleh' => $request->user()->id,
        ]);

        $salinan->load(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel']);

        activity()
            ->performedOn($salinan)
            ->causedBy($request->user())
            ->event('created')
            ->withProperties(['duplikasi_dari' => $capaianPembelajaran->id])
            ->log("Menduplikasi CP dari #{$capaianPembelajaran->id} ke tahun ajaran lain.");

        return response()->json($salinan, 201);
    }

    public function export(Request $request): StreamedResponse
    {
        $cp = CapaianPembelajaran::query()
            ->with(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel'])
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->orderBy('fase')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Capaian Pembelajaran');

        $sheet->fromArray($this->kolomImportExport(), null, 'A1');
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);

        $rows = $cp->map(fn (CapaianPembelajaran $c) => [
            $c->tahunAjaran?->nama,
            $c->mataPelajaran?->nama_mapel,
            $c->fase,
            $c->elemen,
            $c->deskripsi,
            $this->statusLabel($c->status),
        ])->all();

        $sheet->fromArray($rows, null, 'A2');

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'capaian-pembelajaran-'.now()->format('Y-m-d').'.xlsx';

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
        $sheet->setTitle('Import CP');

        $sheet->fromArray($this->kolomImportExport(), null, 'A1');
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);

        $sheet->fromArray([
            [
                '2026/2027', 'Matematika Wajib', 'D', 'Bilangan',
                'Peserta didik dapat membaca, menulis, membandingkan, mengurutkan, dan melakukan operasi hitung bilangan bulat.',
                'Draft',
            ],
        ], null, 'A2');

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template-import-capaian-pembelajaran.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import massal: baris dengan kombinasi Tahun Ajaran + Mata Pelajaran +
     * Fase + Elemen yang sudah ada dilewati (edit manual, bukan ditimpa).
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
            [$tahunAjaranNama, $mapelNama, $fase, $elemen, $deskripsi, $status] = array_pad($row, 6, null);

            $tahunAjaranNama = $this->cleanString($tahunAjaranNama);
            $mapelNama = $this->cleanString($mapelNama);
            $fase = $this->cleanString($fase);
            $elemen = $this->cleanString($elemen);
            $deskripsi = $this->cleanString($deskripsi);

            if ($tahunAjaranNama === null || $mapelNama === null || $fase === null || $elemen === null || $deskripsi === null) {
                $errors[] = "Baris {$line}: Tahun Ajaran, Mata Pelajaran, Fase, Elemen, dan Deskripsi wajib diisi, dilewati.";

                continue;
            }

            $tahunAjaran = TahunAjaran::whereRaw('LOWER(nama) = ?', [mb_strtolower($tahunAjaranNama)])->first();
            if (! $tahunAjaran) {
                $errors[] = "Baris {$line}: Tahun Ajaran \"{$tahunAjaranNama}\" tidak ditemukan, dilewati.";

                continue;
            }

            $mapel = MataPelajaran::whereRaw('LOWER(nama_mapel) = ?', [mb_strtolower($mapelNama)])->first();
            if (! $mapel) {
                $errors[] = "Baris {$line}: Mata Pelajaran \"{$mapelNama}\" tidak ditemukan, dilewati.";

                continue;
            }

            $exists = CapaianPembelajaran::where('tahun_ajaran_id', $tahunAjaran->id)
                ->where('mata_pelajaran_id', $mapel->id)
                ->where('fase', $fase)
                ->where('elemen', $elemen)
                ->exists();

            if ($exists) {
                $errors[] = "Baris {$line}: CP {$mapelNama} — Fase {$fase} — {$elemen} sudah ada, dilewati.";

                continue;
            }

            try {
                $cp = CapaianPembelajaran::create([
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'mata_pelajaran_id' => $mapel->id,
                    'fase' => $fase,
                    'elemen' => $elemen,
                    'deskripsi' => $deskripsi,
                    'status' => $this->statusValue($status),
                    'dibuat_oleh' => $request->user()->id,
                ]);

                activity()
                    ->performedOn($cp)
                    ->causedBy($request->user())
                    ->event('created')
                    ->log("Menambahkan CP {$mapelNama} — Fase {$fase} — {$elemen} (import).");

                $berhasil++;
            } catch (\Throwable $e) {
                report($e);
                $errors[] = "Baris {$line}: gagal diproses — ".$e->getMessage();
            }
        }

        return response()->json([
            'total_baris' => count($rows),
            'berhasil' => $berhasil,
            'gagal' => count($errors),
            'errors' => $errors,
        ]);
    }

    private function validateCp(Request $request): array
    {
        return $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'fase' => ['required', 'string', 'max:10'],
            'elemen' => ['required', 'string', 'max:150'],
            'deskripsi' => ['required', 'string'],
            'status' => ['nullable', 'in:draft,aktif,nonaktif'],
        ]);
    }

    private function assertUnique(array $data, ?int $ignoreId): void
    {
        $exists = CapaianPembelajaran::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])
            ->where('fase', $data['fase'])
            ->where('elemen', $data['elemen'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'elemen' => ['CP untuk tahun ajaran, mata pelajaran, fase, dan elemen ini sudah ada.'],
            ]);
        }
    }

    private function kolomImportExport(): array
    {
        return ['Tahun Ajaran', 'Mata Pelajaran', 'Fase', 'Elemen', 'Deskripsi CP', 'Status'];
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'aktif' => 'Aktif',
            'nonaktif' => 'Nonaktif',
            default => 'Draft',
        };
    }

    private function statusValue(mixed $status): string
    {
        return match (mb_strtolower((string) $this->cleanString($status))) {
            'aktif' => 'aktif',
            'nonaktif' => 'nonaktif',
            default => 'draft',
        };
    }

    private function cleanString(mixed $value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return $value === '' || $value === null ? null : (string) $value;
    }
}

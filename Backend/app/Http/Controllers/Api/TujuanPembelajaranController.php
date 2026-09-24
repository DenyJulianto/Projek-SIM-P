<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CapaianPembelajaran;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use App\Models\TujuanPembelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Tujuan Pembelajaran (TP): turunan dari satu Capaian Pembelajaran (CP),
 * dipecah per tingkat/kelas & semester karena satu CP membentang satu fase
 * (beberapa tahun/kelas) sedangkan TP adalah unit ajar per kelas per
 * semester. "Progres" (belum diajarkan/berlangsung/selesai) terpisah dari
 * "status" (draft/aktif/nonaktif) — status menandai apakah TP ini dokumen
 * rencana yang dipakai, progres menandai realisasi pengajarannya di kelas.
 */
class TujuanPembelajaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TujuanPembelajaran::query()
            ->with(['capaianPembelajaran:id,tahun_ajaran_id,mata_pelajaran_id,fase,elemen', 'capaianPembelajaran.mataPelajaran:id,nama_mapel,kode_mapel', 'capaianPembelajaran.tahunAjaran:id,nama'])
            ->when($request->filled('capaian_pembelajaran_id'), fn ($q) => $q->where('capaian_pembelajaran_id', $request->integer('capaian_pembelajaran_id')))
            ->when($request->filled('mata_pelajaran_id'), function ($q) use ($request) {
                $q->whereHas('capaianPembelajaran', fn ($qq) => $qq->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')));
            })
            ->when($request->filled('tahun_ajaran_id'), function ($q) use ($request) {
                $q->whereHas('capaianPembelajaran', fn ($qq) => $qq->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')));
            })
            ->when($request->filled('fase'), function ($q) use ($request) {
                $q->whereHas('capaianPembelajaran', fn ($qq) => $qq->where('fase', $request->string('fase')));
            })
            ->when($request->filled('tingkat'), fn ($q) => $q->where('tingkat', $request->string('tingkat')))
            ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('progres'), fn ($q) => $q->where('progres', $request->string('progres')))
            ->when($request->filled('cari'), function ($q) use ($request) {
                $cari = $request->string('cari');
                $q->where(fn ($qq) => $qq->where('deskripsi', 'like', "%{$cari}%")->orWhere('materi_terkait', 'like', "%{$cari}%"));
            });

        $progresSummary = (clone $query)->get(['progres'])->groupBy('progres')->map->count();
        $total = $progresSummary->sum();

        $tp = $query->orderBy('tingkat')->orderBy('semester')->orderBy('urutan')->paginate($request->integer('per_page', 20));

        return response()->json([
            ...$tp->toArray(),
            'progres_summary' => [
                'total' => $total,
                'belum_diajarkan' => $progresSummary->get('belum_diajarkan', 0),
                'berlangsung' => $progresSummary->get('berlangsung', 0),
                'selesai' => $progresSummary->get('selesai', 0),
                'persen_selesai' => $total > 0 ? round(($progresSummary->get('selesai', 0) / $total) * 100) : 0,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateTp($request);
        $this->assertUnique($data, null);

        $tp = TujuanPembelajaran::create([
            ...$data,
            'dibuat_oleh' => $request->user()->id,
        ]);
        $tp->load(['capaianPembelajaran.mataPelajaran:id,nama_mapel,kode_mapel', 'capaianPembelajaran.tahunAjaran:id,nama']);

        activity()
            ->performedOn($tp)
            ->causedBy($request->user())
            ->event('created')
            ->log("Menambahkan TP #{$tp->urutan} — {$tp->capaianPembelajaran->mataPelajaran->nama_mapel} — Tingkat {$tp->tingkat}.");

        return response()->json($tp, 201);
    }

    public function show(TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        $tujuanPembelajaran->load(['capaianPembelajaran.mataPelajaran:id,nama_mapel,kode_mapel', 'capaianPembelajaran.tahunAjaran:id,nama']);

        return response()->json($tujuanPembelajaran);
    }

    public function update(Request $request, TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        $data = $this->validateTp($request);
        $this->assertUnique($data, $tujuanPembelajaran->id);

        $tujuanPembelajaran->update($data);
        $tujuanPembelajaran->load(['capaianPembelajaran.mataPelajaran:id,nama_mapel,kode_mapel', 'capaianPembelajaran.tahunAjaran:id,nama']);

        activity()
            ->performedOn($tujuanPembelajaran)
            ->causedBy($request->user())
            ->event('updated')
            ->log("Memperbarui TP #{$tujuanPembelajaran->urutan} — {$tujuanPembelajaran->capaianPembelajaran->mataPelajaran->nama_mapel} — Tingkat {$tujuanPembelajaran->tingkat}.");

        return response()->json($tujuanPembelajaran);
    }

    public function destroy(Request $request, TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        $label = "#{$tujuanPembelajaran->urutan} — Tingkat {$tujuanPembelajaran->tingkat}";

        activity()
            ->performedOn($tujuanPembelajaran)
            ->causedBy($request->user())
            ->event('deleted')
            ->log("Menghapus TP {$label}.");

        $tujuanPembelajaran->delete();

        return response()->json(['message' => 'Tujuan Pembelajaran berhasil dihapus.']);
    }

    public function updateProgres(Request $request, TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        $data = $request->validate([
            'progres' => ['required', 'in:belum_diajarkan,berlangsung,selesai'],
        ]);

        $tujuanPembelajaran->update(['progres' => $data['progres']]);

        activity()
            ->performedOn($tujuanPembelajaran)
            ->causedBy($request->user())
            ->event('updated')
            ->log("Mengubah progres TP #{$tujuanPembelajaran->urutan} menjadi \"{$data['progres']}\".");

        return response()->json($tujuanPembelajaran);
    }

    /**
     * Duplikasi satu TP ke CP tujuan (bisa CP yang sama untuk kelas/semester
     * lain, atau CP lain — mis. mapel yang sama di tahun ajaran berikutnya).
     * Nomor urut otomatis mengikuti urutan berikutnya yang tersedia di CP
     * tujuan supaya tidak langsung bentrok validasi unik.
     */
    public function duplikasi(Request $request, TujuanPembelajaran $tujuanPembelajaran): JsonResponse
    {
        $data = $request->validate([
            'capaian_pembelajaran_id' => ['required', 'exists:capaian_pembelajaran,id'],
            'tingkat' => ['nullable', 'string', 'max:20'],
            'semester' => ['nullable', 'in:ganjil,genap'],
        ]);

        $tingkat = $data['tingkat'] ?? $tujuanPembelajaran->tingkat;
        $semester = $data['semester'] ?? $tujuanPembelajaran->semester;

        $urutanBerikutnya = 1 + (int) TujuanPembelajaran::where('capaian_pembelajaran_id', $data['capaian_pembelajaran_id'])
            ->where('tingkat', $tingkat)
            ->where('semester', $semester)
            ->max('urutan');

        $salinan = TujuanPembelajaran::create([
            'capaian_pembelajaran_id' => $data['capaian_pembelajaran_id'],
            'tingkat' => $tingkat,
            'semester' => $semester,
            'urutan' => $urutanBerikutnya,
            'deskripsi' => $tujuanPembelajaran->deskripsi,
            'materi_terkait' => $tujuanPembelajaran->materi_terkait,
            'alokasi_waktu' => $tujuanPembelajaran->alokasi_waktu,
            'status' => 'draft',
            'progres' => 'belum_diajarkan',
            'dibuat_oleh' => $request->user()->id,
        ]);
        $salinan->load(['capaianPembelajaran.mataPelajaran:id,nama_mapel,kode_mapel', 'capaianPembelajaran.tahunAjaran:id,nama']);

        activity()
            ->performedOn($salinan)
            ->causedBy($request->user())
            ->event('created')
            ->withProperties(['duplikasi_dari' => $tujuanPembelajaran->id])
            ->log("Menduplikasi TP dari #{$tujuanPembelajaran->id}.");

        return response()->json($salinan, 201);
    }

    public function export(Request $request): StreamedResponse
    {
        $tp = TujuanPembelajaran::query()
            ->with(['capaianPembelajaran.mataPelajaran:id,nama_mapel', 'capaianPembelajaran.tahunAjaran:id,nama'])
            ->when($request->filled('capaian_pembelajaran_id'), fn ($q) => $q->where('capaian_pembelajaran_id', $request->integer('capaian_pembelajaran_id')))
            ->orderBy('tingkat')->orderBy('semester')->orderBy('urutan')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Tujuan Pembelajaran');

        $sheet->fromArray($this->kolomImportExport(), null, 'A1');
        $sheet->getStyle('A1:K1')->getFont()->setBold(true);

        $rows = $tp->map(fn (TujuanPembelajaran $t) => [
            $t->capaianPembelajaran->tahunAjaran?->nama,
            $t->capaianPembelajaran->mataPelajaran?->nama_mapel,
            $t->capaianPembelajaran->fase,
            $t->capaianPembelajaran->elemen,
            $t->tingkat,
            $t->semester === 'genap' ? 'Genap' : 'Ganjil',
            $t->urutan,
            $t->deskripsi,
            $t->materi_terkait,
            $t->alokasi_waktu,
            $this->statusLabel($t->status),
        ])->all();

        $sheet->fromArray($rows, null, 'A2');

        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'tujuan-pembelajaran-'.now()->format('Y-m-d').'.xlsx';

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
        $sheet->setTitle('Import TP');

        $sheet->fromArray($this->kolomImportExport(), null, 'A1');
        $sheet->getStyle('A1:K1')->getFont()->setBold(true);

        $sheet->fromArray([
            [
                '2026/2027', 'Matematika Wajib', 'D', 'Bilangan', 'VII', 'Ganjil', 1,
                'Peserta didik dapat membaca dan menulis bilangan bulat.', 'Bilangan Bulat', 4, 'Draft',
            ],
        ], null, 'A2');

        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'template-import-tujuan-pembelajaran.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import massal: CP tujuan dicari lewat kombinasi Tahun Ajaran + Mata
     * Pelajaran + Fase + Elemen (harus sudah ada — TP tidak bisa membuat
     * CP baru secara implisit). Baris dengan kombinasi CP + Tingkat +
     * Semester + Nomor Urut yang sudah ada dilewati.
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
            [$tahunAjaranNama, $mapelNama, $fase, $elemen, $tingkat, $semesterRaw, $urutan, $deskripsi, $materi, $alokasi, $status] = array_pad($row, 11, null);

            $tahunAjaranNama = $this->cleanString($tahunAjaranNama);
            $mapelNama = $this->cleanString($mapelNama);
            $fase = $this->cleanString($fase);
            $elemen = $this->cleanString($elemen);
            $tingkat = $this->cleanString($tingkat);
            $deskripsi = $this->cleanString($deskripsi);
            $semester = mb_strtolower((string) $this->cleanString($semesterRaw)) === 'genap' ? 'genap' : 'ganjil';

            if ($tahunAjaranNama === null || $mapelNama === null || $fase === null || $elemen === null || $tingkat === null || $deskripsi === null) {
                $errors[] = "Baris {$line}: Tahun Ajaran, Mata Pelajaran, Fase, Elemen, Tingkat, dan Deskripsi wajib diisi, dilewati.";

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

            $cp = CapaianPembelajaran::where('tahun_ajaran_id', $tahunAjaran->id)
                ->where('mata_pelajaran_id', $mapel->id)
                ->where('fase', $fase)
                ->where('elemen', $elemen)
                ->first();

            if (! $cp) {
                $errors[] = "Baris {$line}: CP {$mapelNama} — Fase {$fase} — {$elemen} ({$tahunAjaranNama}) tidak ditemukan. Tambahkan CP-nya terlebih dahulu.";

                continue;
            }

            $urutanValue = $urutan !== null && $urutan !== '' ? (int) $urutan : 1;

            $exists = TujuanPembelajaran::where('capaian_pembelajaran_id', $cp->id)
                ->where('tingkat', $tingkat)
                ->where('semester', $semester)
                ->where('urutan', $urutanValue)
                ->exists();

            if ($exists) {
                $errors[] = "Baris {$line}: TP #{$urutanValue} untuk {$mapelNama} — Tingkat {$tingkat} — Semester {$semester} sudah ada, dilewati.";

                continue;
            }

            try {
                $tp = TujuanPembelajaran::create([
                    'capaian_pembelajaran_id' => $cp->id,
                    'tingkat' => $tingkat,
                    'semester' => $semester,
                    'urutan' => $urutanValue,
                    'deskripsi' => $deskripsi,
                    'materi_terkait' => $this->cleanString($materi),
                    'alokasi_waktu' => $alokasi !== null && $alokasi !== '' ? (int) $alokasi : null,
                    'status' => $this->statusValue($status),
                    'dibuat_oleh' => $request->user()->id,
                ]);

                activity()
                    ->performedOn($tp)
                    ->causedBy($request->user())
                    ->event('created')
                    ->log("Menambahkan TP #{$urutanValue} — {$mapelNama} — Tingkat {$tingkat} (import).");

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

    private function validateTp(Request $request): array
    {
        return $request->validate([
            'capaian_pembelajaran_id' => ['required', 'exists:capaian_pembelajaran,id'],
            'tingkat' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'in:ganjil,genap'],
            'urutan' => ['required', 'integer', 'min:1', 'max:9999'],
            'deskripsi' => ['required', 'string'],
            'materi_terkait' => ['nullable', 'string', 'max:255'],
            'alokasi_waktu' => ['nullable', 'integer', 'min:0', 'max:200'],
            'status' => ['nullable', 'in:draft,aktif,nonaktif'],
            'progres' => ['nullable', 'in:belum_diajarkan,berlangsung,selesai'],
        ]);
    }

    private function assertUnique(array $data, ?int $ignoreId): void
    {
        $exists = TujuanPembelajaran::where('capaian_pembelajaran_id', $data['capaian_pembelajaran_id'])
            ->where('tingkat', $data['tingkat'])
            ->where('semester', $data['semester'])
            ->where('urutan', $data['urutan'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'urutan' => ['Nomor urut TP ini sudah dipakai untuk CP, tingkat, dan semester yang sama.'],
            ]);
        }
    }

    private function kolomImportExport(): array
    {
        return ['Tahun Ajaran', 'Mata Pelajaran', 'Fase', 'Elemen', 'Tingkat/Kelas', 'Semester', 'Nomor Urut', 'Deskripsi TP', 'Materi Terkait', 'Alokasi Waktu (JP)', 'Status'];
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

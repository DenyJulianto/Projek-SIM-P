<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\KompetensiIndikator;
use App\Models\ProgramSemester;
use App\Models\TujuanPembelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Program Semester: rencana pembelajaran satu semester untuk satu kelas dan
 * mata pelajaran. Setiap baris menempatkan TP/indikator/materi pada minggu,
 * bulan, dan rentang tanggal tertentu dengan alokasi JP dan status
 * pelaksanaannya. Menyimpan ulang mengganti seluruh baris (form mengirim
 * daftar lengkap). Dokumen punya status draft -> diajukan -> disahkan, dan
 * setiap perubahan dicatat di activity log (riwayat) termasuk ringkasan
 * perubahan baris.
 */
class ProgramSemesterController extends Controller
{
    private const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    private const HEADER_TRACKED = ['tahun_ajaran_id', 'semester', 'kelas_id', 'fase', 'mata_pelajaran_id', 'guru_id', 'catatan'];

    public function index(Request $request): JsonResponse
    {
        $data = ProgramSemester::query()
            ->with(['tahunAjaran:id,nama', 'kelas:id,nama_kelas,tingkat', 'mataPelajaran:id,nama_mapel,kode_mapel', 'guru:id,nama'])
            ->withCount('item')
            ->withSum('item as total_jp', 'alokasi_jp')
            ->withCount(['item as item_terlaksana' => fn ($q) => $q->where('status_pelaksanaan', 'terlaksana')])
            ->withSum(['item as jp_terlaksana' => fn ($q) => $q->where('status_pelaksanaan', 'terlaksana')], 'alokasi_jp')
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
            ->when($request->filled('guru_id'), fn ($q) => $q->where('guru_id', $request->integer('guru_id')))
            ->when($request->filled('status_dokumen'), fn ($q) => $q->where('status_dokumen', $request->string('status_dokumen')))
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateProgram($request);
        $this->assertUnique($data, null);
        $this->assertTautan($data);

        $program = DB::transaction(function () use ($data, $request) {
            $program = ProgramSemester::create([...$this->header($data), 'dibuat_oleh' => $request->user()->id]);
            $this->syncItem($program, $data['item']);

            return $program;
        });

        activity()->performedOn($program)->causedBy($request->user())->event('created')
            ->withProperties(['new' => $this->ringkas($program->fresh('item'))])
            ->log("Menyusun Program Semester {$this->label($program)}.");

        return response()->json($this->muat($program), 201);
    }

    public function show(ProgramSemester $programSemester): JsonResponse
    {
        $riwayat = Activity::where('subject_type', ProgramSemester::class)
            ->where('subject_id', $programSemester->id)
            ->with('causer:id,name')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Activity $a) => [
                'id' => $a->id,
                'event' => $a->event,
                'description' => $a->description,
                'causer' => $a->causer?->name,
                'properties' => $a->properties,
                'created_at' => $a->created_at,
            ]);

        $program = $this->muat($programSemester);

        return response()->json([...$program->toArray(), 'progress' => $this->progress($program), 'riwayat' => $riwayat]);
    }

    public function update(Request $request, ProgramSemester $programSemester): JsonResponse
    {
        $data = $this->validateProgram($request);
        $this->assertUnique($data, $programSemester->id);
        $this->assertTautan($data);

        $programSemester->load('item');
        $lama = $this->ringkas($programSemester);
        $barisLama = $programSemester->item->map(fn ($i) => $this->baris($i->toArray()))->all();
        $sudahDisahkan = $programSemester->status_dokumen === 'disahkan';

        DB::transaction(function () use ($programSemester, $data) {
            $programSemester->update($this->header($data));
            $this->syncItem($programSemester, $data['item']);
        });

        $programSemester->refresh()->load('item');

        activity()->performedOn($programSemester)->causedBy($request->user())->event('updated')
            ->withProperties([
                'old' => $lama,
                'new' => $this->ringkas($programSemester),
                'baris' => $this->bandingkanBaris($barisLama, $programSemester->item->map(fn ($i) => $this->baris($i->toArray()))->all()),
                'setelah_disahkan' => $sudahDisahkan,
            ])
            ->log("Memperbarui Program Semester {$this->label($programSemester)}".($sudahDisahkan ? ' (dokumen sudah disahkan).' : '.'));

        return response()->json($this->muat($programSemester));
    }

    public function destroy(Request $request, ProgramSemester $programSemester): JsonResponse
    {
        $label = $this->label($programSemester);

        activity()->performedOn($programSemester)->causedBy($request->user())->event('deleted')
            ->log("Menghapus Program Semester {$label}.");

        $programSemester->delete();

        return response()->json(['message' => 'Program Semester berhasil dihapus.']);
    }

    public function updateStatusDokumen(Request $request, ProgramSemester $programSemester): JsonResponse
    {
        $data = $request->validate(['status_dokumen' => ['required', 'in:draft,diajukan,disahkan']]);

        $lama = $programSemester->status_dokumen;
        $disahkan = $data['status_dokumen'] === 'disahkan';

        $programSemester->update([
            'status_dokumen' => $data['status_dokumen'],
            'disahkan_oleh' => $disahkan ? $request->user()->id : null,
            'tanggal_pengesahan' => $disahkan ? now() : null,
        ]);

        activity()->performedOn($programSemester)->causedBy($request->user())->event('updated')
            ->withProperties(['old' => ['status_dokumen' => $lama], 'new' => ['status_dokumen' => $data['status_dokumen']]])
            ->log("Mengubah status dokumen Program Semester {$this->label($programSemester)} menjadi \"{$data['status_dokumen']}\".");

        return response()->json($this->muat($programSemester));
    }

    public function export(ProgramSemester $programSemester): StreamedResponse
    {
        $p = $this->muat($programSemester);
        $progress = $this->progress($p);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Program Semester');

        $info = [
            ['PROGRAM SEMESTER'],
            ['Tahun Ajaran', $p->tahunAjaran?->nama],
            ['Semester', ucfirst($p->semester)],
            ['Kelas / Fase', ($p->kelas?->nama_kelas ?? '-').($p->fase ? " / Fase {$p->fase}" : '')],
            ['Mata Pelajaran', $p->mataPelajaran?->nama_mapel],
            ['Guru Pengampu', $p->guru?->nama ?? '-'],
            ['Status Dokumen', ucfirst($p->status_dokumen)],
            ['Progres Pelaksanaan', "{$progress['persen_baris']}% ({$progress['baris_terlaksana']}/{$progress['baris_total']} baris), {$progress['persen_jp']}% JP"],
        ];
        $sheet->fromArray($info, null, 'A1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $headerRow = count($info) + 2;
        $sheet->fromArray(['No', 'Minggu ke-', 'Bulan', 'Rentang Tanggal', 'Tujuan Pembelajaran', 'Indikator', 'Materi', 'JP', 'Rencana Pembelajaran', 'Status Pelaksanaan', 'Catatan'], null, "A{$headerRow}");
        $sheet->getStyle("A{$headerRow}:K{$headerRow}")->getFont()->setBold(true);

        $rows = [];
        foreach ($p->item as $i => $it) {
            $rows[] = [
                $i + 1,
                $it->minggu_ke,
                self::BULAN[$it->bulan] ?? $it->bulan,
                $this->rentang($it->tanggal_mulai?->format('Y-m-d'), $it->tanggal_selesai?->format('Y-m-d')),
                $it->tujuanPembelajaran ? "{$it->tujuanPembelajaran->tingkat} #{$it->tujuanPembelajaran->urutan} — {$it->tujuanPembelajaran->deskripsi}" : '',
                $it->indikator?->deskripsi,
                $it->materi,
                $it->alokasi_jp,
                $it->rencana_pembelajaran,
                $this->labelStatus($it->status_pelaksanaan),
                $it->catatan,
            ];
        }
        $sheet->fromArray($rows, null, 'A'.($headerRow + 1));

        $totalRow = $headerRow + count($rows) + 1;
        $sheet->setCellValue("G{$totalRow}", 'Total JP');
        $sheet->setCellValue("H{$totalRow}", $progress['jp_total']);
        $sheet->getStyle("G{$totalRow}:H{$totalRow}")->getFont()->setBold(true);

        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $nama = 'program-semester-'.str($p->mataPelajaran?->kode_mapel ?? 'mapel')->slug().'-'.str($p->kelas?->nama_kelas ?? 'kelas')->slug().'-'.$p->semester.'.xlsx';

        return response()->streamDownload(fn () => $writer->save('php://output'), $nama, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Pilihan untuk form: guru (role Kurikulum tidak punya akses ke resource
     * /guru milik pegawai) dan TP sekonteks beserta indikatornya — tahun
     * ajaran, mata pelajaran, semester sama, dan tingkat sama dengan kelas
     * bila kelas punya tingkat.
     */
    public function opsi(Request $request): JsonResponse
    {
        $guru = Guru::orderBy('nama')->get(['id', 'nama']);

        $tp = collect();
        if ($request->filled(['tahun_ajaran_id', 'mata_pelajaran_id', 'semester'])) {
            $tingkat = $request->filled('kelas_id') ? Kelas::whereKey($request->integer('kelas_id'))->value('tingkat') : null;

            $tp = TujuanPembelajaran::query()
                ->whereHas('capaianPembelajaran', fn ($q) => $q
                    ->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id'))
                    ->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
                ->where('semester', $request->string('semester'))
                ->when($tingkat, fn ($q) => $q->where('tingkat', $tingkat))
                ->with('indikator:id,tujuan_pembelajaran_id,urutan,deskripsi')
                ->orderBy('tingkat')->orderBy('urutan')
                ->get(['id', 'tingkat', 'urutan', 'deskripsi', 'materi_terkait', 'alokasi_waktu']);
        }

        return response()->json(['guru' => $guru, 'tujuan_pembelajaran' => $tp]);
    }

    private function validateProgram(Request $request): array
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'kelas_id' => ['required', 'exists:kelas,id'],
            'fase' => ['nullable', 'string', 'max:10'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'guru_id' => ['nullable', 'exists:guru,id'],
            'catatan' => ['nullable', 'string'],
            'item' => ['required', 'array', 'min:1'],
            'item.*.tujuan_pembelajaran_id' => ['nullable', 'exists:tujuan_pembelajaran,id'],
            'item.*.indikator_id' => ['nullable', 'exists:tp_indikator,id'],
            'item.*.materi' => ['nullable', 'string', 'max:255'],
            'item.*.alokasi_jp' => ['required', 'integer', 'min:0', 'max:50'],
            'item.*.minggu_ke' => ['required', 'integer', 'min:1', 'max:30'],
            'item.*.bulan' => ['required', 'integer', 'min:1', 'max:12'],
            'item.*.tanggal_mulai' => ['nullable', 'date'],
            'item.*.tanggal_selesai' => ['nullable', 'date'],
            'item.*.rencana_pembelajaran' => ['nullable', 'string'],
            'item.*.status_pelaksanaan' => ['nullable', 'in:belum_terlaksana,berjalan,terlaksana,ditunda'],
            'item.*.catatan' => ['nullable', 'string'],
        ]);

        foreach ($data['item'] as $i => $row) {
            if (empty($row['tujuan_pembelajaran_id']) && trim((string) ($row['materi'] ?? '')) === '') {
                throw ValidationException::withMessages(["item.{$i}.materi" => ['Pilih TP atau isi materi untuk baris ini.']]);
            }
            if (! empty($row['indikator_id']) && empty($row['tujuan_pembelajaran_id'])) {
                throw ValidationException::withMessages(["item.{$i}.indikator_id" => ['Pilih TP terlebih dahulu sebelum memilih indikator.']]);
            }
            if (! empty($row['tanggal_mulai']) && ! empty($row['tanggal_selesai']) && $row['tanggal_selesai'] < $row['tanggal_mulai']) {
                throw ValidationException::withMessages(["item.{$i}.tanggal_selesai" => ['Tanggal selesai tidak boleh sebelum tanggal mulai.']]);
            }
        }

        return $data;
    }

    private function assertUnique(array $data, ?int $ignoreId): void
    {
        $exists = ProgramSemester::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('semester', $data['semester'])
            ->where('kelas_id', $data['kelas_id'])
            ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'kelas_id' => ['Program Semester untuk tahun ajaran, semester, kelas, dan mata pelajaran ini sudah ada.'],
            ]);
        }
    }

    /**
     * TP harus sekonteks (tahun ajaran, mapel, semester) dan indikator harus
     * milik TP yang dipilih pada baris yang sama.
     */
    private function assertTautan(array $data): void
    {
        $ids = collect($data['item'])->pluck('tujuan_pembelajaran_id')->filter()->unique()->values();
        if ($ids->isNotEmpty()) {
            $valid = TujuanPembelajaran::whereIn('id', $ids)
                ->where('semester', $data['semester'])
                ->whereHas('capaianPembelajaran', fn ($q) => $q
                    ->where('tahun_ajaran_id', $data['tahun_ajaran_id'])
                    ->where('mata_pelajaran_id', $data['mata_pelajaran_id']))
                ->count();

            if ($valid !== $ids->count()) {
                throw ValidationException::withMessages([
                    'item' => ['Ada TP yang tidak sesuai dengan tahun ajaran, mata pelajaran, dan semester yang dipilih.'],
                ]);
            }
        }

        foreach ($data['item'] as $i => $row) {
            if (empty($row['indikator_id'])) {
                continue;
            }
            $milikTp = KompetensiIndikator::whereKey($row['indikator_id'])
                ->where('tujuan_pembelajaran_id', $row['tujuan_pembelajaran_id'])
                ->exists();
            if (! $milikTp) {
                throw ValidationException::withMessages(["item.{$i}.indikator_id" => ['Indikator tidak termasuk TP yang dipilih.']]);
            }
        }
    }

    private function header(array $data): array
    {
        return [
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'semester' => $data['semester'],
            'kelas_id' => $data['kelas_id'],
            'fase' => $data['fase'] ?? null,
            'mata_pelajaran_id' => $data['mata_pelajaran_id'],
            'guru_id' => $data['guru_id'] ?? null,
            'catatan' => $data['catatan'] ?? null,
        ];
    }

    private function syncItem(ProgramSemester $program, array $rows): void
    {
        $program->item()->delete();

        foreach ($rows as $i => $row) {
            $program->item()->create([
                'tujuan_pembelajaran_id' => $row['tujuan_pembelajaran_id'] ?? null,
                'indikator_id' => $row['indikator_id'] ?? null,
                'materi' => $row['materi'] ?? null,
                'alokasi_jp' => $row['alokasi_jp'],
                'minggu_ke' => $row['minggu_ke'],
                'bulan' => $row['bulan'],
                'tanggal_mulai' => $row['tanggal_mulai'] ?? null,
                'tanggal_selesai' => $row['tanggal_selesai'] ?? null,
                'rencana_pembelajaran' => $row['rencana_pembelajaran'] ?? null,
                'status_pelaksanaan' => $row['status_pelaksanaan'] ?? 'belum_terlaksana',
                'catatan' => $row['catatan'] ?? null,
                'urutan' => $i,
            ]);
        }
    }

    private function muat(ProgramSemester $program): ProgramSemester
    {
        return $program->load([
            'tahunAjaran:id,nama',
            'kelas:id,nama_kelas,tingkat',
            'mataPelajaran:id,nama_mapel,kode_mapel',
            'guru:id,nama',
            'disahkanOleh:id,name',
            'item.tujuanPembelajaran:id,tingkat,urutan,deskripsi',
            'item.indikator:id,tujuan_pembelajaran_id,urutan,deskripsi',
        ]);
    }

    /**
     * Progres pelaksanaan dihitung dari status tiap baris: persen baris
     * terlaksana dan persen JP terlaksana (bobot JP, lebih mencerminkan
     * beban mengajar daripada sekadar jumlah baris).
     */
    private function progress(ProgramSemester $program): array
    {
        $item = $program->item;
        $jpTotal = (int) $item->sum('alokasi_jp');
        $jpTerlaksana = (int) $item->where('status_pelaksanaan', 'terlaksana')->sum('alokasi_jp');
        $baris = $item->count();
        $terlaksana = $item->where('status_pelaksanaan', 'terlaksana')->count();

        return [
            'baris_total' => $baris,
            'baris_terlaksana' => $terlaksana,
            'baris_berjalan' => $item->where('status_pelaksanaan', 'berjalan')->count(),
            'baris_ditunda' => $item->where('status_pelaksanaan', 'ditunda')->count(),
            'jp_total' => $jpTotal,
            'jp_terlaksana' => $jpTerlaksana,
            'persen_baris' => $baris > 0 ? (int) round($terlaksana / $baris * 100) : 0,
            'persen_jp' => $jpTotal > 0 ? (int) round($jpTerlaksana / $jpTotal * 100) : 0,
        ];
    }

    private function ringkas(ProgramSemester $program): array
    {
        $program->loadMissing('item');
        $progress = $this->progress($program);

        return [
            ...$program->only(self::HEADER_TRACKED),
            'status_dokumen' => $program->status_dokumen,
            'jumlah_baris' => $progress['baris_total'],
            'total_jp' => $progress['jp_total'],
            'baris_terlaksana' => $progress['baris_terlaksana'],
        ];
    }

    private function baris(array $item): array
    {
        return [
            'sig' => md5(json_encode([
                $item['tujuan_pembelajaran_id'] ?? null, $item['indikator_id'] ?? null, $item['materi'] ?? null,
                $item['alokasi_jp'], $item['minggu_ke'], $item['bulan'],
                isset($item['tanggal_mulai']) ? substr((string) $item['tanggal_mulai'], 0, 10) : null,
                isset($item['tanggal_selesai']) ? substr((string) $item['tanggal_selesai'], 0, 10) : null,
                $item['rencana_pembelajaran'] ?? null,
            ])),
            'status' => $item['status_pelaksanaan'] ?? 'belum_terlaksana',
            'catatan' => $item['catatan'] ?? null,
        ];
    }

    /**
     * Ringkasan perubahan baris (karena baris disimpan ulang seluruhnya,
     * dibandingkan lewat sidik isi): berapa ditambah, dihapus, dan berapa
     * yang isinya tetap tetapi status pelaksanaan/catatannya berubah.
     */
    private function bandingkanBaris(array $lama, array $baru): array
    {
        $grup = fn (array $rows) => collect($rows)->groupBy('sig')->map(fn ($g) => $g->values()->all())->all();
        $l = $grup($lama);
        $b = $grup($baru);

        $ditambah = $dihapus = $statusBerubah = 0;
        foreach (array_unique([...array_keys($l), ...array_keys($b)]) as $sig) {
            $lo = $l[$sig] ?? [];
            $ba = $b[$sig] ?? [];
            $sama = min(count($lo), count($ba));
            for ($k = 0; $k < $sama; $k++) {
                if ($lo[$k]['status'] !== $ba[$k]['status'] || $lo[$k]['catatan'] !== $ba[$k]['catatan']) {
                    $statusBerubah++;
                }
            }
            $ditambah += max(0, count($ba) - $sama);
            $dihapus += max(0, count($lo) - $sama);
        }

        return ['ditambah' => $ditambah, 'dihapus' => $dihapus, 'status_atau_catatan_berubah' => $statusBerubah];
    }

    private function rentang(?string $mulai, ?string $selesai): string
    {
        if (! $mulai && ! $selesai) {
            return '';
        }
        $fmt = fn (string $d) => date('d/m/Y', strtotime($d));

        if ($mulai && $selesai && $mulai !== $selesai) {
            return $fmt($mulai).' – '.$fmt($selesai);
        }

        return $fmt($mulai ?? $selesai);
    }

    private function labelStatus(string $status): string
    {
        return match ($status) {
            'berjalan' => 'Berjalan',
            'terlaksana' => 'Terlaksana',
            'ditunda' => 'Ditunda',
            default => 'Belum Terlaksana',
        };
    }

    private function label(ProgramSemester $program): string
    {
        $program->loadMissing(['mataPelajaran:id,nama_mapel', 'kelas:id,nama_kelas']);

        return ($program->mataPelajaran?->nama_mapel ?? '-').' — '.($program->kelas?->nama_kelas ?? '-')." — Semester {$program->semester}";
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HariEfektif;
use App\Models\HariEfektifPeriode;
use App\Models\Semester;
use App\Models\TahunAjaran;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Hari efektif per tahun ajaran & semester. Satu periode = rentang tanggal
 * semester; setiap tanggal di dalamnya punya jenis: efektif, libur, kegiatan
 * sekolah, ujian, atau lainnya. Hanya jenis "efektif" yang dihitung sebagai
 * hari/minggu efektif pembelajaran. Rekap dihitung dari data, bukan disimpan.
 *
 * Generate otomatis memakai rentang tanggal semester dari data Semester
 * (kalender akademik) dan hari sekolah 5/6 hari per minggu; hari di luar
 * hari sekolah ditandai libur (akhir pekan). Libur nasional/cuti bersama
 * tidak diisi otomatis — sistem tidak punya sumber datanya — dan ditandai
 * manual atau lewat import.
 */
class HariEfektifController extends Controller
{
    private const JENIS = ['efektif', 'libur', 'kegiatan_sekolah', 'ujian', 'lainnya'];

    private const JENIS_LABEL = [
        'efektif' => 'Hari Efektif',
        'libur' => 'Libur',
        'kegiatan_sekolah' => 'Kegiatan Sekolah',
        'ujian' => 'Ujian',
        'lainnya' => 'Lainnya',
    ];

    private const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    private const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    private const LOG = 'hari-efektif';

    public function opsi(): JsonResponse
    {
        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'semester' => Semester::get(['tahun_ajaran_id', 'nama', 'tanggal_mulai', 'tanggal_selesai'])->map(fn (Semester $s) => [
                'tahun_ajaran_id' => $s->tahun_ajaran_id,
                'semester' => strtolower($s->nama),
                'tanggal_mulai' => $s->tanggal_mulai?->toDateString(),
                'tanggal_selesai' => $s->tanggal_selesai?->toDateString(),
            ])->values(),
            'jenis' => collect(self::JENIS_LABEL)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
        ]);
    }

    /** Periode (bila sudah ada) beserta rekap dan seluruh tanggalnya. */
    public function show(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->kunci($request);
        $periode = $this->cariPeriode($ta, $semester);
        if (! $periode) {
            return response()->json(['periode' => null]);
        }

        $hari = $periode->hari()
            ->when($request->filled('jenis'), fn ($q) => $q->where('jenis', $request->string('jenis')->value()))
            ->when($request->filled('bulan'), fn ($q) => $q->where('tanggal', 'like', $request->string('bulan')->value().'-%'))
            ->when($request->filled('search'), fn ($q) => $q->where('keterangan', 'like', '%'.$request->string('search')->trim().'%'))
            ->get();

        return response()->json([
            'periode' => $this->presentPeriode($periode),
            'rekap' => $this->rekap($periode),
            'hari' => $hari->map(fn (HariEfektif $h) => $this->presentHari($h))->values(),
        ]);
    }

    /** Buat/ubah periode saja (tanpa mengisi tanggal). */
    public function simpanPeriode(Request $request): JsonResponse
    {
        $data = $this->validatePeriode($request);
        $periode = $this->upsertPeriode($data, $request);

        return response()->json($this->presentPeriode($periode));
    }

    /**
     * Isi otomatis seluruh tanggal periode. Tanggal yang sudah ada dibiarkan
     * (edit manual tidak tertimpa) kecuali timpa=true.
     */
    public function generate(Request $request): JsonResponse
    {
        $data = $this->validatePeriode($request, true);
        $timpa = (bool) ($data['timpa'] ?? false);
        unset($data['timpa']);

        $jumlah = 0;
        DB::transaction(function () use ($data, $request, $timpa, &$jumlah, &$periode) {
            $periode = $this->upsertPeriode($data, $request, false);
            if ($timpa) {
                HariEfektif::where('periode_id', $periode->id)->delete();
            } else {
                HariEfektif::where('periode_id', $periode->id)
                    ->where(fn ($q) => $q->where('tanggal', '<', $data['tanggal_mulai'])->orWhere('tanggal', '>', $data['tanggal_selesai']))
                    ->delete();
            }

            $ada = $periode->hari()->pluck('tanggal')->map(fn ($t) => substr((string) $t, 0, 10))->flip();
            $baris = [];
            $now = now();
            for ($d = Carbon::parse($data['tanggal_mulai']); $d->lte(Carbon::parse($data['tanggal_selesai'])); $d->addDay()) {
                $tanggal = $d->toDateString();
                if ($ada->has($tanggal)) {
                    continue;
                }
                $hariSekolah = $this->hariSekolah($d, (int) $data['hari_sekolah']);
                $baris[] = [
                    'periode_id' => $periode->id,
                    'tanggal' => $tanggal,
                    'jenis' => $hariSekolah ? 'efektif' : 'libur',
                    'keterangan' => $hariSekolah ? null : 'Akhir pekan',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            foreach (array_chunk($baris, 200) as $chunk) {
                HariEfektif::insert($chunk);
            }
            $jumlah = count($baris);
        });

        $this->log($request, $periode, 'generated', "Generate otomatis hari efektif ({$jumlah} tanggal) untuk {$this->label($periode)}.", [
            'tanggal_mulai' => $data['tanggal_mulai'],
            'tanggal_selesai' => $data['tanggal_selesai'],
            'hari_sekolah' => $data['hari_sekolah'],
            'timpa' => $timpa,
            'dibuat' => $jumlah,
        ]);

        return response()->json(['message' => "{$jumlah} tanggal dibuat.", 'dibuat' => $jumlah, 'periode' => $this->presentPeriode($periode->refresh())]);
    }

    public function store(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->kunci($request);
        $periode = $this->periodeAda($ta, $semester);
        $data = $request->validate([
            'tanggal' => ['required', 'date_format:Y-m-d'],
            'jenis' => ['required', 'in:'.implode(',', self::JENIS)],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);
        $this->assertDalamPeriode($periode, $data['tanggal']);

        if ($periode->hari()->where('tanggal', $data['tanggal'])->exists()) {
            throw ValidationException::withMessages(['tanggal' => 'Tanggal tersebut sudah ada. Gunakan Edit untuk mengubahnya.']);
        }

        $hari = $periode->hari()->create($data);
        $this->log($request, $periode, 'created', "Menambahkan tanggal {$data['tanggal']} sebagai ".self::JENIS_LABEL[$data['jenis']].'.', [
            'new' => $this->snapshot($hari),
        ]);

        return response()->json($this->presentHari($hari), 201);
    }

    public function update(Request $request, HariEfektif $hariEfektif): JsonResponse
    {
        $periode = $hariEfektif->periode;
        $data = $request->validate([
            'tanggal' => ['required', 'date_format:Y-m-d'],
            'jenis' => ['required', 'in:'.implode(',', self::JENIS)],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);
        $this->assertDalamPeriode($periode, $data['tanggal']);

        if ($periode->hari()->where('tanggal', $data['tanggal'])->where('id', '!=', $hariEfektif->id)->exists()) {
            throw ValidationException::withMessages(['tanggal' => 'Tanggal tersebut sudah ada pada periode ini.']);
        }

        $old = $this->snapshot($hariEfektif);
        $hariEfektif->update($data);
        $new = $this->snapshot($hariEfektif->refresh());

        if ($old !== $new) {
            $this->log($request, $periode, 'updated', "Mengubah tanggal {$old['tanggal']} ({$this->label($periode)}).", ['old' => $old, 'new' => $new]);
        }

        return response()->json($this->presentHari($hariEfektif));
    }

    public function destroy(Request $request, HariEfektif $hariEfektif): JsonResponse
    {
        $periode = $hariEfektif->periode;
        $old = $this->snapshot($hariEfektif);
        $hariEfektif->delete();
        $this->log($request, $periode, 'deleted', "Menghapus tanggal {$old['tanggal']} ({$this->label($periode)}).", ['old' => $old]);

        return response()->json(['message' => 'Tanggal dihapus.']);
    }

    /**
     * Tandai rentang tanggal dengan satu jenis (mis. libur Lebaran, kegiatan
     * sekolah, ujian). Tanggal yang belum ada dibuat, yang sudah ada diubah.
     * Bila hanya_hari_sekolah=true, akhir pekan di rentang itu dilewati.
     */
    public function tandai(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->kunci($request);
        $periode = $this->periodeAda($ta, $semester);
        $data = $request->validate([
            'tanggal_mulai' => ['required', 'date_format:Y-m-d'],
            'tanggal_selesai' => ['required', 'date_format:Y-m-d', 'after_or_equal:tanggal_mulai'],
            'jenis' => ['required', 'in:'.implode(',', self::JENIS)],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'hanya_hari_sekolah' => ['boolean'],
        ]);
        $this->assertDalamPeriode($periode, $data['tanggal_mulai']);
        $this->assertDalamPeriode($periode, $data['tanggal_selesai']);

        $hanyaSekolah = (bool) ($data['hanya_hari_sekolah'] ?? false);
        $jumlah = 0;
        DB::transaction(function () use ($periode, $data, $hanyaSekolah, &$jumlah) {
            for ($d = Carbon::parse($data['tanggal_mulai']); $d->lte(Carbon::parse($data['tanggal_selesai'])); $d->addDay()) {
                if ($hanyaSekolah && ! $this->hariSekolah($d, (int) $periode->hari_sekolah)) {
                    continue;
                }
                HariEfektif::updateOrCreate(
                    ['periode_id' => $periode->id, 'tanggal' => $d->toDateString()],
                    ['jenis' => $data['jenis'], 'keterangan' => $data['keterangan'] ?? null],
                );
                $jumlah++;
            }
        });

        $this->log($request, $periode, 'marked', "Menandai {$jumlah} tanggal ({$data['tanggal_mulai']} s.d. {$data['tanggal_selesai']}) sebagai ".self::JENIS_LABEL[$data['jenis']].'.', [
            'tanggal_mulai' => $data['tanggal_mulai'],
            'tanggal_selesai' => $data['tanggal_selesai'],
            'jenis' => $data['jenis'],
            'keterangan' => $data['keterangan'] ?? null,
            'jumlah' => $jumlah,
        ]);

        return response()->json(['message' => "{$jumlah} tanggal ditandai.", 'jumlah' => $jumlah]);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->kunci($request);
        $periode = $this->periodeAda($ta, $semester);
        $status = $request->validate(['status' => ['required', 'in:draft,final']])['status'];

        if ($status === 'final' && ! $periode->hari()->exists()) {
            throw ValidationException::withMessages(['status' => 'Periode belum memiliki tanggal. Generate atau tambahkan tanggal terlebih dahulu.']);
        }

        $lama = $periode->status;
        $periode->update(['status' => $status]);
        if ($lama !== $status) {
            $this->log($request, $periode, 'status', "Mengubah status hari efektif {$this->label($periode)} dari {$lama} menjadi {$status}.", [
                'old' => ['status' => $lama],
                'new' => ['status' => $status],
            ]);
        }

        return response()->json($this->presentPeriode($periode));
    }

    public function riwayat(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->kunci($request);
        $periode = $this->cariPeriode($ta, $semester);
        if (! $periode) {
            return response()->json([]);
        }

        return response()->json(
            Activity::where('log_name', self::LOG)
                ->where('subject_type', HariEfektifPeriode::class)
                ->where('subject_id', $periode->id)
                ->with('causer:id,name')
                ->orderByDesc('created_at')->orderByDesc('id')
                ->limit(200)->get()
                ->map(fn (Activity $a) => [
                    'id' => $a->id,
                    'event' => $a->event,
                    'description' => $a->description,
                    'causer' => $a->causer?->name,
                    'properties' => $a->properties,
                    'created_at' => $a->created_at,
                ])
        );
    }

    public function export(Request $request): StreamedResponse
    {
        [$ta, $semester] = $this->kunci($request);
        $periode = $this->periodeAda($ta, $semester);
        $rekap = $this->rekap($periode);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Rekap');
        $sheet->fromArray([
            ['Tahun Ajaran', $periode->tahunAjaran?->nama],
            ['Semester', ucfirst($semester)],
            ['Periode', "{$periode->tanggal_mulai} s.d. {$periode->tanggal_selesai}"],
            ['Hari Sekolah / Minggu', $periode->hari_sekolah],
            ['Status', ucfirst($periode->status)],
            ['Jumlah Hari Efektif', $rekap['total']['hari_efektif']],
            ['Jumlah Minggu Efektif (ada hari efektif)', $rekap['total']['minggu_efektif']],
            ['Setara Minggu Penuh', $rekap['total']['setara_minggu']],
            [],
            ['Bulan', 'Hari Efektif', 'Libur', 'Kegiatan Sekolah', 'Ujian', 'Lainnya'],
        ], null, 'A1');
        $sheet->getStyle('A10:F10')->getFont()->setBold(true);
        $row = 11;
        foreach ($rekap['per_bulan'] as $b) {
            $sheet->fromArray([$b['nama'], $b['efektif'], $b['libur'], $b['kegiatan_sekolah'], $b['ujian'], $b['lainnya']], null, "A{$row}");
            $row++;
        }
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $detail = $spreadsheet->createSheet();
        $detail->setTitle('Tanggal');
        $detail->fromArray(['Tanggal', 'Hari', 'Bulan', 'Jenis', 'Keterangan'], null, 'A1');
        $detail->getStyle('A1:E1')->getFont()->setBold(true);
        $detail->fromArray(
            $periode->hari()->get()->map(fn (HariEfektif $h) => [
                $h->tanggal,
                self::HARI[Carbon::parse($h->tanggal)->dayOfWeek],
                self::BULAN[Carbon::parse($h->tanggal)->month],
                self::JENIS_LABEL[$h->jenis],
                $h->keterangan,
            ])->all(),
            null,
            'A2'
        );
        foreach (range('A', 'E') as $col) {
            $detail->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), "hari-efektif-{$periode->tahunAjaran?->id}-{$semester}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import Hari Efektif');
        $sheet->fromArray(['Tanggal (YYYY-MM-DD)', 'Jenis', 'Keterangan'], null, 'A1');
        $sheet->getStyle('A1:C1')->getFont()->setBold(true);
        $sheet->getStyle('A2:A400')->getNumberFormat()->setFormatCode('@');
        $sheet->fromArray([
            ['2026-08-17', 'Libur', 'Hari Kemerdekaan'],
            ['2026-09-10', 'Ujian', 'Penilaian Tengah Semester'],
            ['2026-09-20', 'Kegiatan Sekolah', 'Class meeting'],
        ], null, 'A2');
        $sheet->setCellValue('E1', 'Jenis yang dikenali: '.implode(', ', self::JENIS_LABEL));
        foreach (['A', 'B', 'C'] as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'template-import-hari-efektif.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /** Import jenis/keterangan per tanggal ke periode yang sudah ada. */
    public function import(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->kunci($request);
        $periode = $this->periodeAda($ta, $semester);
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120']]);

        $rows = IOFactory::load($request->file('file')->getRealPath())->getActiveSheet()->toArray(null, true, true, false);
        array_shift($rows);
        if (count($rows) > 500) {
            return response()->json(['message' => 'Maksimal 500 baris per file.'], 422);
        }

        $peta = collect(self::JENIS_LABEL)->flatMap(fn ($label, $key) => [
            mb_strtolower($label) => $key,
            $key => $key,
            str_replace('_', ' ', $key) => $key,
        ]);

        $berhasil = 0;
        $errors = [];
        DB::transaction(function () use ($rows, $periode, $peta, &$berhasil, &$errors) {
            foreach ($rows as $i => $row) {
                $line = $i + 2;
                if (trim((string) ($row[0] ?? '')) === '' && trim((string) ($row[1] ?? '')) === '') {
                    continue;
                }
                $tanggal = $this->parseTanggal($row[0] ?? null);
                $jenis = $peta->get(mb_strtolower(trim((string) ($row[1] ?? ''))));
                if (! $tanggal) {
                    $errors[] = "Baris {$line}: tanggal tidak valid.";
                } elseif (! $jenis) {
                    $errors[] = "Baris {$line}: jenis \"{$row[1]}\" tidak dikenali.";
                } elseif ($tanggal < $periode->tanggal_mulai || $tanggal > $periode->tanggal_selesai) {
                    $errors[] = "Baris {$line}: {$tanggal} di luar periode ({$periode->tanggal_mulai} s.d. {$periode->tanggal_selesai}).";
                } else {
                    $keterangan = trim((string) ($row[2] ?? ''));
                    HariEfektif::updateOrCreate(
                        ['periode_id' => $periode->id, 'tanggal' => $tanggal],
                        ['jenis' => $jenis, 'keterangan' => $keterangan !== '' ? mb_substr($keterangan, 0, 255) : null],
                    );
                    $berhasil++;
                }
            }
        });

        if ($berhasil > 0) {
            $this->log($request, $periode, 'imported', "Mengimpor {$berhasil} tanggal hari efektif ({$this->label($periode)}).", ['jumlah' => $berhasil]);
        }

        return response()->json(['message' => "{$berhasil} tanggal diimpor.", 'berhasil' => $berhasil, 'errors' => $errors]);
    }

    /** @return array{0: int, 1: string} */
    private function kunci(Request $request): array
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
        ]);

        return [(int) $data['tahun_ajaran_id'], $data['semester']];
    }

    private function cariPeriode(int $ta, string $semester): ?HariEfektifPeriode
    {
        return HariEfektifPeriode::with('tahunAjaran:id,nama')->where('tahun_ajaran_id', $ta)->where('semester', $semester)->first();
    }

    private function periodeAda(int $ta, string $semester): HariEfektifPeriode
    {
        return $this->cariPeriode($ta, $semester) ?? throw ValidationException::withMessages([
            'semester' => 'Periode hari efektif belum dibuat. Gunakan Generate Otomatis atau atur periode terlebih dahulu.',
        ]);
    }

    private function validatePeriode(Request $request, bool $denganTimpa = false): array
    {
        [$ta, $semester] = $this->kunci($request);

        $data = $request->validate([
            'tanggal_mulai' => ['nullable', 'date_format:Y-m-d'],
            'tanggal_selesai' => ['nullable', 'date_format:Y-m-d'],
            'hari_sekolah' => ['required', 'integer', 'in:5,6'],
            'catatan' => ['nullable', 'string', 'max:2000'],
            ...($denganTimpa ? ['timpa' => ['boolean']] : []),
        ]);

        // Bila tanggal tidak diisi, ambil dari kalender akademik (data Semester).
        if (empty($data['tanggal_mulai']) || empty($data['tanggal_selesai'])) {
            $sem = Semester::where('tahun_ajaran_id', $ta)->where('nama', ucfirst($semester))->first();
            if (! $sem) {
                throw ValidationException::withMessages([
                    'tanggal_mulai' => "Semester {$semester} belum terdaftar di kalender akademik untuk tahun ajaran ini. Isi tanggal mulai dan selesai secara manual.",
                ]);
            }
            $data['tanggal_mulai'] ??= $sem->tanggal_mulai->toDateString();
            $data['tanggal_selesai'] ??= $sem->tanggal_selesai->toDateString();
        }

        if ($data['tanggal_selesai'] < $data['tanggal_mulai']) {
            throw ValidationException::withMessages(['tanggal_selesai' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.']);
        }
        if (Carbon::parse($data['tanggal_mulai'])->diffInDays(Carbon::parse($data['tanggal_selesai'])) > 250) {
            throw ValidationException::withMessages(['tanggal_selesai' => 'Rentang periode terlalu panjang untuk satu semester (maksimal 250 hari).']);
        }

        return $data + ['tahun_ajaran_id' => $ta, 'semester' => $semester];
    }

    private function upsertPeriode(array $data, Request $request, bool $log = true): HariEfektifPeriode
    {
        $periode = HariEfektifPeriode::where('tahun_ajaran_id', $data['tahun_ajaran_id'])->where('semester', $data['semester'])->first();
        $nilai = collect($data)->only(['tanggal_mulai', 'tanggal_selesai', 'hari_sekolah', 'catatan'])->all();

        if ($periode) {
            $old = $this->snapshotPeriode($periode);
            $periode->update($nilai);
            $new = $this->snapshotPeriode($periode->refresh());
            if ($log && $old !== $new) {
                $this->log($request, $periode, 'updated', "Memperbarui periode hari efektif {$this->label($periode)}.", ['old' => $old, 'new' => $new]);
            }
        } else {
            $periode = HariEfektifPeriode::create($nilai + [
                'tahun_ajaran_id' => $data['tahun_ajaran_id'],
                'semester' => $data['semester'],
                'dibuat_oleh' => $request->user()?->id,
            ]);
            if ($log) {
                $this->log($request, $periode, 'created', "Membuat periode hari efektif {$this->label($periode)}.", ['new' => $this->snapshotPeriode($periode)]);
            }
        }

        return $periode->load('tahunAjaran:id,nama');
    }

    private function hariSekolah(Carbon $tanggal, int $hariSekolah): bool
    {
        $dow = $tanggal->dayOfWeekIso; // 1=Senin ... 7=Minggu

        return $dow <= $hariSekolah;
    }

    private function assertDalamPeriode(HariEfektifPeriode $periode, string $tanggal): void
    {
        if ($tanggal < $periode->tanggal_mulai || $tanggal > $periode->tanggal_selesai) {
            throw ValidationException::withMessages([
                'tanggal' => "Tanggal {$tanggal} di luar periode ({$periode->tanggal_mulai} s.d. {$periode->tanggal_selesai}).",
            ]);
        }
    }

    private function parseTanggal(mixed $nilai): ?string
    {
        if ($nilai === null || $nilai === '') {
            return null;
        }
        if (is_numeric($nilai)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $nilai))->toDateString();
            } catch (\Throwable) {
                return null;
            }
        }
        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y'] as $format) {
            try {
                $d = Carbon::createFromFormat($format, trim((string) $nilai));
            } catch (\Throwable) {
                continue;
            }
            if ($d && $d->format($format) === trim((string) $nilai)) {
                return $d->toDateString();
            }
        }

        return null;
    }

    /** Rekap hari/minggu efektif, total dan per bulan. */
    public function rekap(HariEfektifPeriode $periode): array
    {
        $items = $periode->hari()->get(['tanggal', 'jenis']);
        $nol = array_fill_keys(self::JENIS, 0);

        $perBulan = $items->groupBy(fn ($h) => substr((string) $h->tanggal, 0, 7))->map(function ($group, $key) use ($nol) {
            $hitung = $group->countBy('jenis')->all() + $nol;
            [$tahun, $bulan] = explode('-', $key);

            return ['bulan' => $key, 'nama' => self::BULAN[(int) $bulan].' '.$tahun] + $hitung + ['hari_efektif' => $hitung['efektif']];
        })->values();

        $total = $items->countBy('jenis')->all() + $nol;
        $mingguEfektif = $items->where('jenis', 'efektif')
            ->map(fn ($h) => Carbon::parse($h->tanggal)->startOfWeek()->toDateString())->unique()->count();
        $hariSekolah = max(1, (int) $periode->hari_sekolah);

        return [
            'total' => [
                'hari_efektif' => $total['efektif'],
                'libur' => $total['libur'],
                'kegiatan_sekolah' => $total['kegiatan_sekolah'],
                'ujian' => $total['ujian'],
                'lainnya' => $total['lainnya'],
                'jumlah_tanggal' => $items->count(),
                'minggu_efektif' => $mingguEfektif,
                'setara_minggu' => round($total['efektif'] / $hariSekolah, 1),
            ],
            'per_bulan' => $perBulan,
        ];
    }

    private function presentPeriode(HariEfektifPeriode $p): array
    {
        return [
            'id' => $p->id,
            'tahun_ajaran_id' => $p->tahun_ajaran_id,
            'tahun_ajaran' => $p->tahunAjaran?->nama,
            'semester' => $p->semester,
            'tanggal_mulai' => substr((string) $p->tanggal_mulai, 0, 10),
            'tanggal_selesai' => substr((string) $p->tanggal_selesai, 0, 10),
            'hari_sekolah' => (int) $p->hari_sekolah,
            'status' => $p->status,
            'catatan' => $p->catatan,
        ];
    }

    private function presentHari(HariEfektif $h): array
    {
        $tanggal = Carbon::parse($h->tanggal);

        return [
            'id' => $h->id,
            'tanggal' => $tanggal->toDateString(),
            'hari' => self::HARI[$tanggal->dayOfWeek],
            'bulan' => self::BULAN[$tanggal->month].' '.$tanggal->year,
            'bulan_key' => $tanggal->format('Y-m'),
            'jenis' => $h->jenis,
            'jenis_label' => self::JENIS_LABEL[$h->jenis],
            'keterangan' => $h->keterangan,
        ];
    }

    private function snapshot(HariEfektif $h): array
    {
        return [
            'tanggal' => substr((string) $h->tanggal, 0, 10),
            'jenis' => self::JENIS_LABEL[$h->jenis],
            'keterangan' => $h->keterangan,
        ];
    }

    private function snapshotPeriode(HariEfektifPeriode $p): array
    {
        return [
            'tanggal_mulai' => substr((string) $p->tanggal_mulai, 0, 10),
            'tanggal_selesai' => substr((string) $p->tanggal_selesai, 0, 10),
            'hari_sekolah' => (int) $p->hari_sekolah,
            'catatan' => $p->catatan,
        ];
    }

    private function label(HariEfektifPeriode $p): string
    {
        $p->loadMissing('tahunAjaran:id,nama');

        return "{$p->tahunAjaran?->nama} semester {$p->semester}";
    }

    private function log(Request $request, HariEfektifPeriode $periode, string $event, string $deskripsi, array $properties): void
    {
        activity(self::LOG)
            ->performedOn($periode)
            ->causedBy($request->user())
            ->event($event)
            ->withProperties($properties + ($periode->status === 'final' ? ['setelah_final' => true] : []))
            ->log($deskripsi);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\KompetensiIndikator;
use App\Models\MataPelajaran;
use App\Models\ProgramTahunan;
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
 * Program Tahunan (Prota): rencana pembelajaran satu tahun ajaran untuk satu
 * kelas dan mata pelajaran, mencakup dua semester. Setiap baris menempatkan
 * TP/indikator/materi pada semester dan rentang bulan tertentu dengan
 * alokasi JP dan status pelaksanaan. Jumlah minggu efektif per semester
 * dicatat di header dan dibandingkan dengan alokasi JP mata pelajaran.
 * Dokumen: draft -> diajukan -> terverifikasi; setiap perubahan tercatat
 * di activity log sebagai riwayat.
 */
class ProgramTahunanController extends Controller
{
    private const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    private const BULAN_SEMESTER = ['ganjil' => [7, 8, 9, 10, 11, 12], 'genap' => [1, 2, 3, 4, 5, 6]];

    private const HEADER_TRACKED = ['tahun_ajaran_id', 'kelas_id', 'fase', 'mata_pelajaran_id', 'guru_id', 'minggu_efektif_ganjil', 'minggu_efektif_genap', 'catatan'];

    public function index(Request $request): JsonResponse
    {
        $data = ProgramTahunan::query()
            ->with(['tahunAjaran:id,nama', 'kelas:id,nama_kelas,tingkat', 'mataPelajaran:id,nama_mapel,kode_mapel', 'guru:id,nama'])
            ->withCount('item')
            ->withSum('item as total_jp', 'alokasi_jp')
            ->withCount(['item as item_terlaksana' => fn ($q) => $q->where('status_pelaksanaan', 'terlaksana')])
            ->withSum(['item as jp_terlaksana' => fn ($q) => $q->where('status_pelaksanaan', 'terlaksana')], 'alokasi_jp')
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->filled('fase'), fn ($q) => $q->where('fase', $request->string('fase')))
            ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
            ->when($request->filled('guru_id'), fn ($q) => $q->where('guru_id', $request->integer('guru_id')))
            ->when($request->filled('status_dokumen'), fn ($q) => $q->where('status_dokumen', $request->string('status_dokumen')))
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateProta($request);
        $this->assertUnique($data, null);
        $this->assertTautan($data);

        $prota = DB::transaction(function () use ($data, $request) {
            $prota = ProgramTahunan::create([...$this->header($data), 'dibuat_oleh' => $request->user()->id]);
            $this->syncItem($prota, $data['item']);

            return $prota;
        });

        activity()->performedOn($prota)->causedBy($request->user())->event('created')
            ->withProperties(['new' => $this->ringkas($prota->fresh('item'))])
            ->log("Menyusun Program Tahunan {$this->label($prota)}.");

        return response()->json($this->muat($prota), 201);
    }

    public function show(ProgramTahunan $programTahunan): JsonResponse
    {
        $riwayat = Activity::where('subject_type', ProgramTahunan::class)
            ->where('subject_id', $programTahunan->id)
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

        $prota = $this->muat($programTahunan);

        return response()->json([...$prota->toArray(), 'progress' => $this->progress($prota), 'riwayat' => $riwayat]);
    }

    public function update(Request $request, ProgramTahunan $programTahunan): JsonResponse
    {
        $data = $this->validateProta($request);
        $this->assertUnique($data, $programTahunan->id);
        $this->assertTautan($data);

        $programTahunan->load('item');
        $lama = $this->ringkas($programTahunan);
        $barisLama = $programTahunan->item->map(fn ($i) => $this->baris($i->toArray()))->all();
        $sudahTerverifikasi = $programTahunan->status_dokumen === 'terverifikasi';

        DB::transaction(function () use ($programTahunan, $data) {
            $programTahunan->update($this->header($data));
            $this->syncItem($programTahunan, $data['item']);
        });

        $programTahunan->refresh()->load('item');

        activity()->performedOn($programTahunan)->causedBy($request->user())->event('updated')
            ->withProperties([
                'old' => $lama,
                'new' => $this->ringkas($programTahunan),
                'baris' => $this->bandingkanBaris($barisLama, $programTahunan->item->map(fn ($i) => $this->baris($i->toArray()))->all()),
                'setelah_terverifikasi' => $sudahTerverifikasi,
            ])
            ->log("Memperbarui Program Tahunan {$this->label($programTahunan)}".($sudahTerverifikasi ? ' (dokumen sudah terverifikasi).' : '.'));

        return response()->json($this->muat($programTahunan));
    }

    public function destroy(Request $request, ProgramTahunan $programTahunan): JsonResponse
    {
        $label = $this->label($programTahunan);

        activity()->performedOn($programTahunan)->causedBy($request->user())->event('deleted')
            ->log("Menghapus Program Tahunan {$label}.");

        $programTahunan->delete();

        return response()->json(['message' => 'Program Tahunan berhasil dihapus.']);
    }

    public function updateStatusDokumen(Request $request, ProgramTahunan $programTahunan): JsonResponse
    {
        $data = $request->validate([
            'status_dokumen' => ['required', 'in:draft,diajukan,terverifikasi'],
            'catatan_verifikasi' => ['nullable', 'string'],
        ]);

        $lama = $programTahunan->status_dokumen;
        $verifikasi = $data['status_dokumen'] === 'terverifikasi';

        $programTahunan->update([
            'status_dokumen' => $data['status_dokumen'],
            'diverifikasi_oleh' => $verifikasi ? $request->user()->id : null,
            'tanggal_verifikasi' => $verifikasi ? now() : null,
            'catatan_verifikasi' => $data['catatan_verifikasi'] ?? null,
        ]);

        activity()->performedOn($programTahunan)->causedBy($request->user())->event('updated')
            ->withProperties([
                'old' => ['status_dokumen' => $lama],
                'new' => ['status_dokumen' => $data['status_dokumen'], 'catatan_verifikasi' => $data['catatan_verifikasi'] ?? null],
            ])
            ->log("Mengubah status dokumen Program Tahunan {$this->label($programTahunan)} menjadi \"{$data['status_dokumen']}\".");

        return response()->json($this->muat($programTahunan));
    }

    public function export(ProgramTahunan $programTahunan): StreamedResponse
    {
        $p = $this->muat($programTahunan);
        $progress = $this->progress($p);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Program Tahunan');

        $info = [
            ['PROGRAM TAHUNAN'],
            ['Tahun Ajaran', $p->tahunAjaran?->nama],
            ['Kelas / Fase', ($p->kelas?->nama_kelas ?? '-').($p->fase ? " / Fase {$p->fase}" : '')],
            ['Mata Pelajaran', $p->mataPelajaran?->nama_mapel],
            ['Guru Pengampu', $p->guru?->nama ?? '-'],
            ['Minggu Efektif', 'Ganjil: '.($p->minggu_efektif_ganjil ?? '-').' | Genap: '.($p->minggu_efektif_genap ?? '-')],
            ['Status Dokumen', ucfirst($p->status_dokumen)],
            ['Progres Pelaksanaan', "{$progress['persen_baris']}% baris, {$progress['persen_jp']}% JP"],
        ];
        $sheet->fromArray($info, null, 'A1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $headerRow = count($info) + 2;
        $sheet->fromArray(['No', 'Semester', 'Bulan Pelaksanaan', 'Tujuan Pembelajaran', 'Indikator', 'Materi', 'JP', 'Status Pelaksanaan', 'Catatan'], null, "A{$headerRow}");
        $sheet->getStyle("A{$headerRow}:I{$headerRow}")->getFont()->setBold(true);

        $rows = [];
        foreach ($p->item as $i => $it) {
            $rows[] = [
                $i + 1,
                ucfirst($it->semester),
                $this->rentangBulan($it->bulan_mulai, $it->bulan_selesai),
                $it->tujuanPembelajaran ? "{$it->tujuanPembelajaran->tingkat} #{$it->tujuanPembelajaran->urutan} — {$it->tujuanPembelajaran->deskripsi}" : '',
                $it->indikator?->deskripsi,
                $it->materi,
                $it->alokasi_jp,
                $this->labelStatus($it->status_pelaksanaan),
                $it->catatan,
            ];
        }
        $sheet->fromArray($rows, null, 'A'.($headerRow + 1));

        $r = $headerRow + count($rows) + 2;
        foreach (['ganjil', 'genap'] as $sem) {
            $s = $progress['semester'][$sem];
            $sheet->setCellValue("F{$r}", 'Total JP Semester '.ucfirst($sem));
            $sheet->setCellValue("G{$r}", $s['jp_total']);
            $r++;
        }
        $sheet->setCellValue("F{$r}", 'Total JP Setahun');
        $sheet->setCellValue("G{$r}", $progress['jp_total']);
        $sheet->getStyle("F".($r - 2).":G{$r}")->getFont()->setBold(true);

        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $nama = 'program-tahunan-'.str($p->mataPelajaran?->kode_mapel ?? 'mapel')->slug().'-'.str($p->kelas?->nama_kelas ?? 'kelas')->slug().'.xlsx';

        return response()->streamDownload(fn () => $writer->save('php://output'), $nama, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Pilihan form: guru (role Kurikulum tidak punya akses ke /guru milik
     * pegawai), alokasi JP default mapel, dan TP sekonteks (tahun ajaran
     * dan mapel sama, tingkat sama dengan kelas bila kelas punya tingkat)
     * untuk kedua semester beserta indikatornya.
     */
    public function opsi(Request $request): JsonResponse
    {
        $guru = Guru::orderBy('nama')->get(['id', 'nama']);
        $jpDefault = $request->filled('mata_pelajaran_id')
            ? MataPelajaran::whereKey($request->integer('mata_pelajaran_id'))->value('alokasi_jp_default')
            : null;

        $tp = collect();
        if ($request->filled(['tahun_ajaran_id', 'mata_pelajaran_id'])) {
            $tingkat = $request->filled('kelas_id') ? Kelas::whereKey($request->integer('kelas_id'))->value('tingkat') : null;

            $tp = TujuanPembelajaran::query()
                ->whereHas('capaianPembelajaran', fn ($q) => $q
                    ->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id'))
                    ->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
                ->when($tingkat, fn ($q) => $q->where('tingkat', $tingkat))
                ->with('indikator:id,tujuan_pembelajaran_id,urutan,deskripsi')
                ->orderByRaw("case semester when 'ganjil' then 0 else 1 end")
                ->orderBy('tingkat')->orderBy('urutan')
                ->get(['id', 'tingkat', 'semester', 'urutan', 'deskripsi', 'materi_terkait', 'alokasi_waktu']);
        }

        return response()->json(['guru' => $guru, 'alokasi_jp_default' => $jpDefault, 'tujuan_pembelajaran' => $tp]);
    }

    private function validateProta(Request $request): array
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'kelas_id' => ['required', 'exists:kelas,id'],
            'fase' => ['nullable', 'string', 'max:10'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'guru_id' => ['nullable', 'exists:guru,id'],
            'minggu_efektif_ganjil' => ['nullable', 'integer', 'min:0', 'max:30'],
            'minggu_efektif_genap' => ['nullable', 'integer', 'min:0', 'max:30'],
            'catatan' => ['nullable', 'string'],
            'item' => ['required', 'array', 'min:1'],
            'item.*.tujuan_pembelajaran_id' => ['nullable', 'exists:tujuan_pembelajaran,id'],
            'item.*.indikator_id' => ['nullable', 'exists:tp_indikator,id'],
            'item.*.materi' => ['nullable', 'string', 'max:255'],
            'item.*.semester' => ['required', 'in:ganjil,genap'],
            'item.*.bulan_mulai' => ['required', 'integer', 'min:1', 'max:12'],
            'item.*.bulan_selesai' => ['nullable', 'integer', 'min:1', 'max:12'],
            'item.*.alokasi_jp' => ['required', 'integer', 'min:0', 'max:200'],
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

            $bulanSemester = self::BULAN_SEMESTER[$row['semester']];
            $selesai = $row['bulan_selesai'] ?? $row['bulan_mulai'];
            if (! in_array((int) $row['bulan_mulai'], $bulanSemester, true) || ! in_array((int) $selesai, $bulanSemester, true)) {
                throw ValidationException::withMessages(["item.{$i}.bulan_mulai" => ['Bulan harus berada dalam semester yang dipilih (Ganjil: Juli–Desember, Genap: Januari–Juni).']]);
            }
            if ((int) $selesai < (int) $row['bulan_mulai']) {
                throw ValidationException::withMessages(["item.{$i}.bulan_selesai" => ['Bulan selesai tidak boleh sebelum bulan mulai.']]);
            }
        }

        return $data;
    }

    private function assertUnique(array $data, ?int $ignoreId): void
    {
        $exists = ProgramTahunan::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('kelas_id', $data['kelas_id'])
            ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'kelas_id' => ['Program Tahunan untuk tahun ajaran, kelas, dan mata pelajaran ini sudah ada.'],
            ]);
        }
    }

    /**
     * TP harus sekonteks (tahun ajaran, mapel) dan semesternya sama dengan
     * semester baris; indikator harus milik TP pada baris yang sama.
     */
    private function assertTautan(array $data): void
    {
        foreach ($data['item'] as $i => $row) {
            if (empty($row['tujuan_pembelajaran_id'])) {
                continue;
            }

            $sekonteks = TujuanPembelajaran::whereKey($row['tujuan_pembelajaran_id'])
                ->where('semester', $row['semester'])
                ->whereHas('capaianPembelajaran', fn ($q) => $q
                    ->where('tahun_ajaran_id', $data['tahun_ajaran_id'])
                    ->where('mata_pelajaran_id', $data['mata_pelajaran_id']))
                ->exists();

            if (! $sekonteks) {
                throw ValidationException::withMessages(["item.{$i}.tujuan_pembelajaran_id" => ['TP tidak sesuai dengan tahun ajaran, mata pelajaran, dan semester baris ini.']]);
            }

            if (! empty($row['indikator_id'])
                && ! KompetensiIndikator::whereKey($row['indikator_id'])->where('tujuan_pembelajaran_id', $row['tujuan_pembelajaran_id'])->exists()) {
                throw ValidationException::withMessages(["item.{$i}.indikator_id" => ['Indikator tidak termasuk TP yang dipilih.']]);
            }
        }
    }

    private function header(array $data): array
    {
        return [
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'kelas_id' => $data['kelas_id'],
            'fase' => $data['fase'] ?? null,
            'mata_pelajaran_id' => $data['mata_pelajaran_id'],
            'guru_id' => $data['guru_id'] ?? null,
            'minggu_efektif_ganjil' => $data['minggu_efektif_ganjil'] ?? null,
            'minggu_efektif_genap' => $data['minggu_efektif_genap'] ?? null,
            'catatan' => $data['catatan'] ?? null,
        ];
    }

    private function syncItem(ProgramTahunan $prota, array $rows): void
    {
        $prota->item()->delete();

        foreach ($rows as $i => $row) {
            $prota->item()->create([
                'tujuan_pembelajaran_id' => $row['tujuan_pembelajaran_id'] ?? null,
                'indikator_id' => $row['indikator_id'] ?? null,
                'materi' => $row['materi'] ?? null,
                'semester' => $row['semester'],
                'bulan_mulai' => $row['bulan_mulai'],
                'bulan_selesai' => $row['bulan_selesai'] ?? $row['bulan_mulai'],
                'alokasi_jp' => $row['alokasi_jp'],
                'status_pelaksanaan' => $row['status_pelaksanaan'] ?? 'belum_terlaksana',
                'catatan' => $row['catatan'] ?? null,
                'urutan' => $i,
            ]);
        }
    }

    private function muat(ProgramTahunan $prota): ProgramTahunan
    {
        return $prota->load([
            'tahunAjaran:id,nama',
            'kelas:id,nama_kelas,tingkat',
            'mataPelajaran:id,nama_mapel,kode_mapel,alokasi_jp_default',
            'guru:id,nama',
            'diverifikasiOleh:id,name',
            'item.tujuanPembelajaran:id,tingkat,semester,urutan,deskripsi',
            'item.indikator:id,tujuan_pembelajaran_id,urutan,deskripsi',
        ]);
    }

    /**
     * Progres pelaksanaan (baris dan bobot JP) beserta rincian per semester.
     * Kapasitas JP = alokasi JP default mapel per minggu x minggu efektif;
     * hanya dihitung bila kedua angka itu diisi, supaya tidak menebak.
     */
    private function progress(ProgramTahunan $prota): array
    {
        $item = $prota->item;
        $jpPerMinggu = $prota->mataPelajaran?->alokasi_jp_default;

        $perSemester = [];
        foreach (['ganjil', 'genap'] as $sem) {
            $rows = $item->where('semester', $sem);
            $minggu = $prota->{"minggu_efektif_{$sem}"};
            $kapasitas = ($jpPerMinggu !== null && $minggu !== null) ? (int) $jpPerMinggu * (int) $minggu : null;
            $jpTotal = (int) $rows->sum('alokasi_jp');

            $perSemester[$sem] = [
                'baris' => $rows->count(),
                'jp_total' => $jpTotal,
                'jp_terlaksana' => (int) $rows->where('status_pelaksanaan', 'terlaksana')->sum('alokasi_jp'),
                'minggu_efektif' => $minggu,
                'kapasitas_jp' => $kapasitas,
                'melebihi_kapasitas' => $kapasitas !== null && $jpTotal > $kapasitas,
            ];
        }

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
            'jp_per_minggu' => $jpPerMinggu,
            'semester' => $perSemester,
        ];
    }

    private function ringkas(ProgramTahunan $prota): array
    {
        $prota->loadMissing(['item', 'mataPelajaran:id,alokasi_jp_default']);
        $progress = $this->progress($prota);

        return [
            ...$prota->only(self::HEADER_TRACKED),
            'status_dokumen' => $prota->status_dokumen,
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
                $item['semester'], $item['bulan_mulai'], $item['bulan_selesai'], $item['alokasi_jp'],
            ])),
            'status' => $item['status_pelaksanaan'] ?? 'belum_terlaksana',
            'catatan' => $item['catatan'] ?? null,
        ];
    }

    /**
     * Baris disimpan ulang seluruhnya, jadi perubahan diringkas lewat sidik
     * isi: berapa ditambah, dihapus, dan berapa yang isinya tetap tetapi
     * status pelaksanaan/catatannya berubah.
     */
    private function bandingkanBaris(array $lama, array $baru): array
    {
        $grup = fn (array $rows) => collect($rows)->groupBy('sig')->map(fn ($g) => $g->values()->all())->all();
        $l = $grup($lama);
        $b = $grup($baru);

        $ditambah = $dihapus = $berubah = 0;
        foreach (array_unique([...array_keys($l), ...array_keys($b)]) as $sig) {
            $lo = $l[$sig] ?? [];
            $ba = $b[$sig] ?? [];
            $sama = min(count($lo), count($ba));
            for ($k = 0; $k < $sama; $k++) {
                if ($lo[$k]['status'] !== $ba[$k]['status'] || $lo[$k]['catatan'] !== $ba[$k]['catatan']) {
                    $berubah++;
                }
            }
            $ditambah += max(0, count($ba) - $sama);
            $dihapus += max(0, count($lo) - $sama);
        }

        return ['ditambah' => $ditambah, 'dihapus' => $dihapus, 'status_atau_catatan_berubah' => $berubah];
    }

    private function rentangBulan(int $mulai, int $selesai): string
    {
        return $mulai === $selesai ? self::BULAN[$mulai] : self::BULAN[$mulai].' – '.self::BULAN[$selesai];
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

    private function label(ProgramTahunan $prota): string
    {
        $prota->loadMissing(['mataPelajaran:id,nama_mapel', 'kelas:id,nama_kelas', 'tahunAjaran:id,nama']);

        return ($prota->mataPelajaran?->nama_mapel ?? '-').' — '.($prota->kelas?->nama_kelas ?? '-').' — TA '.($prota->tahunAjaran?->nama ?? '-');
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KkmKktp;
use App\Models\KompetensiIndikator;
use App\Models\TujuanPembelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

/**
 * KKM/KKTP per tahun ajaran, mata pelajaran, fase/kelas, dan semester.
 * Nilai batas (angka) dan kriteria ketercapaian (deskriptif) boleh salah
 * satu atau keduanya. Tautan ke TP/indikator divalidasi sekonteks (mapel,
 * tahun ajaran, semester sama) supaya tidak terhubung ke data yang tidak
 * relevan. Perubahan dicatat lewat activity log untuk riwayat.
 */
class KkmKktpController extends Controller
{
    private const TRACKED = ['tahun_ajaran_id', 'mata_pelajaran_id', 'fase', 'tingkat', 'semester', 'nilai_batas', 'kriteria_ketercapaian', 'status'];

    public function index(Request $request): JsonResponse
    {
        $data = KkmKktp::query()
            ->with(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel'])
            ->withCount(['tujuanPembelajaran', 'indikator'])
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
            ->when($request->filled('fase'), fn ($q) => $q->where('fase', $request->string('fase')))
            ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateKkm($request);
        $this->assertUnique($data, null);
        $tpIds = $this->resolveTpIds($data);
        $indikatorIds = $this->resolveIndikatorIds($data);

        $kkm = DB::transaction(function () use ($data, $tpIds, $indikatorIds, $request) {
            $kkm = KkmKktp::create([...$this->attributes($data), 'dibuat_oleh' => $request->user()->id]);
            $kkm->tujuanPembelajaran()->sync($tpIds);
            $kkm->indikator()->sync($indikatorIds);

            return $kkm;
        });

        $kkm->load(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel']);

        activity()
            ->performedOn($kkm)
            ->causedBy($request->user())
            ->event('created')
            ->withProperties(['new' => $this->snapshot($kkm, $tpIds, $indikatorIds)])
            ->log("Menambahkan {$this->label($kkm)}.");

        return response()->json($kkm, 201);
    }

    public function show(KkmKktp $kkmKktp): JsonResponse
    {
        $kkmKktp->load([
            'tahunAjaran:id,nama',
            'mataPelajaran:id,nama_mapel,kode_mapel',
            'tujuanPembelajaran:id,tingkat,semester,urutan,deskripsi',
            'indikator:id,tujuan_pembelajaran_id,urutan,deskripsi',
        ]);

        $riwayat = Activity::where('subject_type', KkmKktp::class)
            ->where('subject_id', $kkmKktp->id)
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

        return response()->json([...$kkmKktp->toArray(), 'riwayat' => $riwayat]);
    }

    public function update(Request $request, KkmKktp $kkmKktp): JsonResponse
    {
        $data = $this->validateKkm($request);
        $this->assertUnique($data, $kkmKktp->id);
        $tpIds = $this->resolveTpIds($data);
        $indikatorIds = $this->resolveIndikatorIds($data);

        $old = $this->snapshot(
            $kkmKktp,
            $kkmKktp->tujuanPembelajaran()->pluck('tujuan_pembelajaran.id')->all(),
            $kkmKktp->indikator()->pluck('tp_indikator.id')->all(),
        );

        DB::transaction(function () use ($kkmKktp, $data, $tpIds, $indikatorIds) {
            $kkmKktp->update($this->attributes($data));
            $kkmKktp->tujuanPembelajaran()->sync($tpIds);
            $kkmKktp->indikator()->sync($indikatorIds);
        });

        $kkmKktp->refresh()->load(['tahunAjaran:id,nama', 'mataPelajaran:id,nama_mapel,kode_mapel']);

        activity()
            ->performedOn($kkmKktp)
            ->causedBy($request->user())
            ->event('updated')
            ->withProperties(['old' => $old, 'new' => $this->snapshot($kkmKktp, $tpIds, $indikatorIds)])
            ->log("Memperbarui {$this->label($kkmKktp)}.");

        return response()->json($kkmKktp);
    }

    public function updateStatus(Request $request, KkmKktp $kkmKktp): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:draft,aktif,nonaktif']]);

        $lama = $kkmKktp->status;
        $kkmKktp->update(['status' => $data['status']]);

        activity()
            ->performedOn($kkmKktp)
            ->causedBy($request->user())
            ->event('updated')
            ->withProperties(['old' => ['status' => $lama], 'new' => ['status' => $data['status']]])
            ->log("Mengubah status {$this->label($kkmKktp->load('mataPelajaran:id,nama_mapel'))} menjadi \"{$data['status']}\".");

        return response()->json($kkmKktp);
    }

    public function destroy(Request $request, KkmKktp $kkmKktp): JsonResponse
    {
        $kkmKktp->load('mataPelajaran:id,nama_mapel');

        activity()
            ->performedOn($kkmKktp)
            ->causedBy($request->user())
            ->event('deleted')
            ->log("Menghapus {$this->label($kkmKktp)}.");

        $kkmKktp->delete();

        return response()->json(['message' => 'KKM/KKTP berhasil dihapus.']);
    }

    /**
     * Daftar TP beserta indikatornya yang boleh ditautkan untuk konteks
     * (tahun ajaran, mata pelajaran, semester) — dipakai form supaya
     * pilihan tautan selalu sekonteks.
     */
    public function opsiTautan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
        ]);

        $tp = TujuanPembelajaran::query()
            ->whereHas('capaianPembelajaran', fn ($q) => $q
                ->where('tahun_ajaran_id', $data['tahun_ajaran_id'])
                ->where('mata_pelajaran_id', $data['mata_pelajaran_id']))
            ->where('semester', $data['semester'])
            ->with('indikator:id,tujuan_pembelajaran_id,urutan,deskripsi')
            ->orderBy('tingkat')->orderBy('urutan')
            ->get(['id', 'tingkat', 'semester', 'urutan', 'deskripsi']);

        return response()->json($tp);
    }

    private function validateKkm(Request $request): array
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'fase' => ['required', 'string', 'max:10'],
            'tingkat' => ['nullable', 'string', 'max:20'],
            'semester' => ['required', 'in:ganjil,genap'],
            'nilai_batas' => ['nullable', 'integer', 'min:0', 'max:100'],
            'kriteria_ketercapaian' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,aktif,nonaktif'],
            'tujuan_pembelajaran_ids' => ['nullable', 'array'],
            'tujuan_pembelajaran_ids.*' => ['integer', 'exists:tujuan_pembelajaran,id'],
            'indikator_ids' => ['nullable', 'array'],
            'indikator_ids.*' => ['integer', 'exists:tp_indikator,id'],
        ]);

        if (($data['nilai_batas'] ?? null) === null && trim((string) ($data['kriteria_ketercapaian'] ?? '')) === '') {
            throw ValidationException::withMessages([
                'nilai_batas' => ['Isi nilai batas atau kriteria ketercapaian (minimal salah satu).'],
            ]);
        }

        return $data;
    }

    private function attributes(array $data): array
    {
        return [
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'mata_pelajaran_id' => $data['mata_pelajaran_id'],
            'fase' => $data['fase'],
            'tingkat' => $data['tingkat'] ?? null,
            'semester' => $data['semester'],
            'nilai_batas' => $data['nilai_batas'] ?? null,
            'kriteria_ketercapaian' => isset($data['kriteria_ketercapaian']) && trim($data['kriteria_ketercapaian']) !== '' ? $data['kriteria_ketercapaian'] : null,
            'status' => $data['status'] ?? 'draft',
        ];
    }

    private function assertUnique(array $data, ?int $ignoreId): void
    {
        $exists = KkmKktp::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])
            ->where('fase', $data['fase'])
            ->where('tingkat', $data['tingkat'] ?? null)
            ->where('semester', $data['semester'])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'semester' => ['KKM/KKTP untuk tahun ajaran, mata pelajaran, fase/kelas, dan semester ini sudah ada.'],
            ]);
        }
    }

    private function resolveTpIds(array $data): array
    {
        $ids = array_values(array_unique($data['tujuan_pembelajaran_ids'] ?? []));
        if ($ids === []) {
            return [];
        }

        $valid = TujuanPembelajaran::whereIn('id', $ids)
            ->where('semester', $data['semester'])
            ->whereHas('capaianPembelajaran', fn ($q) => $q
                ->where('tahun_ajaran_id', $data['tahun_ajaran_id'])
                ->where('mata_pelajaran_id', $data['mata_pelajaran_id']))
            ->pluck('id')->all();

        if (count($valid) !== count($ids)) {
            throw ValidationException::withMessages([
                'tujuan_pembelajaran_ids' => ['Ada TP yang tidak sesuai dengan tahun ajaran, mata pelajaran, dan semester yang dipilih.'],
            ]);
        }

        return $ids;
    }

    private function resolveIndikatorIds(array $data): array
    {
        $ids = array_values(array_unique($data['indikator_ids'] ?? []));
        if ($ids === []) {
            return [];
        }

        $valid = KompetensiIndikator::whereIn('id', $ids)
            ->whereHas('tujuanPembelajaran', fn ($q) => $q
                ->where('semester', $data['semester'])
                ->whereHas('capaianPembelajaran', fn ($qq) => $qq
                    ->where('tahun_ajaran_id', $data['tahun_ajaran_id'])
                    ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])))
            ->pluck('id')->all();

        if (count($valid) !== count($ids)) {
            throw ValidationException::withMessages([
                'indikator_ids' => ['Ada indikator yang tidak sesuai dengan tahun ajaran, mata pelajaran, dan semester yang dipilih.'],
            ]);
        }

        return $ids;
    }

    private function snapshot(KkmKktp $kkm, array $tpIds, array $indikatorIds): array
    {
        sort($tpIds);
        sort($indikatorIds);

        return [...$kkm->only(self::TRACKED), 'tujuan_pembelajaran_ids' => $tpIds, 'indikator_ids' => $indikatorIds];
    }

    private function label(KkmKktp $kkm): string
    {
        $nama = $kkm->mataPelajaran?->nama_mapel ?? 'mata pelajaran';

        return "KKM/KKTP {$nama} — Fase {$kkm->fase}".($kkm->tingkat ? " Kelas {$kkm->tingkat}" : '')." — Semester {$kkm->semester}";
    }
}

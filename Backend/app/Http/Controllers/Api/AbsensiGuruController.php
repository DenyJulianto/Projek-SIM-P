<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AbsensiGuruController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $absensi = QueryBuilder::for(AbsensiGuru::class)
            ->allowedFilters(AllowedFilter::exact('guru_id'), 'status', 'tanggal')
            ->allowedSorts('tanggal', 'created_at')
            ->allowedIncludes('guru')
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 15));

        return response()->json($absensi);
    }

    public function rekap(Request $request): JsonResponse
    {
        $tanggal = $request->date('tanggal') ?? now();

        $counts = AbsensiGuru::query()
            ->whereDate('tanggal', $tanggal)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'tanggal' => $tanggal->toDateString(),
            'hadir' => (int) ($counts['hadir'] ?? 0),
            'izin' => (int) ($counts['izin'] ?? 0),
            'sakit' => (int) ($counts['sakit'] ?? 0),
            'alpha' => (int) ($counts['alpha'] ?? 0),
            'total' => (int) $counts->sum(),
        ]);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tanggal' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.guru_id' => ['required', 'exists:guru,id'],
            'items.*.status' => ['required', 'in:hadir,izin,sakit,alpha'],
            'items.*.keterangan' => ['nullable', 'string'],
        ]);

        foreach ($data['items'] as $item) {
            $absensi = AbsensiGuru::where('guru_id', $item['guru_id'])
                ->whereDate('tanggal', $data['tanggal'])
                ->first() ?? new AbsensiGuru(['guru_id' => $item['guru_id'], 'tanggal' => $data['tanggal']]);

            $absensi->fill([
                'status' => $item['status'],
                'keterangan' => $item['keterangan'] ?? null,
            ])->save();
        }

        return response()->json(['message' => 'Absensi guru berhasil disimpan.']);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guru_id' => ['required', 'exists:guru,id'],
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'in:hadir,izin,sakit,alpha'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $absensi = AbsensiGuru::create($data);

        return response()->json($absensi, 201);
    }

    public function update(Request $request, AbsensiGuru $absensiGuru): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:hadir,izin,sakit,alpha'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $absensiGuru->update($data);

        return response()->json($absensiGuru);
    }

    public function destroy(AbsensiGuru $absensiGuru): JsonResponse
    {
        $absensiGuru->delete();

        return response()->json(['message' => 'Data absensi guru berhasil dihapus.']);
    }
}

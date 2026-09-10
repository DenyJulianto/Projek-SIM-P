<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AbsensiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $absensi = QueryBuilder::for(Absensi::class)
            ->allowedFilters(
                AllowedFilter::exact('siswa_id'),
                AllowedFilter::exact('kelas_id'),
                'status',
                'tanggal',
            )
            ->allowedSorts('tanggal', 'created_at')
            ->allowedIncludes('siswa', 'kelas')
            ->paginate($request->integer('per_page', 15));

        return response()->json($absensi);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'kelas_id' => ['required', 'exists:kelas,id'],
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'in:hadir,izin,sakit,alpha'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $absensi = Absensi::create($data);

        return response()->json($absensi, 201);
    }

    public function show(Absensi $absensi): JsonResponse
    {
        return response()->json($absensi->load('siswa', 'kelas'));
    }

    public function update(Request $request, Absensi $absensi): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:hadir,izin,sakit,alpha'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $absensi->update($data);

        return response()->json($absensi);
    }

    public function destroy(Absensi $absensi): JsonResponse
    {
        $absensi->delete();

        return response()->json(['message' => 'Data absensi berhasil dihapus.']);
    }
}

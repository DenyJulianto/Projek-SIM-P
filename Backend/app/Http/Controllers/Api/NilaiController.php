<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nilai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class NilaiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $nilai = QueryBuilder::for(Nilai::class)
            ->allowedFilters(
                AllowedFilter::exact('siswa_id'),
                AllowedFilter::exact('mata_pelajaran_id'),
                AllowedFilter::exact('guru_id'),
                'jenis_nilai',
                'semester',
                'tahun_ajaran',
            )
            ->allowedSorts('created_at', 'nilai')
            ->allowedIncludes('siswa', 'mataPelajaran', 'guru')
            ->paginate($request->integer('per_page', 15));

        return response()->json($nilai);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'guru_id' => ['required', 'exists:guru,id'],
            'jenis_nilai' => ['required', 'in:tugas,uts,uas,harian'],
            'nilai' => ['required', 'numeric', 'min:0', 'max:100'],
            'semester' => ['required', 'string', 'max:10'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
        ]);

        $nilai = Nilai::create($data);

        return response()->json($nilai, 201);
    }

    public function show(Nilai $nilai): JsonResponse
    {
        return response()->json($nilai->load('siswa', 'mataPelajaran', 'guru'));
    }

    public function update(Request $request, Nilai $nilai): JsonResponse
    {
        $data = $request->validate([
            'jenis_nilai' => ['sometimes', 'in:tugas,uts,uas,harian'],
            'nilai' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'semester' => ['sometimes', 'string', 'max:10'],
            'tahun_ajaran' => ['sometimes', 'string', 'max:20'],
        ]);

        $nilai->update($data);

        return response()->json($nilai);
    }

    public function destroy(Nilai $nilai): JsonResponse
    {
        $nilai->delete();

        return response()->json(['message' => 'Nilai berhasil dihapus.']);
    }
}

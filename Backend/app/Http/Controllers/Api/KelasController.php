<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class KelasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $kelas = QueryBuilder::for(Kelas::class)
            ->allowedFilters('nama_kelas', 'tingkat', 'jurusan', 'tahun_ajaran', AllowedFilter::exact('wali_kelas_id'))
            ->allowedSorts('nama_kelas', 'created_at')
            ->allowedIncludes('waliKelas', 'siswa')
            ->paginate($request->integer('per_page', 15));

        return response()->json($kelas);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama_kelas' => ['required', 'string', 'max:255'],
            'tingkat' => ['nullable', 'string', 'max:20'],
            'jurusan' => ['nullable', 'string', 'max:255'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'wali_kelas_id' => ['nullable', 'exists:guru,id'],
        ]);

        $kelas = Kelas::create($data);

        return response()->json($kelas, 201);
    }

    public function show(Kelas $kela): JsonResponse
    {
        return response()->json($kela->load('waliKelas', 'siswa'));
    }

    public function update(Request $request, Kelas $kela): JsonResponse
    {
        $data = $request->validate([
            'nama_kelas' => ['sometimes', 'string', 'max:255'],
            'tingkat' => ['nullable', 'string', 'max:20'],
            'jurusan' => ['nullable', 'string', 'max:255'],
            'tahun_ajaran' => ['sometimes', 'string', 'max:20'],
            'wali_kelas_id' => ['nullable', 'exists:guru,id'],
        ]);

        $kela->update($data);

        return response()->json($kela);
    }

    public function destroy(Kelas $kela): JsonResponse
    {
        $kela->delete();

        return response()->json(['message' => 'Kelas berhasil dihapus.']);
    }
}

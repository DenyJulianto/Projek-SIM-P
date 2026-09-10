<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MataPelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MataPelajaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $mapel = MataPelajaran::orderBy('nama_mapel')->paginate($request->integer('per_page', 100));

        return response()->json($mapel);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kode_mapel' => ['nullable', 'string', 'max:20', 'unique:mata_pelajaran,kode_mapel'],
            'nama_mapel' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
        ]);

        $mapel = MataPelajaran::create($data);

        return response()->json($mapel, 201);
    }

    public function show(MataPelajaran $mataPelajaran): JsonResponse
    {
        return response()->json($mataPelajaran);
    }

    public function update(Request $request, MataPelajaran $mataPelajaran): JsonResponse
    {
        $data = $request->validate([
            'kode_mapel' => ['nullable', 'string', 'max:20', 'unique:mata_pelajaran,kode_mapel,' . $mataPelajaran->id],
            'nama_mapel' => ['sometimes', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
        ]);

        $mataPelajaran->update($data);

        return response()->json($mataPelajaran);
    }

    public function destroy(MataPelajaran $mataPelajaran): JsonResponse
    {
        $mataPelajaran->delete();

        return response()->json(['message' => 'Mata pelajaran berhasil dihapus.']);
    }
}

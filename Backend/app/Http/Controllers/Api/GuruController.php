<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class GuruController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $guru = QueryBuilder::for(Guru::class)
            ->allowedFilters('nama', 'nip', 'status')
            ->allowedSorts('nama', 'created_at')
            ->allowedIncludes('user', 'kelasWali')
            ->paginate($request->integer('per_page', 15));

        return response()->json($guru);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'nip' => ['nullable', 'string', 'max:30', 'unique:guru,nip'],
            'nama' => ['required', 'string', 'max:255'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'no_telepon' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        $guru = Guru::create($data);

        return response()->json($guru, 201);
    }

    public function show(Guru $guru): JsonResponse
    {
        return response()->json($guru->load('user', 'kelasWali'));
    }

    public function update(Request $request, Guru $guru): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'nip' => ['nullable', 'string', 'max:30', 'unique:guru,nip,' . $guru->id],
            'nama' => ['sometimes', 'string', 'max:255'],
            'jenis_kelamin' => ['sometimes', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'no_telepon' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);

        $guru->update($data);

        return response()->json($guru);
    }

    public function destroy(Guru $guru): JsonResponse
    {
        $guru->delete();

        return response()->json(['message' => 'Guru berhasil dihapus.']);
    }
}

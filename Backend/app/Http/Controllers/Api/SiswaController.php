<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SiswaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $siswa = QueryBuilder::for(Siswa::class)
            ->allowedFilters('nama', 'nis', 'nisn', 'status', AllowedFilter::exact('kelas_id'))
            ->allowedSorts('nama', 'created_at')
            ->allowedIncludes('user', 'kelas', 'walis')
            ->paginate($request->integer('per_page', 15));

        return response()->json($siswa);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'kelas_id' => ['nullable', 'exists:kelas,id'],
            'nis' => ['required', 'string', 'max:20', 'unique:siswa,nis'],
            'nisn' => ['nullable', 'string', 'max:20', 'unique:siswa,nisn'],
            'nama' => ['required', 'string', 'max:255'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,lulus,pindah,keluar'],
        ]);

        $siswa = Siswa::create($data);

        return response()->json($siswa, 201);
    }

    public function show(Siswa $siswa): JsonResponse
    {
        return response()->json($siswa->load('user', 'kelas', 'walis'));
    }

    public function update(Request $request, Siswa $siswa): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'kelas_id' => ['nullable', 'exists:kelas,id'],
            'nis' => ['sometimes', 'string', 'max:20', 'unique:siswa,nis,' . $siswa->id],
            'nisn' => ['nullable', 'string', 'max:20', 'unique:siswa,nisn,' . $siswa->id],
            'nama' => ['sometimes', 'string', 'max:255'],
            'jenis_kelamin' => ['sometimes', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,lulus,pindah,keluar'],
        ]);

        $siswa->update($data);

        return response()->json($siswa);
    }

    public function destroy(Siswa $siswa): JsonResponse
    {
        $siswa->delete();

        return response()->json(['message' => 'Siswa berhasil dihapus.']);
    }
}

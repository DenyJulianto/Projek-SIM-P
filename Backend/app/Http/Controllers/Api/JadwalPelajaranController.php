<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class JadwalPelajaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $jadwal = QueryBuilder::for(JadwalPelajaran::class)
            ->allowedFilters(
                AllowedFilter::exact('kelas_id'),
                AllowedFilter::exact('mata_pelajaran_id'),
                AllowedFilter::exact('guru_id'),
                'hari',
            )
            ->allowedSorts('hari', 'jam_mulai')
            ->allowedIncludes('kelas', 'mataPelajaran', 'guru')
            ->paginate($request->integer('per_page', 15));

        return response()->json($jadwal);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['required', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'guru_id' => ['required', 'exists:guru,id'],
            'hari' => ['required', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
        ]);

        $jadwal = JadwalPelajaran::create($data);

        return response()->json($jadwal, 201);
    }

    public function show(JadwalPelajaran $jadwalPelajaran): JsonResponse
    {
        return response()->json($jadwalPelajaran->load('kelas', 'mataPelajaran', 'guru'));
    }

    public function update(Request $request, JadwalPelajaran $jadwalPelajaran): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['sometimes', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['sometimes', 'exists:mata_pelajaran,id'],
            'guru_id' => ['sometimes', 'exists:guru,id'],
            'hari' => ['sometimes', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu'],
            'jam_mulai' => ['sometimes', 'date_format:H:i'],
            'jam_selesai' => ['sometimes', 'date_format:H:i', 'after:jam_mulai'],
        ]);

        $jadwalPelajaran->update($data);

        return response()->json($jadwalPelajaran);
    }

    public function destroy(JadwalPelajaran $jadwalPelajaran): JsonResponse
    {
        $jadwalPelajaran->delete();

        return response()->json(['message' => 'Jadwal pelajaran berhasil dihapus.']);
    }
}

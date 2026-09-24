<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nilai;
use App\Models\PenguncianNilai;
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
            ->allowedIncludes('siswa', 'siswa.kelas', 'mataPelajaran', 'guru')
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

        PenguncianNilai::pastikanBolehUbah((int) $data['siswa_id'], (int) $data['mata_pelajaran_id'], $data['tahun_ajaran'], $data['semester']);

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

        // Cek posisi lama dan posisi baru (bila semester/tahun ajaran dipindah).
        PenguncianNilai::pastikanBolehUbah($nilai->siswa_id, $nilai->mata_pelajaran_id, $nilai->tahun_ajaran, $nilai->semester);
        PenguncianNilai::pastikanBolehUbah($nilai->siswa_id, $nilai->mata_pelajaran_id, $data['tahun_ajaran'] ?? $nilai->tahun_ajaran, $data['semester'] ?? $nilai->semester);

        $nilai->update($data);

        return response()->json($nilai);
    }

    public function destroy(Nilai $nilai): JsonResponse
    {
        PenguncianNilai::pastikanBolehUbah($nilai->siswa_id, $nilai->mata_pelajaran_id, $nilai->tahun_ajaran, $nilai->semester);

        $nilai->delete();

        return response()->json(['message' => 'Nilai berhasil dihapus.']);
    }
}

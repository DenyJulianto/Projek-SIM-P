<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NilaiSikap;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NilaiSikapController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sikap = NilaiSikap::query()
            ->with(['siswa:id,nama,kelas_id', 'guru:id,nama'])
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')))
            ->when($request->filled('tahun_ajaran'), fn ($q) => $q->where('tahun_ajaran', $request->string('tahun_ajaran')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($sikap);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'jenis' => ['required', 'in:spiritual,sosial'],
            'predikat' => ['required', 'in:SB,B,C,K'],
            'deskripsi' => ['nullable', 'string'],
            'semester' => ['required', 'string', 'max:10'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
        ]);

        $sikap = NilaiSikap::create([
            ...$data,
            'guru_id' => $request->user()->guru?->id,
        ]);

        activity()->causedBy($request->user())->log('Mencatat penilaian sikap siswa.');

        return response()->json($sikap->load(['siswa:id,nama,kelas_id', 'guru:id,nama']), 201);
    }

    public function update(Request $request, NilaiSikap $nilaiSikap): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', 'in:spiritual,sosial'],
            'predikat' => ['required', 'in:SB,B,C,K'],
            'deskripsi' => ['nullable', 'string'],
            'semester' => ['required', 'string', 'max:10'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
        ]);

        $nilaiSikap->update($data);

        activity()->causedBy($request->user())->log('Memperbarui penilaian sikap siswa.');

        return response()->json($nilaiSikap->load(['siswa:id,nama,kelas_id', 'guru:id,nama']));
    }

    public function destroy(Request $request, NilaiSikap $nilaiSikap): JsonResponse
    {
        $nilaiSikap->delete();

        activity()->causedBy($request->user())->log('Menghapus penilaian sikap siswa.');

        return response()->json(['message' => 'Penilaian sikap berhasil dihapus.']);
    }
}

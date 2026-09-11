<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Konseling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KonselingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $konseling = Konseling::query()
            ->with(['siswa:id,nama,kelas_id', 'guru:id,nama'])
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->when($request->filled('jenis'), fn ($q) => $q->where('jenis', $request->string('jenis')))
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 15));

        return response()->json($konseling);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'tanggal' => ['required', 'date'],
            'jenis' => ['required', 'in:individu,kelompok'],
            'topik' => ['required', 'string', 'max:255'],
            'catatan' => ['nullable', 'string'],
            'tindak_lanjut' => ['nullable', 'string'],
        ]);

        $konseling = Konseling::create([
            ...$data,
            'guru_id' => $request->user()->guru?->id,
        ]);

        activity()->causedBy($request->user())->log("Mencatat sesi konseling \"{$konseling->topik}\".");

        return response()->json($konseling->load(['siswa:id,nama,kelas_id', 'guru:id,nama']), 201);
    }

    public function update(Request $request, Konseling $konseling): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'tanggal' => ['required', 'date'],
            'jenis' => ['required', 'in:individu,kelompok'],
            'topik' => ['required', 'string', 'max:255'],
            'catatan' => ['nullable', 'string'],
            'tindak_lanjut' => ['nullable', 'string'],
        ]);

        $konseling->update($data);

        activity()->causedBy($request->user())->log("Memperbarui catatan konseling \"{$konseling->topik}\".");

        return response()->json($konseling->load(['siswa:id,nama,kelas_id', 'guru:id,nama']));
    }

    public function destroy(Request $request, Konseling $konseling): JsonResponse
    {
        $topik = $konseling->topik;
        $konseling->delete();

        activity()->causedBy($request->user())->log("Menghapus catatan konseling \"{$topik}\".");

        return response()->json(['message' => 'Catatan konseling berhasil dihapus.']);
    }
}

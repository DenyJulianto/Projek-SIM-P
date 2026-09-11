<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SemesterController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Semester::with('tahunAjaran:id,nama')->orderByDesc('tanggal_mulai')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'nama' => ['required', Rule::in(['Ganjil', 'Genap']), Rule::unique('semester')->where('tahun_ajaran_id', $request->tahun_ajaran_id)],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after:tanggal_mulai'],
            'is_active' => ['boolean'],
        ]);

        if ($data['is_active'] ?? false) {
            Semester::query()->update(['is_active' => false]);
        }

        $semester = Semester::create($data);

        activity()->causedBy($request->user())->log("Menambahkan semester \"{$semester->nama}\".");

        return response()->json($semester->load('tahunAjaran:id,nama'), 201);
    }

    public function update(Request $request, Semester $semester): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'nama' => [
                'required',
                Rule::in(['Ganjil', 'Genap']),
                Rule::unique('semester')->where('tahun_ajaran_id', $request->tahun_ajaran_id)->ignore($semester->id),
            ],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after:tanggal_mulai'],
            'is_active' => ['boolean'],
        ]);

        if ($data['is_active'] ?? false) {
            Semester::where('id', '!=', $semester->id)->update(['is_active' => false]);
        }

        $semester->update($data);

        activity()->causedBy($request->user())->log("Memperbarui semester \"{$semester->nama}\".");

        return response()->json($semester->load('tahunAjaran:id,nama'));
    }

    public function destroy(Request $request, Semester $semester): JsonResponse
    {
        $nama = $semester->nama;
        $semester->delete();

        activity()->causedBy($request->user())->log("Menghapus semester \"{$nama}\".");

        return response()->json(['message' => 'Semester berhasil dihapus.']);
    }
}

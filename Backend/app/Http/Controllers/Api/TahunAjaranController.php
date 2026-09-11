<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TahunAjaranController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            TahunAjaran::with('semester')->orderByDesc('tanggal_mulai')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:20', 'unique:tahun_ajaran,nama'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after:tanggal_mulai'],
            'is_active' => ['boolean'],
        ]);

        if ($data['is_active'] ?? false) {
            TahunAjaran::query()->update(['is_active' => false]);
        }

        $tahunAjaran = TahunAjaran::create($data);

        activity()->causedBy($request->user())->log("Menambahkan tahun ajaran \"{$tahunAjaran->nama}\".");

        return response()->json($tahunAjaran, 201);
    }

    public function update(Request $request, TahunAjaran $tahunAjaran): JsonResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:20', Rule::unique('tahun_ajaran', 'nama')->ignore($tahunAjaran->id)],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after:tanggal_mulai'],
            'is_active' => ['boolean'],
        ]);

        if ($data['is_active'] ?? false) {
            TahunAjaran::where('id', '!=', $tahunAjaran->id)->update(['is_active' => false]);
        }

        $tahunAjaran->update($data);

        activity()->causedBy($request->user())->log("Memperbarui tahun ajaran \"{$tahunAjaran->nama}\".");

        return response()->json($tahunAjaran);
    }

    public function destroy(Request $request, TahunAjaran $tahunAjaran): JsonResponse
    {
        $nama = $tahunAjaran->nama;
        $tahunAjaran->delete();

        activity()->causedBy($request->user())->log("Menghapus tahun ajaran \"{$nama}\".");

        return response()->json(['message' => 'Tahun ajaran berhasil dihapus.']);
    }
}

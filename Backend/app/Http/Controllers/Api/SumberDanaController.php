<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SumberDana;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SumberDanaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sumberDana = SumberDana::query()
            ->when($request->filled('tahun_ajaran'), fn ($q) => $q->where('tahun_ajaran', $request->string('tahun_ajaran')))
            ->orderByDesc('tahun_ajaran')
            ->orderBy('nama')
            ->get();

        return response()->json($sumberDana);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'nama' => ['required', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
            'jumlah' => ['required', 'numeric', 'min:0'],
        ]);

        $sumberDana = SumberDana::create($data);

        activity()->causedBy($request->user())->log("Menambahkan sumber dana \"{$sumberDana->nama}\".");

        return response()->json($sumberDana, 201);
    }

    public function update(Request $request, SumberDana $sumberDana): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'nama' => ['required', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
            'jumlah' => ['required', 'numeric', 'min:0'],
        ]);

        $sumberDana->update($data);

        activity()->causedBy($request->user())->log("Memperbarui sumber dana \"{$sumberDana->nama}\".");

        return response()->json($sumberDana);
    }

    public function destroy(Request $request, SumberDana $sumberDana): JsonResponse
    {
        $nama = $sumberDana->nama;
        $sumberDana->delete();

        activity()->causedBy($request->user())->log("Menghapus sumber dana \"{$nama}\".");

        return response()->json(['message' => 'Sumber dana berhasil dihapus.']);
    }
}

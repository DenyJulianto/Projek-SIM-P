<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagihanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tagihan = Tagihan::query()
            ->with(['siswa:id,nama,kelas_id', 'pembayaran'])
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($tagihan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'judul' => ['required', 'string', 'max:255'],
            'jumlah' => ['required', 'numeric', 'min:0'],
            'jatuh_tempo' => ['nullable', 'date'],
        ]);

        $tagihan = Tagihan::create($data);

        activity()->causedBy($request->user())->log("Menambahkan tagihan \"{$tagihan->judul}\".");

        return response()->json($tagihan->load('siswa:id,nama,kelas_id'), 201);
    }

    public function update(Request $request, Tagihan $tagihan): JsonResponse
    {
        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'jumlah' => ['required', 'numeric', 'min:0'],
            'jatuh_tempo' => ['nullable', 'date'],
        ]);

        $tagihan->update($data);

        activity()->causedBy($request->user())->log("Memperbarui tagihan \"{$tagihan->judul}\".");

        return response()->json($tagihan->load('siswa:id,nama,kelas_id'));
    }

    public function destroy(Request $request, Tagihan $tagihan): JsonResponse
    {
        $judul = $tagihan->judul;
        $tagihan->delete();

        activity()->causedBy($request->user())->log("Menghapus tagihan \"{$judul}\".");

        return response()->json(['message' => 'Tagihan berhasil dihapus.']);
    }
}

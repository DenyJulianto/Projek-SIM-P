<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggaranPos;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnggaranPosController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pos = AnggaranPos::query()
            ->when($request->filled('tahun_ajaran'), fn ($q) => $q->where('tahun_ajaran', $request->string('tahun_ajaran')))
            ->orderByDesc('tahun_ajaran')
            ->orderBy('bidang')
            ->get();

        return response()->json($pos);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'bidang' => ['required', 'string', 'max:255'],
            'uraian' => ['required', 'string', 'max:255'],
            'jumlah_anggaran' => ['required', 'numeric', 'min:0'],
        ]);

        $pos = AnggaranPos::create($data);

        activity()->causedBy($request->user())->log("Menambahkan pos RKAS \"{$pos->uraian}\".");

        return response()->json($pos, 201);
    }

    public function update(Request $request, AnggaranPos $anggaranPos): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'bidang' => ['required', 'string', 'max:255'],
            'uraian' => ['required', 'string', 'max:255'],
            'jumlah_anggaran' => ['required', 'numeric', 'min:0'],
        ]);

        $anggaranPos->update($data);

        activity()->causedBy($request->user())->log("Memperbarui pos RKAS \"{$anggaranPos->uraian}\".");

        return response()->json($anggaranPos);
    }

    public function destroy(Request $request, AnggaranPos $anggaranPos): JsonResponse
    {
        $uraian = $anggaranPos->uraian;
        $anggaranPos->delete();

        activity()->causedBy($request->user())->log("Menghapus pos RKAS \"{$uraian}\".");

        return response()->json(['message' => 'Pos RKAS berhasil dihapus.']);
    }
}

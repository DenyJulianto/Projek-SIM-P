<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class KegiatanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $kegiatan = QueryBuilder::for(Kegiatan::class)
            ->allowedFilters('judul', 'status')
            ->allowedSorts('tanggal_mulai', 'created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($kegiatan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['required', 'string'],
            'gambar' => ['nullable', 'string'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            'status' => ['nullable', 'in:draft,published'],
        ]);

        $data['user_id'] = $request->user()->id;

        $kegiatan = Kegiatan::create($data);

        return response()->json($kegiatan, 201);
    }

    public function show(Kegiatan $kegiatan): JsonResponse
    {
        return response()->json($kegiatan->load('user'));
    }

    public function update(Request $request, Kegiatan $kegiatan): JsonResponse
    {
        $data = $request->validate([
            'judul' => ['sometimes', 'string', 'max:255'],
            'deskripsi' => ['sometimes', 'string'],
            'gambar' => ['nullable', 'string'],
            'tanggal_mulai' => ['sometimes', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            'status' => ['sometimes', 'in:draft,published'],
        ]);

        $kegiatan->update($data);

        return response()->json($kegiatan);
    }

    public function destroy(Kegiatan $kegiatan): JsonResponse
    {
        $kegiatan->delete();

        return response()->json(['message' => 'Kegiatan berhasil dihapus.']);
    }
}

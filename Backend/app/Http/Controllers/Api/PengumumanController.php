<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengumuman;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class PengumumanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pengumuman = QueryBuilder::for(Pengumuman::class)
            ->allowedFilters('judul', 'status')
            ->allowedSorts('tanggal_publish', 'created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($pengumuman);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'konten' => ['required', 'string'],
            'gambar' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,published'],
            'tanggal_publish' => ['nullable', 'date'],
        ]);

        $data['user_id'] = $request->user()->id;

        if (($data['status'] ?? 'draft') === 'published' && empty($data['tanggal_publish'])) {
            $data['tanggal_publish'] = now();
        }

        $pengumuman = Pengumuman::create($data);

        return response()->json($pengumuman, 201);
    }

    public function show(Pengumuman $pengumuman): JsonResponse
    {
        return response()->json($pengumuman->load('user'));
    }

    public function update(Request $request, Pengumuman $pengumuman): JsonResponse
    {
        $data = $request->validate([
            'judul' => ['sometimes', 'string', 'max:255'],
            'konten' => ['sometimes', 'string'],
            'gambar' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,published'],
            'tanggal_publish' => ['nullable', 'date'],
        ]);

        if (($data['status'] ?? null) === 'published' && ! $pengumuman->tanggal_publish && empty($data['tanggal_publish'])) {
            $data['tanggal_publish'] = now();
        }

        $pengumuman->update($data);

        return response()->json($pengumuman);
    }

    public function destroy(Pengumuman $pengumuman): JsonResponse
    {
        $pengumuman->delete();

        return response()->json(['message' => 'Pengumuman berhasil dihapus.']);
    }
}

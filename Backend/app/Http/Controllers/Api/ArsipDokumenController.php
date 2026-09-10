<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArsipDokumen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ArsipDokumenController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $arsip = QueryBuilder::for(ArsipDokumen::class)
            ->allowedFilters('judul', AllowedFilter::exact('kategori'))
            ->allowedSorts('tanggal_dokumen', 'created_at')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($arsip);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'string', 'max:100'],
            'nomor_dokumen' => ['nullable', 'string', 'max:100'],
            'tanggal_dokumen' => ['nullable', 'date'],
            'keterangan' => ['nullable', 'string'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $data['file'] = $request->file('file')->store('arsip', 'public');
        $data['user_id'] = $request->user()->id;

        $arsip = ArsipDokumen::create($data);

        return response()->json($arsip->load('user:id,name'), 201);
    }

    public function show(ArsipDokumen $arsipDokumen): JsonResponse
    {
        return response()->json($arsipDokumen->load('user:id,name'));
    }

    public function update(Request $request, ArsipDokumen $arsipDokumen): JsonResponse
    {
        $data = $request->validate([
            'judul' => ['sometimes', 'string', 'max:255'],
            'kategori' => ['sometimes', 'string', 'max:100'],
            'nomor_dokumen' => ['nullable', 'string', 'max:100'],
            'tanggal_dokumen' => ['nullable', 'date'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $arsipDokumen->update($data);

        return response()->json($arsipDokumen);
    }

    public function destroy(ArsipDokumen $arsipDokumen): JsonResponse
    {
        Storage::disk('public')->delete($arsipDokumen->file);
        $arsipDokumen->delete();

        return response()->json(['message' => 'Arsip dokumen berhasil dihapus.']);
    }

    public function showFile(string $path): StreamedResponse|Response
    {
        $path = 'arsip/' . $path;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}

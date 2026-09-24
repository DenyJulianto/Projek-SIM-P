<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MateriController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $materi = QueryBuilder::for(Materi::class)
            ->allowedFilters(AllowedFilter::exact('kelas_id'), AllowedFilter::exact('mata_pelajaran_id'), AllowedFilter::exact('guru_id'))
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($materi);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['required', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'guru_id' => ['required', 'exists:guru,id'],
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'tautan' => ['nullable', 'string', 'max:500'],
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png,mp4,mov,webm', 'max:20480'],
        ], [
            'file.mimes' => 'File harus berformat PDF, DOCX, JPG, PNG, atau video (MP4, MOV, WEBM).',
            'file.max' => 'Ukuran file maksimal 20 MB.',
            'file.uploaded' => 'File gagal diunggah. Ukuran file maksimal 20 MB.',
        ]);

        if ($request->hasFile('file')) {
            $data['file'] = $request->file('file')->store('materi', 'public');
        }

        $materi = Materi::create($data);

        activity()->causedBy($request->user())->log("Menambahkan materi \"{$materi->judul}\".");

        return response()->json($materi->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']), 201);
    }

    public function show(Materi $materi): JsonResponse
    {
        return response()->json($materi->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']));
    }

    public function update(Request $request, Materi $materi): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['sometimes', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['sometimes', 'exists:mata_pelajaran,id'],
            'judul' => ['sometimes', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'tautan' => ['nullable', 'string', 'max:500'],
        ]);

        $materi->update($data);

        activity()->causedBy($request->user())->log("Memperbarui materi \"{$materi->judul}\".");

        return response()->json($materi->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']));
    }

    public function destroy(Request $request, Materi $materi): JsonResponse
    {
        if ($materi->file) {
            Storage::disk('public')->delete($materi->file);
        }

        $judul = $materi->judul;
        $materi->delete();

        activity()->causedBy($request->user())->log("Menghapus materi \"{$judul}\".");

        return response()->json(['message' => 'Materi berhasil dihapus.']);
    }

    public function showFile(string $path): StreamedResponse|Response
    {
        $path = 'materi/' . $path;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}

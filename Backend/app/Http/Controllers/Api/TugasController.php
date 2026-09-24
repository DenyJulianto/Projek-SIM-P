<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tugas;
use App\Models\TugasJawaban;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TugasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tugas = QueryBuilder::for(Tugas::class)
            ->allowedFilters(AllowedFilter::exact('kelas_id'), AllowedFilter::exact('mata_pelajaran_id'), AllowedFilter::exact('guru_id'))
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->withCount('jawaban')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($tugas);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['required', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'guru_id' => ['required', 'exists:guru,id'],
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'deadline' => ['required', 'date'],
            'file' => ['nullable', 'file', 'max:10240'],
        ]);

        if ($request->hasFile('file')) {
            $data['file'] = $request->file('file')->store('tugas', 'public');
        }

        $tugas = Tugas::create($data);

        activity()->causedBy($request->user())->log("Menambahkan tugas \"{$tugas->judul}\".");

        return response()->json($tugas->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']), 201);
    }

    public function show(Tugas $tugas): JsonResponse
    {
        return response()->json($tugas->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']));
    }

    public function update(Request $request, Tugas $tugas): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['sometimes', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['sometimes', 'exists:mata_pelajaran,id'],
            'judul' => ['sometimes', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'deadline' => ['sometimes', 'date'],
        ]);

        $tugas->update($data);

        activity()->causedBy($request->user())->log("Memperbarui tugas \"{$tugas->judul}\".");

        return response()->json($tugas->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']));
    }

    public function destroy(Request $request, Tugas $tugas): JsonResponse
    {
        if ($tugas->file) {
            Storage::disk('public')->delete($tugas->file);
        }

        $judul = $tugas->judul;
        $tugas->delete();

        activity()->causedBy($request->user())->log("Menghapus tugas \"{$judul}\".");

        return response()->json(['message' => 'Tugas berhasil dihapus.']);
    }

    public function jawaban(Tugas $tugas): JsonResponse
    {
        $jawaban = $tugas->jawaban()
            ->with('siswa:id,nama,nis')
            ->orderByDesc('submitted_at')
            ->get();

        return response()->json($jawaban);
    }

    public function nilai(Request $request, TugasJawaban $tugasJawaban): JsonResponse
    {
        $data = $request->validate([
            'nilai' => ['required', 'numeric', 'min:0', 'max:100'],
            'catatan_guru' => ['nullable', 'string'],
        ]);

        $data['status'] = 'dinilai';

        $tugasJawaban->update($data);

        activity()->causedBy($request->user())->log("Menilai jawaban tugas siswa \"{$tugasJawaban->siswa->nama}\".");

        return response()->json($tugasJawaban->load('siswa:id,nama,nis'));
    }

    public function showFile(string $path): StreamedResponse|Response
    {
        $path = 'tugas/' . $path;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }

    public function showJawabanFile(string $path): StreamedResponse|Response
    {
        $path = 'tugas-jawaban/' . $path;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}

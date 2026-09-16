<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ujian;
use App\Models\UjianSoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UjianController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ujian = QueryBuilder::for(Ujian::class)
            ->allowedFilters(AllowedFilter::exact('kelas_id'), AllowedFilter::exact('mata_pelajaran_id'), AllowedFilter::exact('guru_id'))
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->withCount(['soal', 'attempts'])
            ->orderByDesc('waktu_mulai')
            ->paginate($request->integer('per_page', 15));

        return response()->json($ujian);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['required', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'exists:mata_pelajaran,id'],
            'guru_id' => ['required', 'exists:guru,id'],
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'waktu_mulai' => ['required', 'date'],
            'waktu_selesai' => ['required', 'date', 'after:waktu_mulai'],
            'durasi_menit' => ['required', 'integer', 'min:1'],
        ]);

        $ujian = Ujian::create($data);

        activity()->causedBy($request->user())->log("Menambahkan ujian \"{$ujian->judul}\".");

        return response()->json($ujian->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']), 201);
    }

    public function show(Ujian $ujian): JsonResponse
    {
        return response()->json($ujian->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama', 'soal']));
    }

    public function update(Request $request, Ujian $ujian): JsonResponse
    {
        $data = $request->validate([
            'kelas_id' => ['sometimes', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['sometimes', 'exists:mata_pelajaran,id'],
            'judul' => ['sometimes', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'waktu_mulai' => ['sometimes', 'date'],
            'waktu_selesai' => ['sometimes', 'date', 'after:waktu_mulai'],
            'durasi_menit' => ['sometimes', 'integer', 'min:1'],
        ]);

        $ujian->update($data);

        activity()->causedBy($request->user())->log("Memperbarui ujian \"{$ujian->judul}\".");

        return response()->json($ujian->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama']));
    }

    public function destroy(Request $request, Ujian $ujian): JsonResponse
    {
        $judul = $ujian->judul;
        $ujian->delete();

        activity()->causedBy($request->user())->log("Menghapus ujian \"{$judul}\".");

        return response()->json(['message' => 'Ujian berhasil dihapus.']);
    }

    public function soal(Ujian $ujian): JsonResponse
    {
        return response()->json($ujian->soal()->orderBy('urutan')->get());
    }

    public function storeSoal(Request $request, Ujian $ujian): JsonResponse
    {
        $data = $request->validate([
            'pertanyaan' => ['required', 'string'],
            'pilihan_a' => ['required', 'string', 'max:255'],
            'pilihan_b' => ['required', 'string', 'max:255'],
            'pilihan_c' => ['required', 'string', 'max:255'],
            'pilihan_d' => ['required', 'string', 'max:255'],
            'jawaban_benar' => ['required', 'in:a,b,c,d'],
        ]);

        $data['ujian_id'] = $ujian->id;
        $data['urutan'] = $ujian->soal()->count();

        $soal = UjianSoal::create($data);

        return response()->json($soal, 201);
    }

    public function updateSoal(Request $request, UjianSoal $soal): JsonResponse
    {
        $data = $request->validate([
            'pertanyaan' => ['sometimes', 'string'],
            'pilihan_a' => ['sometimes', 'string', 'max:255'],
            'pilihan_b' => ['sometimes', 'string', 'max:255'],
            'pilihan_c' => ['sometimes', 'string', 'max:255'],
            'pilihan_d' => ['sometimes', 'string', 'max:255'],
            'jawaban_benar' => ['sometimes', 'in:a,b,c,d'],
        ]);

        $soal->update($data);

        return response()->json($soal);
    }

    public function destroySoal(UjianSoal $soal): JsonResponse
    {
        $soal->delete();

        return response()->json(['message' => 'Soal berhasil dihapus.']);
    }

    public function attempts(Ujian $ujian): JsonResponse
    {
        $attempts = $ujian->attempts()
            ->with('siswa:id,nama,nis')
            ->orderByDesc('started_at')
            ->get();

        return response()->json($attempts);
    }
}

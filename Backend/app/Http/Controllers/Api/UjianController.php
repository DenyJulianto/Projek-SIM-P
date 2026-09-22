<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ujian;
use App\Models\UjianAttempt;
use App\Models\UjianJawaban;
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
            'kkm' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $data['kkm'] ??= 75;

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
            'kkm' => ['sometimes', 'integer', 'min:0', 'max:100'],
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
        $data = $request->validate($this->aturanSoal(), $this->pesanSoal());

        $data['ujian_id'] = $ujian->id;
        $data['urutan'] = $ujian->soal()->count();
        $data['bobot'] ??= 1;

        if ($data['tipe'] === UjianSoal::TIPE_ESSAY) {
            $data = array_merge($data, ['pilihan_a' => null, 'pilihan_b' => null, 'pilihan_c' => null, 'pilihan_d' => null, 'jawaban_benar' => null]);
        }

        $soal = UjianSoal::create($data);

        return response()->json($soal, 201);
    }

    public function updateSoal(Request $request, UjianSoal $soal): JsonResponse
    {
        $data = $request->validate([
            'pertanyaan' => ['sometimes', 'string'],
            'bobot' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'pilihan_a' => ['sometimes', 'string', 'max:255'],
            'pilihan_b' => ['sometimes', 'string', 'max:255'],
            'pilihan_c' => ['sometimes', 'string', 'max:255'],
            'pilihan_d' => ['sometimes', 'string', 'max:255'],
            'jawaban_benar' => ['sometimes', 'in:a,b,c,d'],
        ]);

        $soal->update($data);

        return response()->json($soal);
    }

    /** @return array<string, mixed> */
    private function aturanSoal(): array
    {
        $pg = fn () => ['required_if:tipe,'.UjianSoal::TIPE_PILIHAN_GANDA, 'nullable', 'string', 'max:255'];

        return [
            'tipe' => ['required', 'in:'.UjianSoal::TIPE_PILIHAN_GANDA.','.UjianSoal::TIPE_ESSAY],
            'pertanyaan' => ['required', 'string'],
            'bobot' => ['nullable', 'integer', 'min:1', 'max:100'],
            'pilihan_a' => $pg(),
            'pilihan_b' => $pg(),
            'pilihan_c' => $pg(),
            'pilihan_d' => $pg(),
            'jawaban_benar' => ['required_if:tipe,'.UjianSoal::TIPE_PILIHAN_GANDA, 'nullable', 'in:a,b,c,d'],
        ];
    }

    /** @return array<string, string> */
    private function pesanSoal(): array
    {
        return [
            'pilihan_a.required_if' => 'Pilihan A wajib diisi untuk soal pilihan ganda.',
            'pilihan_b.required_if' => 'Pilihan B wajib diisi untuk soal pilihan ganda.',
            'pilihan_c.required_if' => 'Pilihan C wajib diisi untuk soal pilihan ganda.',
            'pilihan_d.required_if' => 'Pilihan D wajib diisi untuk soal pilihan ganda.',
            'jawaban_benar.required_if' => 'Pilih jawaban yang benar.',
        ];
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

        $attempts->each(function (UjianAttempt $attempt) use ($ujian) {
            $attempt->setRelation('ujian', $ujian);
            $attempt->essay_belum_dinilai = $attempt->essayBelumDinilai();
            $attempt->lulus = $attempt->finished_at && $attempt->nilai !== null ? (float) $attempt->nilai >= (float) $ujian->kkm : null;
        });

        return response()->json($attempts);
    }

    /** Detail jawaban seorang siswa (untuk koreksi essay). */
    public function attemptDetail(Ujian $ujian, UjianAttempt $attempt): JsonResponse
    {
        abort_unless($attempt->ujian_id === $ujian->id, 404);

        $jawabanList = $attempt->jawaban()->get()->keyBy('ujian_soal_id');

        $items = $ujian->soal()->get()->map(fn (UjianSoal $soal) => [
            'soal' => $soal,
            'jawaban' => $jawabanList->get($soal->id),
        ]);

        return response()->json([
            'attempt' => $attempt->load('siswa:id,nama,nis'),
            'items' => $items,
        ]);
    }

    /** Beri nilai untuk satu jawaban essay lalu hitung ulang nilai akhir siswa. */
    public function nilaiEssay(Request $request, UjianJawaban $jawaban): JsonResponse
    {
        $soal = $jawaban->soal;
        abort_unless($soal->tipe === UjianSoal::TIPE_ESSAY, 422, 'Hanya jawaban essay yang dinilai manual.');

        $data = $request->validate([
            'nilai_essay' => ['required', 'numeric', 'min:0', 'max:'.$soal->bobot],
        ], [
            'nilai_essay.max' => "Nilai maksimal untuk soal ini adalah {$soal->bobot}.",
        ]);

        $jawaban->update($data);

        $attempt = $jawaban->attempt;
        if ($attempt->finished_at) {
            $attempt->update(['nilai' => $attempt->hitungUlangNilai()]);
        }

        return response()->json([
            'jawaban' => $jawaban,
            'nilai_akhir' => $attempt->nilai,
            'essay_belum_dinilai' => $attempt->essayBelumDinilai(),
        ]);
    }
}

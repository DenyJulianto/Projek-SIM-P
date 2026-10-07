<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\ProgramSemester;
use App\Models\ProgramTahunan;
use App\Models\TahunAjaran;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Program Tahunan & Program Semester yang disusun guru sendiri untuk kelas dan
 * mapel yang diajarnya. Logika simpan/tampil/ekspor memakai controller
 * Kurikulum; di sini hanya pembatasan: dokumen milik guru (guru_id), kelas &
 * mapel sesuai jadwal mengajar, ubah/hapus hanya saat draf, dan status yang
 * boleh diubah guru hanya draf <-> diajukan. Verifikasi/pengesahan tetap oleh
 * Kurikulum di menu Program Tahunan/Semester.
 */
class GuruProgramController extends Controller
{
    private const JENIS = [
        'program-tahunan' => [ProgramTahunan::class, ProgramTahunanController::class, 'Program Tahunan'],
        'program-semester' => [ProgramSemester::class, ProgramSemesterController::class, 'Program Semester'],
    ];

    private function guruFor(Request $request): Guru
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru.');

        return $guru;
    }

    private function kurikulum(string $jenis): Controller
    {
        return app(self::JENIS[$jenis][1]);
    }

    private function milik(Request $request, string $jenis, int $id): Model
    {
        $program = self::JENIS[$jenis][0]::findOrFail($id);
        abort_unless($program->guru_id === $this->guruFor($request)->id, 403);

        return $program;
    }

    private function wajibDraf(Model $program): void
    {
        abort_unless($program->status_dokumen === 'draft', 422, 'Dokumen yang sudah diajukan atau diverifikasi tidak bisa diubah. Tarik pengajuan terlebih dahulu bila belum diverifikasi.');
    }

    /** Header selalu atas nama guru yang login; kelas & mapel harus dari jadwal mengajarnya. */
    private function siapkan(Request $request): void
    {
        $guru = $this->guruFor($request);
        $request->merge(['guru_id' => $guru->id]);
        if (! JadwalPelajaran::diajarOleh($guru->id, $request->integer('kelas_id') ?: null, $request->integer('mata_pelajaran_id') ?: null)) {
            throw ValidationException::withMessages(['kelas_id' => 'Pilih kelas dan mata pelajaran sesuai jadwal mengajar Anda.']);
        }
    }

    public function index(Request $request, string $jenis): JsonResponse
    {
        $request->merge(['guru_id' => $this->guruFor($request)->id, 'per_page' => 100]);

        return $this->kurikulum($jenis)->index($request);
    }

    /** Opsi form Kurikulum (TP sekonteks) ditambah tahun ajaran dan jadwal mengajar guru. */
    public function opsi(Request $request, string $jenis): JsonResponse
    {
        $guru = $this->guruFor($request);
        $opsi = $this->kurikulum($jenis)->opsi($request)->getData(true);
        unset($opsi['guru']);

        return response()->json([
            ...$opsi,
            'tahun_ajaran' => TahunAjaran::orderByDesc('nama')->get(['id', 'nama', 'is_active']),
            'tahun_ajaran_aktif' => TahunAjaran::where('is_active', true)->value('id'),
            'mengajar' => JadwalPelajaran::mengajarGuru($guru->id),
        ]);
    }

    public function show(Request $request, string $jenis, int $id): JsonResponse
    {
        return $this->kurikulum($jenis)->show($this->milik($request, $jenis, $id));
    }

    public function store(Request $request, string $jenis): JsonResponse
    {
        $this->siapkan($request);

        return $this->kurikulum($jenis)->store($request);
    }

    public function update(Request $request, string $jenis, int $id): JsonResponse
    {
        $program = $this->milik($request, $jenis, $id);
        $this->wajibDraf($program);
        $this->siapkan($request);

        return $this->kurikulum($jenis)->update($request, $program);
    }

    public function destroy(Request $request, string $jenis, int $id): JsonResponse
    {
        $program = $this->milik($request, $jenis, $id);
        $this->wajibDraf($program);

        return $this->kurikulum($jenis)->destroy($request, $program);
    }

    public function export(Request $request, string $jenis, int $id): Response
    {
        return $this->kurikulum($jenis)->export($this->milik($request, $jenis, $id));
    }

    /** Ajukan ke Kurikulum untuk diverifikasi/disahkan. */
    public function ajukan(Request $request, string $jenis, int $id): JsonResponse
    {
        $program = $this->milik($request, $jenis, $id);
        $this->wajibDraf($program);
        abort_unless($program->item()->exists(), 422, 'Isi minimal satu baris rencana sebelum diajukan.');

        return $this->ubahStatus($request, $jenis, $program, 'draft', 'diajukan', 'Mengajukan');
    }

    /** Tarik pengajuan yang belum diverifikasi supaya bisa diubah lagi. */
    public function tarik(Request $request, string $jenis, int $id): JsonResponse
    {
        $program = $this->milik($request, $jenis, $id);
        abort_unless($program->status_dokumen === 'diajukan', 422, 'Hanya pengajuan yang belum diverifikasi yang bisa ditarik.');

        return $this->ubahStatus($request, $jenis, $program, 'diajukan', 'draft', 'Menarik pengajuan');
    }

    private function ubahStatus(Request $request, string $jenis, Model $program, string $dari, string $ke, string $aksi): JsonResponse
    {
        $program->update(['status_dokumen' => $ke]);

        activity()->performedOn($program)->causedBy($request->user())->event('updated')
            ->withProperties(['old' => ['status_dokumen' => $dari], 'new' => ['status_dokumen' => $ke]])
            ->log("{$aksi} ".self::JENIS[$jenis][2]." {$program->mataPelajaran?->nama_mapel} — {$program->kelas?->nama_kelas}.");

        return $this->show($request, $jenis, $program->id);
    }
}

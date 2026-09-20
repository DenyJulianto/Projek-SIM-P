<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\GuruSertifikat;
use App\Models\JadwalPelajaran;
use App\Models\Nilai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Endpoint self-service untuk guru mata pelajaran — semua method di sini
 * SELALU mengambil profil Guru dari user yang sedang login, jadi guru tidak
 * perlu diberi permission luas (mis. monitoring-guru.jadwal-mengajar) hanya
 * untuk melihat jadwal/kelas/mapelnya sendiri. Hanya butuh auth:sanctum.
 */
class GuruSelfController extends Controller
{
    private function guruFor(Request $request): Guru
    {
        $guru = $request->user()->guru;

        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru.');

        return $guru;
    }

    public function profil(Request $request): JsonResponse
    {
        return response()->json($this->guruFor($request)->load('sertifikat'));
    }

    public function updateTugasTambahan(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $data = $request->validate([
            'tugas_tambahan' => ['present', 'array', 'max:20'],
            'tugas_tambahan.*' => ['string', 'max:100'],
        ]);

        $guru->update(['tugas_tambahan' => array_values(array_filter(array_map('trim', $data['tugas_tambahan'])))]);

        return response()->json($guru);
    }

    public function updateProfilProfesional(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:100'],
            'mata_pelajaran' => ['nullable', 'string', 'max:100'],
            'gelar' => ['nullable', 'string', 'max:100'],
            'pendidikan_terakhir' => ['nullable', 'string', 'max:100'],
            'keahlian' => ['nullable', 'string', 'max:255'],
            'kutipan' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'media_sosial' => ['nullable', 'url', 'max:255'],
        ]);

        $guru->update($data);

        return response()->json($guru);
    }

    public function storeSertifikat(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['file', 'mimes:pdf', 'max:20480'],
        ]);

        abort_if(
            $guru->sertifikat()->count() + count($request->file('files')) > 20,
            422,
            'Maksimal 20 file sertifikat.'
        );

        foreach ($request->file('files') as $file) {
            $guru->sertifikat()->create([
                'nama_file' => $file->getClientOriginalName(),
                'path' => $file->store('sertifikat', 'public'),
            ]);
        }

        return response()->json($guru->sertifikat()->latest('id')->get(), 201);
    }

    public function destroySertifikat(Request $request, GuruSertifikat $sertifikat): JsonResponse
    {
        $guru = $this->guruFor($request);

        abort_unless($sertifikat->guru_id === $guru->id, 403);

        Storage::disk('public')->delete($sertifikat->path);
        $sertifikat->delete();

        return response()->json(['message' => 'Sertifikat dihapus.']);
    }

    public function showSertifikatFile(string $path): StreamedResponse
    {
        $path = 'sertifikat/' . $path;

        abort_unless(Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path);
    }

    public function jadwal(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $jadwal = JadwalPelajaran::where('guru_id', $guru->id)
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->orderBy('hari')
            ->orderBy('jam_mulai')
            ->get();

        return response()->json($jadwal);
    }

    public function kelas(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $kelas = JadwalPelajaran::where('guru_id', $guru->id)
            ->with('kelas:id,nama_kelas,tingkat,tahun_ajaran')
            ->get()
            ->pluck('kelas')
            ->filter()
            ->unique('id')
            ->values();

        $kelas = $kelas->map(function ($k) {
            $k->jumlah_siswa = $k->siswa()->count();

            return $k;
        });

        return response()->json($kelas);
    }

    public function mataPelajaran(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $mapel = JadwalPelajaran::where('guru_id', $guru->id)
            ->with('mataPelajaran:id,nama_mapel')
            ->get()
            ->pluck('mataPelajaran')
            ->filter()
            ->unique('id')
            ->values();

        return response()->json($mapel);
    }

    public function rekapNilai(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        $rekap = Nilai::where('guru_id', $guru->id)
            ->with('mataPelajaran:id,nama_mapel')
            ->get()
            ->groupBy('mata_pelajaran_id')
            ->map(function ($items) {
                return [
                    'mata_pelajaran' => $items->first()->mataPelajaran->nama_mapel ?? '-',
                    'jumlah_nilai' => $items->count(),
                    'rata_rata' => round($items->avg('nilai'), 2),
                    'tertinggi' => (float) $items->max('nilai'),
                    'terendah' => (float) $items->min('nilai'),
                ];
            })
            ->values();

        return response()->json($rekap);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\GuruSertifikat;
use App\Models\JadwalPelajaran;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\PembagianMapel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        // Kelas guru berasal dari tiga sumber: jadwal pelajaran, pembagian
        // mata pelajaran dari Kurikulum, dan penunjukan sebagai wali kelas —
        // supaya kelas baru langsung tampil walau jadwalnya belum disusun.
        $idPengampu = JadwalPelajaran::where('guru_id', $guru->id)->pluck('kelas_id')
            ->merge(PembagianMapel::where('guru_id', $guru->id)->where('status', '!=', 'nonaktif')->pluck('kelas_id'))
            ->filter()
            ->unique();
        $idWali = Kelas::where('wali_kelas_id', $guru->id)->pluck('id');

        $kelas = Kelas::whereIn('id', $idPengampu->merge($idWali)->unique()->values())
            ->where('status', '!=', 'nonaktif')
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'tingkat', 'tahun_ajaran', 'tahun_ajaran_id']);

        // Kelas baru menyimpan tahun ajaran sebagai tahun_ajaran_id, bukan teks.
        $namaTahun = TahunAjaran::whereIn('id', $kelas->pluck('tahun_ajaran_id')->filter())->pluck('nama', 'id');

        $kelas->each(function (Kelas $k) use ($idWali, $idPengampu, $namaTahun) {
            $k->tahun_ajaran = $k->tahun_ajaran ?: $namaTahun->get($k->tahun_ajaran_id);
            $k->setAttribute('peran', array_values(array_filter([
                $idWali->contains($k->id) ? 'Wali Kelas' : null,
                $idPengampu->contains($k->id) ? 'Pengampu' : null,
            ])));
        });

        $jumlahSiswaPerKelas = Siswa::whereIn('kelas_id', $kelas->pluck('id'))
            ->select('kelas_id', DB::raw('count(*) as total'))
            ->groupBy('kelas_id')
            ->pluck('total', 'kelas_id');

        $kelas = $kelas->map(function ($k) use ($jumlahSiswaPerKelas) {
            $k->jumlah_siswa = (int) $jumlahSiswaPerKelas->get($k->id, 0);

            return $k;
        });

        return response()->json($kelas);
    }

    /**
     * Pasangan kelas + mata pelajaran yang diampu guru, dari jadwal maupun
     * pembagian mata pelajaran — pilihan "Kelas & Mapel" di form materi,
     * tugas, dan ujian (termasuk saat dipakai Wali Kelas).
     */
    public function pengampuan(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        // Wali kelas juga boleh memberi materi/tugas/ujian untuk kelas binaannya
        // pada mata pelajaran apa pun yang aktif, walau tidak mengampunya.
        $idMapelAktif = MataPelajaran::where('status', 'aktif')->pluck('id');
        $kelasBinaan = Kelas::where('wali_kelas_id', $guru->id)->pluck('id')
            ->flatMap(fn ($kelasId) => $idMapelAktif->map(fn ($mapelId) => (object) ['kelas_id' => $kelasId, 'mata_pelajaran_id' => $mapelId]));

        $pasangan = JadwalPelajaran::where('guru_id', $guru->id)->get(['kelas_id', 'mata_pelajaran_id'])
            ->concat(PembagianMapel::where('guru_id', $guru->id)->where('status', '!=', 'nonaktif')->get(['kelas_id', 'mata_pelajaran_id']))
            ->concat($kelasBinaan)
            ->filter(fn ($p) => $p->kelas_id && $p->mata_pelajaran_id)
            ->unique(fn ($p) => "{$p->kelas_id}-{$p->mata_pelajaran_id}");

        $kelas = Kelas::whereIn('id', $pasangan->pluck('kelas_id'))->where('status', '!=', 'nonaktif')->pluck('nama_kelas', 'id');
        $mapel = MataPelajaran::whereIn('id', $pasangan->pluck('mata_pelajaran_id'))->pluck('nama_mapel', 'id');

        return response()->json($pasangan
            ->filter(fn ($p) => $kelas->has($p->kelas_id) && $mapel->has($p->mata_pelajaran_id))
            ->map(fn ($p) => [
                'kelas_id' => $p->kelas_id,
                'nama_kelas' => $kelas[$p->kelas_id],
                'mata_pelajaran_id' => $p->mata_pelajaran_id,
                'nama_mapel' => $mapel[$p->mata_pelajaran_id],
            ])
            ->sortBy(['nama_kelas', 'nama_mapel'])
            ->values());
    }

    public function mataPelajaran(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        // Sama seperti kelas: dari jadwal maupun pembagian mata pelajaran.
        $idMapel = JadwalPelajaran::where('guru_id', $guru->id)->pluck('mata_pelajaran_id')
            ->merge(PembagianMapel::where('guru_id', $guru->id)->where('status', '!=', 'nonaktif')->pluck('mata_pelajaran_id'))
            ->filter()
            ->unique()
            ->values();

        $mapel = MataPelajaran::whereIn('id', $idMapel)->orderBy('nama_mapel')->get(['id', 'nama_mapel']);

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

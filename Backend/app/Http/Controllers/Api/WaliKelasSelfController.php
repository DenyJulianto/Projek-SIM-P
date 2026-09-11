<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatatanSiswa;
use App\Models\KasusSiswa;
use App\Models\Kelas;
use App\Models\Konseling;
use App\Models\Nilai;
use App\Models\PengumumanKelas;
use App\Models\StrukturKelas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoint self-service untuk wali kelas — setiap method yang menerima
 * {kelas} atau siswa/catatan/pengumuman terkait SELALU memverifikasi lewat
 * authorizeKelas()/authorizeSiswa() bahwa data tersebut benar-benar milik
 * kelas binaan wali kelas yang sedang login, jadi wali kelas tidak bisa
 * melihat atau mengubah data kelas lain hanya dengan mengganti ID di URL.
 */
class WaliKelasSelfController extends Controller
{
    private function guruId(Request $request): int
    {
        $guru = $request->user()->guru;

        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru.');

        return $guru->id;
    }

    private function authorizeKelas(Request $request, Kelas $kelas): void
    {
        abort_unless($kelas->wali_kelas_id === $this->guruId($request), 403, 'Kelas ini bukan kelas binaan Anda.');
    }

    private function authorizeSiswa(Request $request, int $kelasId): void
    {
        $kelas = Kelas::findOrFail($kelasId);
        $this->authorizeKelas($request, $kelas);
    }

    public function kelasBinaan(Request $request): JsonResponse
    {
        $kelas = Kelas::where('wali_kelas_id', $this->guruId($request))
            ->withCount('siswa')
            ->get();

        return response()->json($kelas);
    }

    public function daftarSiswa(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        return response()->json($kelas->siswa()->orderBy('nama')->get());
    }

    public function getStruktur(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        return response()->json(
            StrukturKelas::where('kelas_id', $kelas->id)->with('siswa:id,nama')->get()
        );
    }

    public function storeStruktur(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'jabatan' => ['required', 'string', 'max:255'],
        ]);

        $struktur = StrukturKelas::create(['kelas_id' => $kelas->id, ...$data]);

        return response()->json($struktur->load('siswa:id,nama'), 201);
    }

    public function destroyStruktur(Request $request, Kelas $kelas, StrukturKelas $struktur): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);
        abort_unless($struktur->kelas_id === $kelas->id, 404);

        $struktur->delete();

        return response()->json(['message' => 'Struktur kelas berhasil dihapus.']);
    }

    public function rekapKelas(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $siswaIds = $kelas->siswa()->pluck('id');

        $rekapAbsensi = $kelas->absensi()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $rataNilai = Nilai::whereIn('siswa_id', $siswaIds)->avg('nilai');

        return response()->json([
            'jumlah_siswa' => $siswaIds->count(),
            'rekap_absensi' => $rekapAbsensi,
            'rata_rata_nilai' => $rataNilai ? round((float) $rataNilai, 2) : null,
            'jumlah_pelanggaran' => \App\Models\Pelanggaran::whereIn('siswa_id', $siswaIds)->count(),
            'jumlah_prestasi' => \App\Models\Prestasi::whereIn('siswa_id', $siswaIds)->count(),
        ]);
    }

    public function rekapNilai(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $siswaIds = $kelas->siswa()->pluck('id');

        $rekap = Nilai::whereIn('siswa_id', $siswaIds)
            ->with('mataPelajaran:id,nama_mapel')
            ->get()
            ->groupBy('mata_pelajaran_id')
            ->map(fn ($items) => [
                'mata_pelajaran' => $items->first()->mataPelajaran->nama_mapel ?? '-',
                'jumlah_nilai' => $items->count(),
                'rata_rata' => round($items->avg('nilai'), 2),
            ])
            ->values();

        return response()->json($rekap);
    }

    public function perkembanganAkademik(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $siswa = $kelas->siswa()->get(['id', 'nama']);

        $perkembangan = $siswa->map(function ($s) {
            $perSemester = Nilai::where('siswa_id', $s->id)
                ->selectRaw('semester, tahun_ajaran, avg(nilai) as rata_rata')
                ->groupBy('semester', 'tahun_ajaran')
                ->orderBy('tahun_ajaran')
                ->orderBy('semester')
                ->get();

            return [
                'siswa' => ['id' => $s->id, 'nama' => $s->nama],
                'per_semester' => $perSemester->map(fn ($p) => [
                    'semester' => $p->semester,
                    'tahun_ajaran' => $p->tahun_ajaran,
                    'rata_rata' => round((float) $p->rata_rata, 2),
                ]),
            ];
        });

        return response()->json($perkembangan);
    }

    public function statusNilai(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $mapelCount = \App\Models\MataPelajaran::count();
        $siswa = $kelas->siswa()->get(['id', 'nama']);

        $status = $siswa->map(function ($s) use ($mapelCount) {
            $mapelDiisi = Nilai::where('siswa_id', $s->id)->distinct('mata_pelajaran_id')->count('mata_pelajaran_id');

            return [
                'siswa' => ['id' => $s->id, 'nama' => $s->nama],
                'mata_pelajaran_terisi' => $mapelDiisi,
                'total_mata_pelajaran' => $mapelCount,
                'lengkap' => $mapelCount > 0 && $mapelDiisi >= $mapelCount,
            ];
        });

        return response()->json($status);
    }

    public function catatanSiswa(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $siswaIds = $kelas->siswa()->pluck('id');

        $catatan = CatatanSiswa::whereIn('siswa_id', $siswaIds)
            ->with('siswa:id,nama')
            ->when($request->filled('kategori'), fn ($q) => $q->where('kategori', $request->string('kategori')))
            ->orderByDesc('tanggal')
            ->get();

        return response()->json($catatan);
    }

    public function storeCatatanSiswa(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'tanggal' => ['required', 'date'],
            'kategori' => ['required', 'in:akademik,perilaku,kesehatan,lainnya'],
            'catatan' => ['required', 'string'],
        ]);

        $siswa = \App\Models\Siswa::findOrFail($data['siswa_id']);
        $this->authorizeSiswa($request, $siswa->kelas_id);

        $catatan = CatatanSiswa::create([...$data, 'guru_id' => $this->guruId($request)]);

        return response()->json($catatan->load('siswa:id,nama'), 201);
    }

    public function updateCatatanSiswa(Request $request, CatatanSiswa $catatanSiswa): JsonResponse
    {
        $this->authorizeSiswa($request, $catatanSiswa->siswa->kelas_id);

        $data = $request->validate([
            'tanggal' => ['required', 'date'],
            'kategori' => ['required', 'in:akademik,perilaku,kesehatan,lainnya'],
            'catatan' => ['required', 'string'],
        ]);

        $catatanSiswa->update($data);

        return response()->json($catatanSiswa->load('siswa:id,nama'));
    }

    public function destroyCatatanSiswa(Request $request, CatatanSiswa $catatanSiswa): JsonResponse
    {
        $this->authorizeSiswa($request, $catatanSiswa->siswa->kelas_id);

        $catatanSiswa->delete();

        return response()->json(['message' => 'Catatan siswa berhasil dihapus.']);
    }

    public function konsultasiBk(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $siswaIds = $kelas->siswa()->pluck('id');

        return response()->json([
            'konseling' => Konseling::whereIn('siswa_id', $siswaIds)->with('siswa:id,nama')->orderByDesc('tanggal')->get(),
            'kasus' => KasusSiswa::whereIn('siswa_id', $siswaIds)->with('siswa:id,nama')->orderByDesc('tanggal_kejadian')->get(),
        ]);
    }

    public function pengumumanKelas(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        return response()->json(
            PengumumanKelas::where('kelas_id', $kelas->id)->orderByDesc('created_at')->get()
        );
    }

    public function storePengumumanKelas(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'konten' => ['required', 'string'],
        ]);

        $pengumuman = PengumumanKelas::create([
            'kelas_id' => $kelas->id,
            'guru_id' => $this->guruId($request),
            ...$data,
        ]);

        return response()->json($pengumuman, 201);
    }

    public function destroyPengumumanKelas(Request $request, Kelas $kelas, PengumumanKelas $pengumuman): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);
        abort_unless($pengumuman->kelas_id === $kelas->id, 404);

        $pengumuman->delete();

        return response()->json(['message' => 'Pengumuman kelas berhasil dihapus.']);
    }

    public function komunikasiOrtu(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $siswa = $kelas->siswa()->with('walis:id,name,email')->get(['id', 'nama']);

        $kontak = $siswa->map(fn ($s) => [
            'siswa' => ['id' => $s->id, 'nama' => $s->nama],
            'wali' => $s->walis->map(fn ($w) => ['nama' => $w->name, 'email' => $w->email]),
        ]);

        return response()->json($kontak);
    }
}

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
use App\Models\Siswa;
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
            ->with('waliKelas:id,nama')
            ->get();

        return response()->json($kelas);
    }

    public function daftarSiswa(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $siswa = $kelas->siswa()->orderBy('nama')->with('user:id,avatar')->get();

        $siswa->each(function ($s) {
            if ($s->user) {
                $s->user->setAttribute('avatar_url', $s->user->avatar ? "/avatar/{$s->user->avatar}" : null);
            }
        });

        return response()->json($siswa);
    }

    public function storeSiswa(Request $request, Kelas $kelas): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);

        $data = $request->validate([
            'nis' => ['required', 'string', 'max:20', 'unique:siswa,nis'],
            'nisn' => ['nullable', 'string', 'max:20', 'unique:siswa,nisn'],
            'nama' => ['required', 'string', 'max:255'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
        ]);

        $siswa = Siswa::create([
            ...$data,
            'kelas_id' => $kelas->id,
            'tahun_masuk' => (int) now()->year,
            'status' => 'aktif',
        ]);

        return response()->json($siswa, 201);
    }

    public function keluarkanSiswa(Request $request, Kelas $kelas, Siswa $siswa): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);
        abort_unless($siswa->kelas_id === $kelas->id, 403, 'Siswa ini bukan anggota kelas binaan Anda.');

        $data = $request->validate([
            'jenis' => ['required', 'in:pindah_kelas,pindah_sekolah,lainnya'],
            'alasan' => ['required', 'string', 'max:1000'],
        ]);

        $jenisLabel = [
            'pindah_kelas' => 'Pindah Kelas',
            'pindah_sekolah' => 'Pindah Sekolah',
            'lainnya' => 'Lainnya',
        ][$data['jenis']];

        CatatanSiswa::create([
            'siswa_id' => $siswa->id,
            'tanggal' => now()->toDateString(),
            'kategori' => 'lainnya',
            'catatan' => "Siswa dikeluarkan dari kelas {$kelas->nama_kelas} ({$jenisLabel}): {$data['alasan']}",
        ]);

        $statusBaru = match ($data['jenis']) {
            'pindah_sekolah' => 'pindah',
            'lainnya' => 'keluar',
            default => 'aktif',
        };

        $siswa->update(['status' => $statusBaru, 'kelas_id' => null]);

        return response()->json(['message' => 'Siswa berhasil dikeluarkan dari kelas.']);
    }

    public function updateSiswa(Request $request, Kelas $kelas, Siswa $siswa): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);
        abort_unless($siswa->kelas_id === $kelas->id, 403, 'Siswa ini bukan anggota kelas binaan Anda.');

        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:255'],
            'nis' => ['sometimes', 'string', 'max:20', 'unique:siswa,nis,' . $siswa->id],
            'nisn' => ['nullable', 'string', 'max:20', 'unique:siswa,nisn,' . $siswa->id],
            'jenis_kelamin' => ['sometimes', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'status' => ['nullable', 'in:aktif,lulus,pindah,keluar'],
        ]);

        $siswa->update($data);

        return response()->json($siswa);
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

        abort_unless($kelas->siswa()->whereKey($data['siswa_id'])->exists(), 422, 'Siswa bukan anggota kelas ini.');

        $jabatanTunggal = ['ketua murid', 'wakil ketua murid', 'sekretaris 1', 'sekretaris 2', 'bendahara 1', 'bendahara 2'];
        if (in_array(mb_strtolower($data['jabatan']), $jabatanTunggal, true)) {
            StrukturKelas::where('kelas_id', $kelas->id)
                ->whereRaw('lower(jabatan) = ?', [mb_strtolower($data['jabatan'])])
                ->delete();
        } else {
            abort_if(
                StrukturKelas::where('kelas_id', $kelas->id)->where('siswa_id', $data['siswa_id'])
                    ->whereRaw('lower(jabatan) = ?', [mb_strtolower($data['jabatan'])])->exists(),
                422,
                'Siswa ini sudah tercatat pada jabatan tersebut.'
            );
        }

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

        $tanggalAcuan = $kelas->absensi()->whereDate('tanggal', '<=', now()->toDateString())->max('tanggal');
        $acuan = $tanggalAcuan ? \Illuminate\Support\Carbon::parse($tanggalAcuan) : null;

        $absensiHariIni = null;
        $absensiMingguan = [];
        if ($acuan) {
            $absensiHariIni = [
                'tanggal' => $acuan->toDateString(),
                'adalah_hari_ini' => $acuan->isToday(),
                'per_status' => $kelas->absensi()->whereDate('tanggal', $acuan->toDateString())
                    ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            ];

            $senin = $acuan->copy()->startOfWeek();
            $rekapHarian = $kelas->absensi()
                ->whereDate('tanggal', '>=', $senin->toDateString())
                ->whereDate('tanggal', '<=', $senin->copy()->addDays(4)->toDateString())
                ->get(['tanggal', 'status'])
                ->groupBy(fn ($a) => $a->tanggal->toDateString());

            foreach (['Sen', 'Sel', 'Rab', 'Kam', 'Jum'] as $i => $label) {
                $tgl = $senin->copy()->addDays($i)->toDateString();
                $hari = $rekapHarian->get($tgl);
                $absensiMingguan[] = [
                    'label' => $label,
                    'tanggal' => $tgl,
                    'persen_hadir' => $hari ? round($hari->where('status', 'hadir')->count() / $hari->count() * 100) : null,
                ];
            }
        }

        return response()->json([
            'jumlah_siswa' => $siswaIds->count(),
            'absensi_hari_ini' => $absensiHariIni,
            'absensi_mingguan' => $absensiMingguan,
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
            'kategori' => ['nullable', 'in:umum,akademik,kegiatan,penting'],
        ]);

        $pengumuman = PengumumanKelas::create([
            'kelas_id' => $kelas->id,
            'guru_id' => $this->guruId($request),
            'kategori' => $data['kategori'] ?? 'umum',
            'judul' => $data['judul'],
            'konten' => $data['konten'],
        ]);

        return response()->json($pengumuman, 201);
    }

    public function updatePengumumanKelas(Request $request, Kelas $kelas, PengumumanKelas $pengumuman): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);
        abort_unless($pengumuman->kelas_id === $kelas->id, 404);

        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'konten' => ['required', 'string'],
            'kategori' => ['nullable', 'in:umum,akademik,kegiatan,penting'],
        ]);

        $pengumuman->update([
            'judul' => $data['judul'],
            'konten' => $data['konten'],
            'kategori' => $data['kategori'] ?? $pengumuman->kategori,
        ]);

        return response()->json($pengumuman);
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

        $siswa = $kelas->siswa()->with('walis:id,name,email,phone')->get(['id', 'nama', 'nama_wali', 'telepon_wali']);

        $kontak = $siswa->map(fn ($s) => [
            'siswa' => ['id' => $s->id, 'nama' => $s->nama],
            'wali' => $s->walis->map(fn ($w) => ['nama' => $w->name, 'email' => $w->email, 'telepon' => $w->phone]),
            'kontak_manual' => $s->nama_wali || $s->telepon_wali
                ? ['nama' => $s->nama_wali, 'telepon' => $s->telepon_wali]
                : null,
        ]);

        return response()->json($kontak);
    }

    public function updateKontakWali(Request $request, Kelas $kelas, Siswa $siswa): JsonResponse
    {
        $this->authorizeKelas($request, $kelas);
        abort_unless($siswa->kelas_id === $kelas->id, 403, 'Siswa ini bukan anggota kelas binaan Anda.');

        $data = $request->validate([
            'nama_wali' => ['nullable', 'string', 'max:255'],
            'telepon_wali' => ['nullable', 'string', 'max:30'],
        ]);

        $siswa->update($data);

        return response()->json(['nama_wali' => $siswa->nama_wali, 'telepon_wali' => $siswa->telepon_wali]);
    }
}

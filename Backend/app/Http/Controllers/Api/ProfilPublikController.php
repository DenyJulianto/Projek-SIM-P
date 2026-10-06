<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Pengumuman;
use App\Models\PpdbPeriode;
use App\Models\Prestasi;
use App\Settings\ProfilSekolahSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfilPublikController extends Controller
{
    /**
     * Data landing page publik: identitas sekolah (dari central) + konten
     * yang bisa diedit Humas (visi, misi, sambutan, sosial media).
     */
    public function profil(ProfilSekolahSettings $settings): JsonResponse
    {
        $sekolah = tenant();

        return response()->json([
            'nama_sekolah' => $sekolah->nama_sekolah,
            'npsn' => $sekolah->npsn,
            'jenjang' => $sekolah->jenjang,
            'tahun_berdiri' => $sekolah->tahun_berdiri,
            'alamat' => $sekolah->alamat,
            'kecamatan' => $sekolah->kecamatan,
            'kelurahan' => $sekolah->kelurahan,
            'kabupaten_kota' => $sekolah->kabupaten_kota,
            'provinsi' => $sekolah->provinsi,
            'latitude' => $sekolah->latitude,
            'longitude' => $sekolah->longitude,
            'telepon' => $sekolah->telepon,
            'email' => $sekolah->email,
            'logo' => $sekolah->logo,
            'visi' => $settings->visi,
            'misi' => $settings->misi,
            'sambutan_kepala_sekolah' => $settings->sambutan_kepala_sekolah,
            'hero_image' => $settings->hero_image,
            'auth_background' => $settings->auth_background,
            'sosial_media' => [
                'facebook' => $settings->facebook,
                'instagram' => $settings->instagram,
                'youtube' => $settings->youtube,
            ],
        ]);
    }

    public function updateProfil(Request $request, ProfilSekolahSettings $settings): JsonResponse
    {
        $data = $request->validate([
            'nama_sekolah' => ['sometimes', 'string', 'max:255'],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'kelurahan' => ['nullable', 'string', 'max:255'],
            'kabupaten_kota' => ['nullable', 'string', 'max:255'],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'telepon' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'logo' => ['nullable', 'string'],
            'visi' => ['nullable', 'string'],
            'misi' => ['nullable', 'string'],
            'sambutan_kepala_sekolah' => ['nullable', 'string'],
            'hero_image' => ['nullable', 'string'],
            'auth_background' => ['nullable', 'string'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'instagram' => ['nullable', 'string', 'max:255'],
            'youtube' => ['nullable', 'string', 'max:255'],
        ]);

        $sekolahFields = array_intersect_key(
            $data,
            array_flip([
                'nama_sekolah', 'jenjang', 'alamat', 'kecamatan', 'kelurahan',
                'kabupaten_kota', 'provinsi', 'latitude', 'longitude', 'telepon', 'email', 'logo',
            ])
        );

        if ($sekolahFields !== []) {
            tenant()->update($sekolahFields);
        }

        $settingsFields = array_diff_key($data, $sekolahFields);
        $settings->fill($settingsFields)->save();

        return $this->profil($settings);
    }

    /**
     * Upload gambar untuk landing page (logo, gambar hero, latar login)
     * dari editor landing page Admin Sekolah. Yang disimpan di profil
     * tetap berupa URL, jadi field lama yang berisi URL eksternal tetap jalan.
     */
    public function uploadGambar(Request $request): JsonResponse
    {
        $request->validate([
            'gambar' => ['required', 'image', 'max:4096'],
        ]);

        $path = $request->file('gambar')->store('landing', 'public');

        return response()->json([
            'url' => url('landing-gambar/'.basename($path)),
        ]);
    }

    public function showGambar(string $file): StreamedResponse|Response
    {
        $path = 'landing/'.basename($file);

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }

    /**
     * Info PPDB untuk landing page: periode yang sedang berjalan (bukan
     * Draft/Selesai), berisi jadwal, kuota, jalur aktif, dan persyaratan
     * dokumen. Tidak ada data pendaftar di sini. null jika tidak ada PPDB.
     */
    public function ppdb(): JsonResponse
    {
        $label = [
            'dibuka' => 'Pendaftaran Dibuka', 'ditutup' => 'Pendaftaran Ditutup', 'seleksi' => 'Proses Seleksi',
            'pengumuman' => 'Pengumuman', 'daftar_ulang' => 'Daftar Ulang',
        ];

        $p = PpdbPeriode::query()
            ->whereIn('status', array_keys($label))
            ->with(['tahunAjaran:id,nama', 'jalur', 'persyaratan'])
            ->orderByDesc('tanggal_mulai')
            ->first();

        if (! $p) {
            return response()->json(null);
        }

        $tgl = fn ($d) => $d ? substr((string) $d, 0, 10) : null;
        $jalur = $p->jalur->where('aktif', true)->values();

        return response()->json([
            'nama' => $p->nama,
            'tahun_ajaran' => $p->tahunAjaran?->nama,
            'jenjang' => $p->jenjang,
            'status' => $p->status,
            'status_label' => $label[$p->status],
            'tanggal_mulai' => $tgl($p->tanggal_mulai),
            'tanggal_selesai' => $tgl($p->tanggal_selesai),
            'jadwal_seleksi' => $tgl($p->jadwal_seleksi),
            'jadwal_pengumuman' => $tgl($p->jadwal_pengumuman),
            'daftar_ulang_mulai' => $tgl($p->daftar_ulang_mulai),
            'daftar_ulang_selesai' => $tgl($p->daftar_ulang_selesai),
            'kuota' => $p->kuota,
            'catatan' => $p->catatan,
            'jalur' => $jalur->map(fn ($j) => [
                'id' => $j->id, 'nama' => $j->nama, 'kuota' => $j->kuota, 'deskripsi' => $j->deskripsi,
            ]),
            'persyaratan' => $p->persyaratan
                ->where('tahap', 'pendaftaran')
                ->filter(fn ($r) => ! $r->ppdb_jalur_id || $jalur->contains('id', $r->ppdb_jalur_id))
                ->values()
                ->map(fn ($r) => [
                    'nama' => $r->nama, 'wajib' => (bool) $r->wajib, 'keterangan' => $r->keterangan,
                    'jalur' => $r->ppdb_jalur_id ? $jalur->firstWhere('id', $r->ppdb_jalur_id)?->nama : null,
                ]),
        ]);
    }

    public function pengumuman(Request $request): JsonResponse
    {
        $pengumuman = Pengumuman::query()
            ->where('status', 'published')
            ->orderByDesc('tanggal_publish')
            ->paginate($request->integer('per_page', 10));

        return response()->json($pengumuman);
    }

    public function kegiatan(Request $request): JsonResponse
    {
        $kegiatan = Kegiatan::query()
            ->where('status', 'published')
            ->orderByDesc('tanggal_mulai')
            ->paginate($request->integer('per_page', 10));

        return response()->json($kegiatan);
    }

    /**
     * Prestasi siswa untuk landing page — hanya yang sudah diverifikasi, dan
     * hanya kolom yang layak tampil publik (tanpa NIS, file bukti, dsb).
     */
    public function prestasi(Request $request): JsonResponse
    {
        $prestasi = Prestasi::query()
            ->where('status', 'terverifikasi')
            ->with('siswa:id,nama,kelas_id', 'siswa.kelas:id,nama_kelas')
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 6))
            ->through(fn (Prestasi $p) => [
                'id' => $p->id,
                'judul' => $p->judul,
                'bidang' => $p->bidang,
                'tingkat' => $p->tingkat,
                'peringkat' => $p->peringkat,
                'penyelenggara' => $p->penyelenggara,
                'tanggal' => $p->tanggal?->toDateString(),
                'nama_siswa' => $p->siswa?->nama,
                'kelas' => $p->siswa?->kelas?->nama_kelas,
            ]);

        return response()->json($prestasi);
    }
}

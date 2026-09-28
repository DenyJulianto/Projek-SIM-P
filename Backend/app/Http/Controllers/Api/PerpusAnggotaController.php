<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PerpusHelpers;
use App\Http\Controllers\Controller;
use App\Models\AnggotaPerpustakaan;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PerpusAnggotaController extends Controller
{
    use PerpusHelpers;

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'jenis_anggota' => ['nullable', 'in:siswa,guru,pegawai'],
            'status' => ['nullable', 'in:aktif,nonaktif'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $anggota = AnggotaPerpustakaan::with(['siswa.kelas', 'guru', 'user'])
            ->when(! empty($in['jenis_anggota']), fn ($q) => $q->where('jenis_anggota', $in['jenis_anggota']))
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w
                ->where('nomor_kartu', 'like', "%{$in['search']}%")
                ->orWhereHas('siswa', fn ($s) => $s->where('nama', 'like', "%{$in['search']}%")->orWhere('nis', 'like', "%{$in['search']}%"))
                ->orWhereHas('guru', fn ($g) => $g->where('nama', 'like', "%{$in['search']}%")->orWhere('nip', 'like', "%{$in['search']}%"))
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$in['search']}%"))))
            ->orderByDesc('id')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($anggota);
    }

    public function calon(Request $request): JsonResponse
    {
        $in = $request->validate([
            'jenis' => ['required', 'in:siswa,guru,pegawai'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $data = match ($in['jenis']) {
            'siswa' => Siswa::with('kelas')
                ->whereNotIn('id', AnggotaPerpustakaan::whereNotNull('siswa_id')->pluck('siswa_id'))
                ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('nama', 'like', "%{$in['search']}%")->orWhere('nis', 'like', "%{$in['search']}%")))
                ->orderBy('nama')->limit(30)->get()
                ->map(fn (Siswa $s) => ['id' => $s->id, 'nama' => $s->nama, 'identitas' => $s->nis, 'keterangan' => $s->kelas?->nama_kelas]),
            'guru' => Guru::whereNotIn('id', AnggotaPerpustakaan::whereNotNull('guru_id')->pluck('guru_id'))
                ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('nama', 'like', "%{$in['search']}%")->orWhere('nip', 'like', "%{$in['search']}%")))
                ->orderBy('nama')->limit(30)->get()
                ->map(fn (Guru $g) => ['id' => $g->id, 'nama' => $g->nama, 'identitas' => $g->nip, 'keterangan' => $g->jabatan]),
            'pegawai' => User::whereNotIn('id', Siswa::whereNotNull('user_id')->pluck('user_id'))
                ->whereNotIn('id', Guru::whereNotNull('user_id')->pluck('user_id'))
                ->whereNotIn('id', AnggotaPerpustakaan::whereNotNull('user_id')->pluck('user_id'))
                ->when(! empty($in['search']), fn ($q) => $q->where('name', 'like', "%{$in['search']}%"))
                ->orderBy('name')->limit(30)->get()
                ->map(fn (User $u) => ['id' => $u->id, 'nama' => $u->name, 'identitas' => $u->email, 'keterangan' => $u->getRoleNames()->first()]),
        };

        return response()->json($data->values());
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'jenis_anggota' => ['required', 'in:siswa,guru,pegawai'],
            'siswa_id' => ['required_if:jenis_anggota,siswa', 'nullable', 'integer', 'exists:siswa,id'],
            'guru_id' => ['required_if:jenis_anggota,guru', 'nullable', 'integer', 'exists:guru,id'],
            'user_id' => ['required_if:jenis_anggota,pegawai', 'nullable', 'integer', 'exists:users,id'],
            'nip_pegawai' => ['nullable', 'string', 'max:30'],
        ]);

        $kolom = ['siswa' => 'siswa_id', 'guru' => 'guru_id', 'pegawai' => 'user_id'][$in['jenis_anggota']];
        abort_if(
            AnggotaPerpustakaan::where($kolom, $in[$kolom])->exists(),
            422,
            'Sudah terdaftar sebagai anggota perpustakaan.'
        );

        $anggota = AnggotaPerpustakaan::create([
            'jenis_anggota' => $in['jenis_anggota'],
            'siswa_id' => $in['siswa_id'] ?? null,
            'guru_id' => $in['guru_id'] ?? null,
            'user_id' => $in['user_id'] ?? null,
            'nip_pegawai' => $in['nip_pegawai'] ?? null,
            'nomor_kartu' => $this->nomorKartuAnggota($in['jenis_anggota']),
            'tanggal_terdaftar' => now()->toDateString(),
            'status' => 'aktif',
        ]);

        return response()->json($anggota->load(['siswa.kelas', 'guru', 'user']), 201);
    }

    public function show(AnggotaPerpustakaan $anggota): JsonResponse
    {
        $anggota->load(['siswa.kelas', 'guru', 'user']);
        $riwayat = $anggota->peminjaman()->with('item.eksemplar.buku')->latest('tanggal_pinjam')->limit(30)->get();

        return response()->json(['anggota' => $anggota, 'riwayat_peminjaman' => $riwayat]);
    }

    public function update(Request $request, AnggotaPerpustakaan $anggota): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:aktif,nonaktif']]);
        $anggota->update($data);

        return response()->json($anggota);
    }

    public function cariKartu(Request $request): JsonResponse
    {
        $in = $request->validate(['nomor_kartu' => ['required', 'string']]);
        $anggota = AnggotaPerpustakaan::with(['siswa.kelas', 'guru', 'user'])
            ->where('nomor_kartu', $in['nomor_kartu'])
            ->where('status', 'aktif')
            ->first();

        abort_if(! $anggota, 404, 'Kartu anggota tidak ditemukan atau nonaktif.');

        return response()->json($anggota);
    }

    public function kartu(AnggotaPerpustakaan $anggota): Response
    {
        return Pdf::loadView('perpustakaan.kartu-anggota', [
            'sekolah' => tenant()->nama_sekolah ?: 'Sekolah',
            'anggota' => $anggota->load(['siswa.kelas', 'guru', 'user']),
        ])->setPaper([0, 0, 243, 153])->download("kartu-anggota-{$anggota->nomor_kartu}.pdf");
    }
}

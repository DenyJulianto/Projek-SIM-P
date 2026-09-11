<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KasusSiswa;
use App\Models\KasusTindakan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KasusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $kasus = KasusSiswa::query()
            ->with(['siswa:id,nama,kelas_id', 'guru:id,nama', 'tindakan'])
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->boolean('aktif'), fn ($q) => $q->where('status', '!=', 'selesai'))
            ->when($request->filled('kategori'), fn ($q) => $q->where('kategori', $request->string('kategori')))
            ->orderByDesc('tanggal_kejadian')
            ->paginate($request->integer('per_page', 15));

        return response()->json($kasus);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'judul' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'in:akademik,perilaku,sosial,keluarga,lainnya'],
            'tingkat' => ['required', 'in:ringan,sedang,berat'],
            'deskripsi' => ['nullable', 'string'],
            'tanggal_kejadian' => ['required', 'date'],
            'status' => ['nullable', 'in:baru,proses,selesai'],
        ]);

        $kasus = KasusSiswa::create([
            ...$data,
            'guru_id' => $request->user()->guru?->id,
        ]);

        activity()->causedBy($request->user())->log("Membuka kasus siswa \"{$kasus->judul}\".");

        return response()->json($kasus->load(['siswa:id,nama,kelas_id', 'guru:id,nama']), 201);
    }

    public function update(Request $request, KasusSiswa $kasus): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'judul' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'in:akademik,perilaku,sosial,keluarga,lainnya'],
            'tingkat' => ['required', 'in:ringan,sedang,berat'],
            'deskripsi' => ['nullable', 'string'],
            'tanggal_kejadian' => ['required', 'date'],
            'status' => ['required', 'in:baru,proses,selesai'],
        ]);

        $kasus->update($data);

        activity()->causedBy($request->user())->log("Memperbarui kasus siswa \"{$kasus->judul}\".");

        return response()->json($kasus->load(['siswa:id,nama,kelas_id', 'guru:id,nama', 'tindakan']));
    }

    public function destroy(Request $request, KasusSiswa $kasus): JsonResponse
    {
        $judul = $kasus->judul;
        $kasus->delete();

        activity()->causedBy($request->user())->log("Menghapus kasus siswa \"{$judul}\".");

        return response()->json(['message' => 'Kasus berhasil dihapus.']);
    }

    public function storeTindakan(Request $request, KasusSiswa $kasus): JsonResponse
    {
        $data = $request->validate([
            'tanggal' => ['required', 'date'],
            'deskripsi' => ['required', 'string'],
        ]);

        $tindakan = $kasus->tindakan()->create($data);

        activity()->causedBy($request->user())->log("Menambahkan tindakan pada kasus \"{$kasus->judul}\".");

        return response()->json($tindakan, 201);
    }

    public function destroyTindakan(Request $request, KasusSiswa $kasus, KasusTindakan $tindakan): JsonResponse
    {
        abort_unless($tindakan->kasus_id === $kasus->id, 404);

        $tindakan->delete();

        activity()->causedBy($request->user())->log("Menghapus tindakan pada kasus \"{$kasus->judul}\".");

        return response()->json(['message' => 'Tindakan berhasil dihapus.']);
    }
}

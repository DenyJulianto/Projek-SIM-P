<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prestasi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrestasiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $prestasi = Prestasi::query()
            ->with('siswa:id,nama,kelas_id')
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 15));

        return response()->json($prestasi);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'judul' => ['required', 'string', 'max:255'],
            'tingkat' => ['required', 'in:sekolah,kecamatan,kabupaten_kota,provinsi,nasional,internasional'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'bidang' => ['nullable', 'string', 'max:60'],
            'jenis' => ['nullable', 'in:individu,kelompok'],
            'penyelenggara' => ['nullable', 'string', 'max:255'],
            'peringkat' => ['nullable', 'string', 'max:100'],
        ]);

        $prestasi = Prestasi::create(array_filter($data, fn ($v) => $v !== null) + ['dicatat_oleh' => $request->user()?->id]);

        activity()->causedBy($request->user())->log("Menambahkan prestasi \"{$prestasi->judul}\".");

        return response()->json($prestasi->load('siswa:id,nama,kelas_id'), 201);
    }

    public function update(Request $request, Prestasi $prestasi): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'judul' => ['required', 'string', 'max:255'],
            'tingkat' => ['required', 'in:sekolah,kecamatan,kabupaten_kota,provinsi,nasional,internasional'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'bidang' => ['nullable', 'string', 'max:60'],
            'jenis' => ['nullable', 'in:individu,kelompok'],
            'penyelenggara' => ['nullable', 'string', 'max:255'],
            'peringkat' => ['nullable', 'string', 'max:100'],
        ]);

        $prestasi->update($data);

        activity()->causedBy($request->user())->log("Memperbarui prestasi \"{$prestasi->judul}\".");

        return response()->json($prestasi->load('siswa:id,nama,kelas_id'));
    }

    public function destroy(Request $request, Prestasi $prestasi): JsonResponse
    {
        $judul = $prestasi->judul;
        $prestasi->delete();

        activity()->causedBy($request->user())->log("Menghapus prestasi \"{$judul}\".");

        return response()->json(['message' => 'Prestasi berhasil dihapus.']);
    }

    public function showBuktiFile(string $path): StreamedResponse|Response
    {
        $path = 'prestasi-bukti/' . $path;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}

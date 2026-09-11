<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pelanggaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PelanggaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pelanggaran = Pelanggaran::query()
            ->with('siswa:id,nama,kelas_id')
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->orderByDesc('tanggal')
            ->paginate($request->integer('per_page', 15));

        return response()->json($pelanggaran);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'tingkat' => ['required', 'in:ringan,sedang,berat'],
            'jenis' => ['required', 'string', 'max:255'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'tindakan' => ['nullable', 'string'],
        ]);

        $pelanggaran = Pelanggaran::create($data);

        activity()->causedBy($request->user())->log("Mencatat pelanggaran \"{$pelanggaran->jenis}\".");

        return response()->json($pelanggaran->load('siswa:id,nama,kelas_id'), 201);
    }

    public function update(Request $request, Pelanggaran $pelanggaran): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'tingkat' => ['required', 'in:ringan,sedang,berat'],
            'jenis' => ['required', 'string', 'max:255'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
            'tindakan' => ['nullable', 'string'],
        ]);

        $pelanggaran->update($data);

        activity()->causedBy($request->user())->log("Memperbarui catatan pelanggaran \"{$pelanggaran->jenis}\".");

        return response()->json($pelanggaran->load('siswa:id,nama,kelas_id'));
    }

    public function destroy(Request $request, Pelanggaran $pelanggaran): JsonResponse
    {
        $jenis = $pelanggaran->jenis;
        $pelanggaran->delete();

        activity()->causedBy($request->user())->log("Menghapus catatan pelanggaran \"{$jenis}\".");

        return response()->json(['message' => 'Catatan pelanggaran berhasil dihapus.']);
    }
}

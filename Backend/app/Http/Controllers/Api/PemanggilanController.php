<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PemanggilanOrangTua;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PemanggilanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pemanggilan = PemanggilanOrangTua::query()
            ->with(['siswa:id,nama,kelas_id', 'guru:id,nama', 'kasus:id,judul'])
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('tanggal_pemanggilan')
            ->paginate($request->integer('per_page', 15));

        return response()->json($pemanggilan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'kasus_id' => ['nullable', 'exists:kasus_siswa,id'],
            'tanggal_pemanggilan' => ['required', 'date'],
            'alasan' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'in:dijadwalkan,selesai,batal'],
        ]);

        $pemanggilan = PemanggilanOrangTua::create([
            ...$data,
            'guru_id' => $request->user()->guru?->id,
        ]);

        activity()->causedBy($request->user())->log("Menjadwalkan pemanggilan orang tua: \"{$pemanggilan->alasan}\".");

        return response()->json($pemanggilan->load(['siswa:id,nama,kelas_id', 'guru:id,nama', 'kasus:id,judul']), 201);
    }

    public function update(Request $request, PemanggilanOrangTua $pemanggilan): JsonResponse
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswa,id'],
            'kasus_id' => ['nullable', 'exists:kasus_siswa,id'],
            'tanggal_pemanggilan' => ['required', 'date'],
            'alasan' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:dijadwalkan,selesai,batal'],
            'catatan_pertemuan' => ['nullable', 'string'],
        ]);

        $pemanggilan->update($data);

        activity()->causedBy($request->user())->log("Memperbarui pemanggilan orang tua: \"{$pemanggilan->alasan}\".");

        return response()->json($pemanggilan->load(['siswa:id,nama,kelas_id', 'guru:id,nama', 'kasus:id,judul']));
    }

    public function destroy(Request $request, PemanggilanOrangTua $pemanggilan): JsonResponse
    {
        $alasan = $pemanggilan->alasan;
        $pemanggilan->delete();

        activity()->causedBy($request->user())->log("Menghapus jadwal pemanggilan orang tua: \"{$alasan}\".");

        return response()->json(['message' => 'Pemanggilan berhasil dihapus.']);
    }
}

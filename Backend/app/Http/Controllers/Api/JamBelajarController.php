<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JamBelajar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JamBelajarController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(JamBelajar::orderBy('jam_ke')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jam_ke' => ['required', 'integer', 'min:1', 'unique:jam_belajar,jam_ke'],
            'label' => ['nullable', 'string', 'max:255'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
        ]);

        $jam = JamBelajar::create($data);

        activity()->causedBy($request->user())->log("Menambahkan jam belajar ke-{$jam->jam_ke}.");

        return response()->json($jam, 201);
    }

    public function update(Request $request, JamBelajar $jamBelajar): JsonResponse
    {
        $data = $request->validate([
            'jam_ke' => ['required', 'integer', 'min:1', Rule::unique('jam_belajar', 'jam_ke')->ignore($jamBelajar->id)],
            'label' => ['nullable', 'string', 'max:255'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
        ]);

        $jamBelajar->update($data);

        activity()->causedBy($request->user())->log("Memperbarui jam belajar ke-{$jamBelajar->jam_ke}.");

        return response()->json($jamBelajar);
    }

    public function destroy(Request $request, JamBelajar $jamBelajar): JsonResponse
    {
        $jamKe = $jamBelajar->jam_ke;
        $jamBelajar->delete();

        activity()->causedBy($request->user())->log("Menghapus jam belajar ke-{$jamKe}.");

        return response()->json(['message' => 'Jam belajar berhasil dihapus.']);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PengajuanKepegawaian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PengajuanKepegawaianController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pengajuan = PengajuanKepegawaian::query()
            ->with(['guru:id,nama', 'diajukanOleh:id,name', 'disetujuiOleh:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($pengajuan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jenis' => ['required', 'in:rekrutmen,promosi,mutasi,pemberhentian,lainnya'],
            'judul' => ['required', 'string', 'max:255'],
            'guru_id' => ['nullable', 'exists:guru,id'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $pengajuan = PengajuanKepegawaian::create([
            ...$data,
            'diajukan_oleh' => $request->user()->id,
            'status' => 'diajukan',
        ]);

        activity()->causedBy($request->user())->log("Mengajukan kepegawaian \"{$pengajuan->judul}\".");

        return response()->json($pengajuan->load(['guru:id,nama', 'diajukanOleh:id,name']), 201);
    }

    public function approve(Request $request, PengajuanKepegawaian $pengajuanKepegawaian): JsonResponse
    {
        $this->assertPending($pengajuanKepegawaian);

        $data = $request->validate(['catatan_persetujuan' => ['nullable', 'string']]);

        $pengajuanKepegawaian->update([
            'status' => 'disetujui',
            'disetujui_oleh' => $request->user()->id,
            'catatan_persetujuan' => $data['catatan_persetujuan'] ?? null,
            'tanggal_keputusan' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Menyetujui pengajuan kepegawaian \"{$pengajuanKepegawaian->judul}\".");

        return response()->json($pengajuanKepegawaian->load(['guru:id,nama', 'diajukanOleh:id,name', 'disetujuiOleh:id,name']));
    }

    public function reject(Request $request, PengajuanKepegawaian $pengajuanKepegawaian): JsonResponse
    {
        $this->assertPending($pengajuanKepegawaian);

        $data = $request->validate(['catatan_persetujuan' => ['required', 'string']]);

        $pengajuanKepegawaian->update([
            'status' => 'ditolak',
            'disetujui_oleh' => $request->user()->id,
            'catatan_persetujuan' => $data['catatan_persetujuan'],
            'tanggal_keputusan' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Menolak pengajuan kepegawaian \"{$pengajuanKepegawaian->judul}\".");

        return response()->json($pengajuanKepegawaian->load(['guru:id,nama', 'diajukanOleh:id,name', 'disetujuiOleh:id,name']));
    }

    private function assertPending(PengajuanKepegawaian $pengajuanKepegawaian): void
    {
        if ($pengajuanKepegawaian->status !== 'diajukan') {
            throw ValidationException::withMessages([
                'status' => ['Pengajuan ini sudah diputuskan sebelumnya.'],
            ]);
        }
    }
}

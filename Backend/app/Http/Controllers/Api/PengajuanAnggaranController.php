<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PengajuanAnggaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PengajuanAnggaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $pengajuan = PengajuanAnggaran::query()
            ->with(['anggaranPos', 'diajukanOleh:id,name', 'disetujuiOleh:id,name', 'realisasi'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($pengajuan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'anggaran_pos_id' => ['nullable', 'exists:anggaran_pos,id'],
            'judul' => ['required', 'string', 'max:255'],
            'jumlah' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $pengajuan = PengajuanAnggaran::create([
            ...$data,
            'diajukan_oleh' => $request->user()->id,
            'status' => 'diajukan',
        ]);

        activity()->causedBy($request->user())->log("Mengajukan anggaran \"{$pengajuan->judul}\".");

        return response()->json($pengajuan->load(['anggaranPos', 'diajukanOleh:id,name']), 201);
    }

    public function approve(Request $request, PengajuanAnggaran $pengajuanAnggaran): JsonResponse
    {
        $this->assertPending($pengajuanAnggaran);

        $data = $request->validate(['catatan_persetujuan' => ['nullable', 'string']]);

        $pengajuanAnggaran->update([
            'status' => 'disetujui',
            'disetujui_oleh' => $request->user()->id,
            'catatan_persetujuan' => $data['catatan_persetujuan'] ?? null,
            'tanggal_keputusan' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Menyetujui pengajuan anggaran \"{$pengajuanAnggaran->judul}\".");

        return response()->json($pengajuanAnggaran->load(['anggaranPos', 'diajukanOleh:id,name', 'disetujuiOleh:id,name']));
    }

    public function reject(Request $request, PengajuanAnggaran $pengajuanAnggaran): JsonResponse
    {
        $this->assertPending($pengajuanAnggaran);

        $data = $request->validate(['catatan_persetujuan' => ['required', 'string']]);

        $pengajuanAnggaran->update([
            'status' => 'ditolak',
            'disetujui_oleh' => $request->user()->id,
            'catatan_persetujuan' => $data['catatan_persetujuan'],
            'tanggal_keputusan' => now(),
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Menolak pengajuan anggaran \"{$pengajuanAnggaran->judul}\".");

        return response()->json($pengajuanAnggaran->load(['anggaranPos', 'diajukanOleh:id,name', 'disetujuiOleh:id,name']));
    }

    private function assertPending(PengajuanAnggaran $pengajuanAnggaran): void
    {
        if ($pengajuanAnggaran->status !== 'diajukan') {
            throw ValidationException::withMessages([
                'status' => ['Pengajuan ini sudah diputuskan sebelumnya.'],
            ]);
        }
    }
}

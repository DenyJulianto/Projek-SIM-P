<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PengajuanAnggaran;
use App\Models\RealisasiAnggaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RealisasiAnggaranController extends Controller
{
    /**
     * Ringkasan saldo: total anggaran RKAS, total pengajuan disetujui,
     * total realisasi, dan sisa saldo — dihitung langsung dari data asli.
     */
    public function index(): JsonResponse
    {
        $totalAnggaran = (float) DB::table('anggaran_pos')->sum('jumlah_anggaran');
        $totalDisetujui = (float) PengajuanAnggaran::where('status', 'disetujui')->sum('jumlah');
        $totalRealisasi = (float) RealisasiAnggaran::sum('jumlah');

        $realisasi = RealisasiAnggaran::with('pengajuanAnggaran:id,judul')
            ->orderByDesc('tanggal')
            ->get();

        return response()->json([
            'total_anggaran' => $totalAnggaran,
            'total_disetujui' => $totalDisetujui,
            'total_realisasi' => $totalRealisasi,
            'saldo' => $totalAnggaran - $totalRealisasi,
            'realisasi' => $realisasi,
        ]);
    }

    public function store(Request $request, PengajuanAnggaran $pengajuanAnggaran): JsonResponse
    {
        if ($pengajuanAnggaran->status !== 'disetujui') {
            throw ValidationException::withMessages([
                'pengajuan_anggaran_id' => ['Realisasi hanya bisa dicatat untuk pengajuan yang sudah disetujui.'],
            ]);
        }

        $data = $request->validate([
            'jumlah' => ['required', 'numeric', 'min:0.01'],
            'tanggal' => ['required', 'date'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $realisasi = RealisasiAnggaran::create([
            ...$data,
            'pengajuan_anggaran_id' => $pengajuanAnggaran->id,
            'dicatat_oleh' => $request->user()->id,
        ]);

        activity()
            ->causedBy($request->user())
            ->log("Mencatat realisasi anggaran untuk \"{$pengajuanAnggaran->judul}\".");

        return response()->json($realisasi->load('pengajuanAnggaran:id,judul'), 201);
    }
}

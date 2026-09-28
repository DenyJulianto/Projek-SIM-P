<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DendaPerpustakaan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PerpusDendaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'status_pembayaran' => ['nullable', 'in:belum_bayar,lunas'],
            'jenis_denda' => ['nullable', 'in:keterlambatan,kerusakan,kehilangan,lainnya'],
            'anggota_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $denda = DendaPerpustakaan::with(['anggota.siswa', 'anggota.guru', 'anggota.user', 'peminjamanItem.eksemplar.buku', 'petugas:id,name'])
            ->when(! empty($in['status_pembayaran']), fn ($q) => $q->where('status_pembayaran', $in['status_pembayaran']))
            ->when(! empty($in['jenis_denda']), fn ($q) => $q->where('jenis_denda', $in['jenis_denda']))
            ->when(! empty($in['anggota_id']), fn ($q) => $q->where('anggota_id', $in['anggota_id']))
            ->orderByDesc('id')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($denda);
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'anggota_id' => ['required', 'integer', 'exists:anggota_perpustakaan,id'],
            'jenis_denda' => ['required', 'in:keterlambatan,kerusakan,kehilangan,lainnya'],
            'jumlah' => ['required', 'numeric', 'min:1'],
            'catatan' => ['nullable', 'string'],
        ]);

        $denda = DendaPerpustakaan::create([
            ...$in,
            'tanggal' => now()->toDateString(),
            'petugas_id' => $request->user()->id,
        ]);

        return response()->json($denda->load('anggota'), 201);
    }

    public function bayar(Request $request, DendaPerpustakaan $denda): JsonResponse
    {
        abort_if($denda->status_pembayaran === 'lunas', 422, 'Denda ini sudah lunas.');

        $denda->update([
            'status_pembayaran' => 'lunas',
            'petugas_id' => $request->user()->id,
            'dibayar_at' => now(),
        ]);

        return response()->json($denda);
    }

    public function bukti(DendaPerpustakaan $denda): Response
    {
        abort_if($denda->status_pembayaran !== 'lunas', 422, 'Denda belum dibayar.');

        return Pdf::loadView('perpustakaan.bukti-denda', [
            'sekolah' => tenant()->nama_sekolah ?: 'Sekolah',
            'denda' => $denda->load(['anggota.siswa', 'anggota.guru', 'anggota.user', 'petugas:id,name']),
        ])->setPaper('a5', 'portrait')->download("bukti-denda-{$denda->id}.pdf");
    }
}

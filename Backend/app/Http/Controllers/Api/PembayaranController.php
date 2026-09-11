<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PembayaranController extends Controller
{
    public function store(Request $request, Tagihan $tagihan): JsonResponse
    {
        $data = $request->validate([
            'jumlah' => ['required', 'numeric', 'min:0.01'],
            'tanggal_bayar' => ['required', 'date'],
            'metode' => ['nullable', 'string', 'max:50'],
            'catatan' => ['nullable', 'string'],
        ]);

        $pembayaran = Pembayaran::create([
            ...$data,
            'tagihan_id' => $tagihan->id,
            'dicatat_oleh' => $request->user()->id,
        ]);

        $totalDibayar = $tagihan->pembayaran()->sum('jumlah');
        if ($totalDibayar >= $tagihan->jumlah) {
            $tagihan->update(['status' => 'lunas']);
        }

        activity()
            ->causedBy($request->user())
            ->log("Mencatat pembayaran untuk tagihan \"{$tagihan->judul}\".");

        return response()->json($pembayaran->load('tagihan'), 201);
    }

    public function destroy(Request $request, Tagihan $tagihan, Pembayaran $pembayaran): JsonResponse
    {
        $pembayaran->delete();

        $totalDibayar = $tagihan->pembayaran()->sum('jumlah');
        $tagihan->update(['status' => $totalDibayar >= $tagihan->jumlah ? 'lunas' : 'belum_lunas']);

        activity()
            ->causedBy($request->user())
            ->log("Menghapus pembayaran untuk tagihan \"{$tagihan->judul}\".");

        return response()->json(['message' => 'Pembayaran berhasil dihapus.']);
    }
}

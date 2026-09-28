<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PerpusHelpers;
use App\Http\Controllers\Controller;
use App\Models\AnggotaPerpustakaan;
use App\Models\EksemplarBuku;
use App\Models\PeminjamanBuku;
use App\Models\ReservasiBuku;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PerpusReservasiController extends Controller
{
    use PerpusHelpers;

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'status' => ['nullable', 'in:menunggu,siap_diambil,selesai,dibatalkan,kadaluarsa'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $reservasi = ReservasiBuku::with(['anggota.siswa', 'anggota.guru', 'anggota.user', 'buku'])
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->orderByDesc('id')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($reservasi);
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'anggota_id' => ['required', 'integer', 'exists:anggota_perpustakaan,id'],
            'buku_id' => ['required', 'integer', 'exists:buku,id'],
            'batas_pengambilan' => ['nullable', 'date', 'after:today'],
        ]);

        $anggota = AnggotaPerpustakaan::findOrFail($in['anggota_id']);
        abort_if($anggota->status !== 'aktif', 422, 'Anggota berstatus nonaktif.');

        $sudahAda = ReservasiBuku::where('anggota_id', $in['anggota_id'])->where('buku_id', $in['buku_id'])
            ->whereIn('status', ['menunggu', 'siap_diambil'])->exists();
        abort_if($sudahAda, 422, 'Anggota ini sudah memiliki reservasi aktif untuk buku tersebut.');

        $reservasi = ReservasiBuku::create([
            'nomor_reservasi' => $this->nomorReservasi(),
            'anggota_id' => $in['anggota_id'],
            'buku_id' => $in['buku_id'],
            'tanggal_reservasi' => now()->toDateString(),
            'batas_pengambilan' => $in['batas_pengambilan'] ?? now()->addDays(3)->toDateString(),
            'status' => EksemplarBuku::where('buku_id', $in['buku_id'])->where('status', 'tersedia')->exists() ? 'siap_diambil' : 'menunggu',
        ]);

        return response()->json($reservasi->load('anggota', 'buku'), 201);
    }

    public function batalkan(ReservasiBuku $reservasi): JsonResponse
    {
        abort_if(! in_array($reservasi->status, ['menunggu', 'siap_diambil'], true), 422, 'Reservasi ini sudah tidak aktif.');
        $reservasi->update(['status' => 'dibatalkan']);

        return response()->json(['message' => 'Reservasi dibatalkan.']);
    }

    public function ambil(Request $request, ReservasiBuku $reservasi): JsonResponse
    {
        abort_if(! in_array($reservasi->status, ['menunggu', 'siap_diambil'], true), 422, 'Reservasi ini sudah tidak aktif.');

        $eksemplar = EksemplarBuku::where('buku_id', $reservasi->buku_id)->where('status', 'tersedia')->first();
        abort_if(! $eksemplar, 422, 'Belum ada eksemplar tersedia untuk buku ini.');

        $peminjaman = DB::transaction(function () use ($reservasi, $eksemplar, $request) {
            $peminjaman = PeminjamanBuku::create([
                'nomor_transaksi' => $this->nomorTransaksiPeminjaman(),
                'anggota_id' => $reservasi->anggota_id,
                'petugas_id' => $request->user()->id,
                'tanggal_pinjam' => now()->toDateString(),
                'tanggal_jatuh_tempo' => now()->addDays(7)->toDateString(),
                'catatan' => "Diambil dari reservasi {$reservasi->nomor_reservasi}.",
            ]);
            $peminjaman->item()->create(['eksemplar_id' => $eksemplar->id]);
            $eksemplar->update(['status' => 'dipinjam']);
            $reservasi->update(['status' => 'selesai']);

            return $peminjaman;
        });

        return response()->json($peminjaman->load('item.eksemplar.buku'), 201);
    }
}

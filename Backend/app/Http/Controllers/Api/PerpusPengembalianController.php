<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DendaPerpustakaan;
use App\Models\PeminjamanBuku;
use App\Models\PeminjamanItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PerpusPengembalianController extends Controller
{
    /** Tarif denda keterlambatan per hari (rupiah). */
    private const DENDA_PER_HARI = 500;

    private function hariTerlambat(Carbon|string $tanggalJatuhTempo): int
    {
        $jatuhTempo = Carbon::parse($tanggalJatuhTempo)->startOfDay();

        return $jatuhTempo->isPast() ? (int) $jatuhTempo->diffInDays(Carbon::today()) : 0;
    }

    private function lengkapi(PeminjamanItem $item): array
    {
        $terlambatHari = $this->hariTerlambat($item->peminjaman->tanggal_jatuh_tempo);

        return [
            'peminjaman_item_id' => $item->id,
            'peminjaman' => $item->peminjaman->only(['id', 'nomor_transaksi', 'tanggal_pinjam', 'tanggal_jatuh_tempo']),
            'anggota' => $item->peminjaman->anggota?->only(['id', 'nama', 'nomor_kartu']),
            'buku' => $item->eksemplar->buku->only(['id', 'judul']),
            'eksemplar' => $item->eksemplar->only(['id', 'kode_inventaris', 'barcode']),
            'hari_terlambat' => $terlambatHari,
            'estimasi_denda_keterlambatan' => $terlambatHari * self::DENDA_PER_HARI,
        ];
    }

    public function cari(Request $request): JsonResponse
    {
        $in = $request->validate([
            'barcode' => ['nullable', 'string'],
            'nomor_transaksi' => ['nullable', 'string'],
        ]);
        abort_if(empty($in['barcode']) && empty($in['nomor_transaksi']), 422, 'Isi barcode buku atau nomor transaksi.');

        $query = PeminjamanItem::with(['peminjaman.anggota', 'eksemplar.buku'])->where('status', 'dipinjam');

        if (! empty($in['barcode'])) {
            $query->whereHas('eksemplar', fn ($q) => $q->where('barcode', $in['barcode']));
        } else {
            $query->whereHas('peminjaman', fn ($q) => $q->where('nomor_transaksi', $in['nomor_transaksi']));
        }

        $items = $query->get();
        abort_if($items->isEmpty(), 404, 'Tidak ditemukan peminjaman aktif yang cocok.');

        return response()->json($items->map(fn (PeminjamanItem $i) => $this->lengkapi($i))->values());
    }

    public function proses(Request $request): JsonResponse
    {
        $in = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.peminjaman_item_id' => ['required', 'integer', 'exists:peminjaman_item,id'],
            'items.*.kondisi_kembali' => ['required', 'in:baik,rusak_ringan,rusak_berat,hilang'],
            'items.*.catatan_kerusakan' => ['nullable', 'string'],
            'items.*.denda_kerusakan' => ['nullable', 'numeric', 'min:0'],
        ]);

        $hasil = DB::transaction(function () use ($in, $request) {
            $out = [];
            $peminjamanIds = [];

            foreach ($in['items'] as $baris) {
                $item = PeminjamanItem::with('peminjaman', 'eksemplar')->findOrFail($baris['peminjaman_item_id']);
                abort_if($item->status !== 'dipinjam', 422, 'Item ini sudah diproses sebelumnya.');

                $item->update([
                    'tanggal_kembali_aktual' => now()->toDateString(),
                    'kondisi_kembali' => $baris['kondisi_kembali'],
                    'catatan_kerusakan' => $baris['catatan_kerusakan'] ?? null,
                    'status' => $baris['kondisi_kembali'] === 'hilang' ? 'hilang' : 'dikembalikan',
                    'diproses_oleh' => $request->user()->id,
                ]);

                $item->eksemplar->update([
                    'status' => $baris['kondisi_kembali'] === 'baik' ? 'tersedia' : ($baris['kondisi_kembali'] === 'hilang' ? 'hilang' : 'rusak'),
                    'kondisi' => $baris['kondisi_kembali'],
                ]);

                $terlambatHari = $this->hariTerlambat($item->peminjaman->tanggal_jatuh_tempo);
                if ($terlambatHari > 0) {
                    DendaPerpustakaan::create([
                        'anggota_id' => $item->peminjaman->anggota_id,
                        'peminjaman_item_id' => $item->id,
                        'jenis_denda' => 'keterlambatan',
                        'jumlah' => $terlambatHari * self::DENDA_PER_HARI,
                        'tanggal' => now()->toDateString(),
                        'petugas_id' => $request->user()->id,
                        'catatan' => "Terlambat {$terlambatHari} hari.",
                    ]);
                }

                if ($baris['kondisi_kembali'] !== 'baik' && ! empty($baris['denda_kerusakan'])) {
                    DendaPerpustakaan::create([
                        'anggota_id' => $item->peminjaman->anggota_id,
                        'peminjaman_item_id' => $item->id,
                        'jenis_denda' => $baris['kondisi_kembali'] === 'hilang' ? 'kehilangan' : 'kerusakan',
                        'jumlah' => $baris['denda_kerusakan'],
                        'tanggal' => now()->toDateString(),
                        'petugas_id' => $request->user()->id,
                        'catatan' => $baris['catatan_kerusakan'] ?? null,
                    ]);
                }

                $peminjamanIds[$item->peminjaman_id] = true;
                $out[] = $item->id;
            }

            foreach (array_keys($peminjamanIds) as $peminjamanId) {
                $peminjaman = PeminjamanBuku::with('item')->find($peminjamanId);
                $semuaSelesai = $peminjaman->item->every(fn (PeminjamanItem $i) => $i->status !== 'dipinjam');
                $peminjaman->update(['status' => $semuaSelesai ? 'selesai' : 'sebagian_kembali']);
            }

            return $out;
        });

        return response()->json(['diproses' => count($hasil)]);
    }
}

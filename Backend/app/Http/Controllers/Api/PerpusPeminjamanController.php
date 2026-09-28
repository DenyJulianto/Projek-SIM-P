<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PerpusHelpers;
use App\Http\Controllers\Controller;
use App\Models\AnggotaPerpustakaan;
use App\Models\EksemplarBuku;
use App\Models\PeminjamanBuku;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PerpusPeminjamanController extends Controller
{
    use PerpusHelpers;

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'status' => ['nullable', 'in:dipinjam,sebagian_kembali,selesai,dibatalkan'],
            'anggota_id' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $peminjaman = PeminjamanBuku::with(['anggota.siswa', 'anggota.guru', 'anggota.user', 'item.eksemplar.buku', 'petugas:id,name'])
            ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
            ->when(! empty($in['anggota_id']), fn ($q) => $q->where('anggota_id', $in['anggota_id']))
            ->when(! empty($in['search']), fn ($q) => $q->where('nomor_transaksi', 'like', "%{$in['search']}%"))
            ->orderByDesc('id')
            ->paginate($in['per_page'] ?? 15);

        return response()->json($peminjaman);
    }

    public function cariEksemplar(Request $request): JsonResponse
    {
        $in = $request->validate(['barcode' => ['required', 'string']]);
        $eksemplar = EksemplarBuku::with('buku')->where('barcode', $in['barcode'])->first();

        abort_if(! $eksemplar, 404, 'Eksemplar tidak ditemukan.');
        abort_if($eksemplar->status !== 'tersedia', 422, "Eksemplar berstatus \"{$eksemplar->status}\" dan tidak dapat dipinjam.");

        return response()->json($eksemplar);
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'anggota_id' => ['required', 'integer', 'exists:anggota_perpustakaan,id'],
            'eksemplar_ids' => ['required', 'array', 'min:1', 'max:10'],
            'eksemplar_ids.*' => ['integer', 'exists:eksemplar_buku,id'],
            'tanggal_jatuh_tempo' => ['nullable', 'date', 'after:today'],
            'catatan' => ['nullable', 'string'],
        ]);

        $anggota = AnggotaPerpustakaan::findOrFail($in['anggota_id']);
        abort_if($anggota->status !== 'aktif', 422, 'Anggota berstatus nonaktif dan tidak dapat meminjam.');

        $eksemplar = EksemplarBuku::whereIn('id', $in['eksemplar_ids'])->get();
        $tidakTersedia = $eksemplar->where('status', '!=', 'tersedia');
        abort_if($tidakTersedia->isNotEmpty(), 422, 'Terdapat eksemplar yang sedang tidak tersedia: '.$tidakTersedia->pluck('kode_inventaris')->implode(', '));

        $peminjaman = DB::transaction(function () use ($in, $eksemplar, $request) {
            $peminjaman = PeminjamanBuku::create([
                'nomor_transaksi' => $this->nomorTransaksiPeminjaman(),
                'anggota_id' => $in['anggota_id'],
                'petugas_id' => $request->user()->id,
                'tanggal_pinjam' => now()->toDateString(),
                'tanggal_jatuh_tempo' => $in['tanggal_jatuh_tempo'] ?? now()->addDays(7)->toDateString(),
                'catatan' => $in['catatan'] ?? null,
            ]);

            foreach ($eksemplar as $e) {
                $peminjaman->item()->create(['eksemplar_id' => $e->id]);
                $e->update(['status' => 'dipinjam']);
            }

            return $peminjaman;
        });

        return response()->json($peminjaman->load('item.eksemplar.buku', 'anggota'), 201);
    }

    public function show(PeminjamanBuku $peminjaman): JsonResponse
    {
        return response()->json($peminjaman->load(['anggota.siswa.kelas', 'anggota.guru', 'anggota.user', 'item.eksemplar.buku', 'petugas:id,name']));
    }

    public function perpanjang(Request $request, PeminjamanBuku $peminjaman): JsonResponse
    {
        abort_if(! in_array($peminjaman->status, ['dipinjam', 'sebagian_kembali'], true), 422, 'Peminjaman ini sudah selesai/dibatalkan.');

        $in = $request->validate(['tanggal_jatuh_tempo' => ['required', 'date', 'after:'.$peminjaman->tanggal_jatuh_tempo->toDateString()]]);
        $peminjaman->update(['tanggal_jatuh_tempo' => $in['tanggal_jatuh_tempo']]);

        return response()->json($peminjaman);
    }

    public function batalkan(PeminjamanBuku $peminjaman): JsonResponse
    {
        abort_if($peminjaman->status !== 'dipinjam', 422, 'Hanya peminjaman yang belum ada pengembalian yang dapat dibatalkan.');

        DB::transaction(function () use ($peminjaman) {
            foreach ($peminjaman->item as $item) {
                $item->eksemplar->update(['status' => 'tersedia']);
            }
            $peminjaman->update(['status' => 'dibatalkan']);
        });

        return response()->json(['message' => 'Peminjaman dibatalkan.']);
    }
}

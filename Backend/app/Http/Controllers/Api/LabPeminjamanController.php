<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventaris;
use App\Models\PeminjamanAlat;
use App\Models\PeminjamanAlatItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class LabPeminjamanController extends Controller
{
    private function jumlahTersedia(Inventaris $alat): int
    {
        $dipinjam = (int) PeminjamanAlatItem::where('inventaris_id', $alat->id)
            ->whereHas('peminjaman', fn ($q) => $q->whereIn('status', ['disetujui', 'dipinjam']))
            ->sum('jumlah');

        return max(0, $alat->jumlah - $dipinjam);
    }

    public function cariAlat(Request $request): JsonResponse
    {
        $in = $request->validate(['barcode' => ['required', 'string']]);
        $alat = Inventaris::whereNotNull('laboratorium_id')->where('barcode', $in['barcode'])->first();
        abort_if(! $alat, 404, 'Alat tidak ditemukan.');

        return response()->json([...$alat->toArray(), 'jumlah_tersedia' => $this->jumlahTersedia($alat)]);
    }

    private function statusEfektif(PeminjamanAlat $p): string
    {
        if ($p->status === 'dipinjam' && Carbon::parse($p->tanggal_kembali_rencana)->isPast()) {
            return 'terlambat';
        }

        return $p->status;
    }

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'status' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $peminjaman = PeminjamanAlat::with(['peminjam:id,name', 'petugas:id,name', 'item.inventaris:id,nama_barang,kode_barang'])
            ->when(! empty($in['search']), fn ($q) => $q->where('nomor_transaksi', 'like', "%{$in['search']}%"))
            ->orderByDesc('id')
            ->paginate($in['per_page'] ?? 15);

        $peminjaman->getCollection()->transform(function (PeminjamanAlat $p) {
            $p->status_efektif = $this->statusEfektif($p);

            return $p;
        });

        if (! empty($in['status'])) {
            $filtered = $peminjaman->getCollection()->filter(fn (PeminjamanAlat $p) => $p->status_efektif === $in['status'])->values();
            $peminjaman->setCollection($filtered);
        }

        return response()->json($peminjaman);
    }

    private function nomorTransaksi(): string
    {
        $prefix = 'PJA/'.now()->format('Ym').'/';
        $urut = PeminjamanAlat::where('nomor_transaksi', 'like', "{$prefix}%")->count() + 1;
        do {
            $nomor = $prefix.str_pad((string) $urut++, 4, '0', STR_PAD_LEFT);
        } while (PeminjamanAlat::where('nomor_transaksi', $nomor)->exists());

        return $nomor;
    }

    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'jabatan_kelas' => ['nullable', 'string', 'max:255'],
            'tujuan_penggunaan' => ['nullable', 'string'],
            'tanggal_pinjam' => ['required', 'date'],
            'tanggal_kembali_rencana' => ['required', 'date', 'after_or_equal:tanggal_pinjam'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inventaris_id' => ['required', 'integer', 'exists:inventaris,id'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
        ]);

        foreach ($in['items'] as $item) {
            $alat = Inventaris::findOrFail($item['inventaris_id']);
            abort_if($item['jumlah'] > $this->jumlahTersedia($alat), 422, "Jumlah \"{$alat->nama_barang}\" melebihi stok tersedia.");
        }

        $peminjaman = DB::transaction(function () use ($in, $request) {
            $peminjaman = PeminjamanAlat::create([
                'nomor_transaksi' => $this->nomorTransaksi(),
                'peminjam_user_id' => $request->user()->id,
                'jabatan_kelas' => $in['jabatan_kelas'] ?? null,
                'tujuan_penggunaan' => $in['tujuan_penggunaan'] ?? null,
                'tanggal_pinjam' => $in['tanggal_pinjam'],
                'tanggal_kembali_rencana' => $in['tanggal_kembali_rencana'],
                'status' => 'diajukan',
            ]);

            foreach ($in['items'] as $item) {
                $peminjaman->item()->create(['inventaris_id' => $item['inventaris_id'], 'jumlah' => $item['jumlah']]);
            }

            return $peminjaman;
        });

        return response()->json($peminjaman->load('item.inventaris'), 201);
    }

    public function show(PeminjamanAlat $peminjamanAlat): JsonResponse
    {
        $peminjamanAlat->load(['peminjam:id,name', 'petugas:id,name', 'disetujuiOleh:id,name', 'item.inventaris']);
        $peminjamanAlat->status_efektif = $this->statusEfektif($peminjamanAlat);

        return response()->json($peminjamanAlat);
    }

    public function setujui(Request $request, PeminjamanAlat $peminjamanAlat): JsonResponse
    {
        abort_if($peminjamanAlat->status !== 'diajukan', 422, 'Hanya pengajuan yang dapat disetujui.');
        $peminjamanAlat->update(['status' => 'disetujui', 'disetujui_oleh' => $request->user()->id, 'disetujui_at' => now()]);

        return response()->json($peminjamanAlat);
    }

    public function tolak(Request $request, PeminjamanAlat $peminjamanAlat): JsonResponse
    {
        abort_if($peminjamanAlat->status !== 'diajukan', 422, 'Hanya pengajuan yang dapat ditolak.');
        $in = $request->validate(['catatan' => ['nullable', 'string']]);
        $peminjamanAlat->update(['status' => 'ditolak', 'disetujui_oleh' => $request->user()->id, 'disetujui_at' => now(), 'catatan_kerusakan' => $in['catatan'] ?? null]);

        return response()->json($peminjamanAlat);
    }

    public function ambil(Request $request, PeminjamanAlat $peminjamanAlat): JsonResponse
    {
        abort_if($peminjamanAlat->status !== 'disetujui', 422, 'Hanya peminjaman yang sudah disetujui dapat diserahkan.');

        DB::transaction(function () use ($peminjamanAlat, $request) {
            foreach ($peminjamanAlat->item as $item) {
                $item->update(['kondisi_sebelum' => $item->inventaris->kondisi_lab ?: $item->inventaris->kondisi]);
            }
            $peminjamanAlat->update(['status' => 'dipinjam', 'petugas_id' => $request->user()->id]);
        });

        return response()->json($peminjamanAlat->load('item.inventaris'));
    }

    public function kembalikan(Request $request, PeminjamanAlat $peminjamanAlat): JsonResponse
    {
        abort_if(! in_array($peminjamanAlat->status, ['dipinjam'], true), 422, 'Hanya alat yang sedang dipinjam dapat dikembalikan.');

        $in = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.peminjaman_alat_item_id' => ['required', 'integer', 'exists:peminjaman_alat_item,id'],
            'items.*.kondisi_setelah' => ['required', 'in:baik,rusak_ringan,rusak_berat,dalam_perbaikan,hilang,tidak_layak'],
            'catatan_kerusakan' => ['nullable', 'string'],
        ]);

        $adaMasalah = false;
        DB::transaction(function () use ($in, $peminjamanAlat, &$adaMasalah, $request) {
            foreach ($in['items'] as $baris) {
                $item = PeminjamanAlatItem::with('inventaris')->findOrFail($baris['peminjaman_alat_item_id']);
                $item->update(['kondisi_setelah' => $baris['kondisi_setelah']]);
                if ($baris['kondisi_setelah'] !== 'baik') {
                    $adaMasalah = true;
                    $item->inventaris->update(['kondisi_lab' => $baris['kondisi_setelah'], 'kondisi' => match ($baris['kondisi_setelah']) {
                        'rusak_ringan', 'dalam_perbaikan' => 'rusak_ringan',
                        default => 'rusak_berat',
                    }]);
                }
            }

            $peminjamanAlat->update([
                'status' => $adaMasalah ? (collect($in['items'])->contains(fn ($b) => $b['kondisi_setelah'] === 'hilang') ? 'hilang' : 'rusak') : 'dikembalikan',
                'tanggal_kembali_aktual' => now()->toDateString(),
                'catatan_kerusakan' => $in['catatan_kerusakan'] ?? null,
                'petugas_id' => $request->user()->id,
            ]);
        });

        return response()->json($peminjamanAlat->load('item.inventaris'));
    }

    public function perpanjang(Request $request, PeminjamanAlat $peminjamanAlat): JsonResponse
    {
        abort_if(! in_array($peminjamanAlat->status, ['dipinjam'], true), 422, 'Hanya peminjaman aktif yang dapat diperpanjang.');
        $in = $request->validate(['tanggal_kembali_rencana' => ['required', 'date', 'after:'.$peminjamanAlat->tanggal_kembali_rencana->toDateString()]]);
        $peminjamanAlat->update(['tanggal_kembali_rencana' => $in['tanggal_kembali_rencana']]);

        return response()->json($peminjamanAlat);
    }
}

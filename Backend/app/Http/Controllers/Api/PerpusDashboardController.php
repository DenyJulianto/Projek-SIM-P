<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggotaPerpustakaan;
use App\Models\Buku;
use App\Models\EksemplarBuku;
use App\Models\PeminjamanBuku;
use App\Models\PeminjamanItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class PerpusDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();

        $kartu = [
            'total_koleksi' => EksemplarBuku::count(),
            'total_judul_buku' => Buku::count(),
            'total_eksemplar' => EksemplarBuku::count(),
            'total_anggota' => AnggotaPerpustakaan::where('status', 'aktif')->count(),
            'buku_dipinjam' => PeminjamanItem::where('status', 'dipinjam')->count(),
            'buku_terlambat' => PeminjamanItem::where('status', 'dipinjam')
                ->whereHas('peminjaman', fn ($q) => $q->where('tanggal_jatuh_tempo', '<', $today))
                ->count(),
            'buku_rusak_hilang' => EksemplarBuku::whereIn('status', ['rusak', 'hilang'])->count(),
            'peminjaman_hari_ini' => PeminjamanBuku::whereDate('tanggal_pinjam', $today)->count(),
            'pengembalian_hari_ini' => PeminjamanItem::whereDate('tanggal_kembali_aktual', $today)->count(),
        ];

        $bulanAwal = $today->copy()->startOfMonth()->subMonths(5);

        $peminjaman = PeminjamanBuku::where('tanggal_pinjam', '>=', $bulanAwal)->get(['tanggal_pinjam']);
        $pengembalian = PeminjamanItem::whereNotNull('tanggal_kembali_aktual')
            ->where('tanggal_kembali_aktual', '>=', $bulanAwal)->get(['tanggal_kembali_aktual']);

        $peminjamanPerBulan = [];
        $pengembalianPerBulan = [];
        for ($b = $bulanAwal->copy(); $b->lte($today); $b->addMonth()) {
            $label = $b->locale('id')->translatedFormat('M Y');
            $peminjamanPerBulan[] = [
                'bulan' => $label,
                'jumlah' => $peminjaman->filter(fn ($p) => Carbon::parse($p->tanggal_pinjam)->isSameMonth($b))->count(),
            ];
            $pengembalianPerBulan[] = [
                'bulan' => $label,
                'jumlah' => $pengembalian->filter(fn ($p) => Carbon::parse($p->tanggal_kembali_aktual)->isSameMonth($b))->count(),
            ];
        }

        $bukuTerpopuler = PeminjamanItem::query()
            ->join('eksemplar_buku', 'eksemplar_buku.id', '=', 'peminjaman_item.eksemplar_id')
            ->join('buku', 'buku.id', '=', 'eksemplar_buku.buku_id')
            ->selectRaw('buku.id, buku.judul, count(*) as total')
            ->groupBy('buku.id', 'buku.judul')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $perKelas = PeminjamanBuku::query()
            ->join('anggota_perpustakaan', 'anggota_perpustakaan.id', '=', 'peminjaman_buku.anggota_id')
            ->join('siswa', 'siswa.id', '=', 'anggota_perpustakaan.siswa_id')
            ->leftJoin('kelas', 'kelas.id', '=', 'siswa.kelas_id')
            ->where('anggota_perpustakaan.jenis_anggota', 'siswa')
            ->selectRaw("coalesce(kelas.nama_kelas, 'Tanpa kelas') as kelas, count(*) as total")
            ->groupBy('kelas')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $aktivitas = collect()
            ->merge(PeminjamanBuku::with('anggota')->latest('created_at')->limit(5)->get()->map(fn (PeminjamanBuku $p) => [
                'waktu' => $p->created_at,
                'pesan' => "Peminjaman {$p->nomor_transaksi} oleh {$p->anggota?->nama}",
            ]))
            ->merge(PeminjamanItem::with('peminjaman.anggota')->whereNotNull('tanggal_kembali_aktual')->latest('updated_at')->limit(5)->get()->map(fn (PeminjamanItem $i) => [
                'waktu' => $i->updated_at,
                'pesan' => "Pengembalian buku oleh {$i->peminjaman?->anggota?->nama}",
            ]))
            ->sortByDesc('waktu')
            ->values()
            ->take(10);

        return response()->json([
            'kartu' => $kartu,
            'grafik' => [
                'peminjaman_per_bulan' => $peminjamanPerBulan,
                'pengembalian_per_bulan' => $pengembalianPerBulan,
                'buku_terpopuler' => $bukuTerpopuler,
                'peminjaman_per_kelas' => $perKelas,
            ],
            'aktivitas' => $aktivitas,
        ]);
    }
}

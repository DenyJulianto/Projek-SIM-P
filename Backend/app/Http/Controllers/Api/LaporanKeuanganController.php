<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnggaranPos;
use App\Models\Pembayaran;
use App\Models\RealisasiAnggaran;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaporanKeuanganController extends Controller
{
    public function penerimaan(Request $request): JsonResponse
    {
        $query = Pembayaran::query()
            ->with(['tagihan.siswa:id,nama,nis,nisn,kelas_id', 'tagihan.siswa.kelas:id,nama_kelas', 'konfirmasi:id,pembayaran_id,bukti_path,status,tanggal_verifikasi'])
            ->when($request->filled('dari_tanggal'), fn ($q) => $q->where('tanggal_bayar', '>=', $request->string('dari_tanggal')))
            ->when($request->filled('sampai_tanggal'), fn ($q) => $q->where('tanggal_bayar', '<=', $request->string('sampai_tanggal')));

        $data = (clone $query)->orderByDesc('tanggal_bayar')->get();

        return response()->json([
            'total' => (float) $data->sum('jumlah'),
            'jumlah_transaksi' => $data->count(),
            'data' => $data,
        ]);
    }

    public function pengeluaran(Request $request): JsonResponse
    {
        $query = RealisasiAnggaran::query()
            ->with('pengajuanAnggaran:id,judul,anggaran_pos_id')
            ->when($request->filled('dari_tanggal'), fn ($q) => $q->where('tanggal', '>=', $request->string('dari_tanggal')))
            ->when($request->filled('sampai_tanggal'), fn ($q) => $q->where('tanggal', '<=', $request->string('sampai_tanggal')));

        $data = (clone $query)->orderByDesc('tanggal')->get();

        return response()->json([
            'total' => (float) $data->sum('jumlah'),
            'jumlah_transaksi' => $data->count(),
            'data' => $data,
        ]);
    }

    public function tunggakan(Request $request): JsonResponse
    {
        $data = Tagihan::query()
            ->where('status', 'belum_lunas')
            ->with('siswa:id,nama,nisn,kelas_id')
            ->orderBy('jatuh_tempo')
            ->get();

        return response()->json([
            'total' => (float) $data->sum('jumlah'),
            'jumlah_siswa' => $data->pluck('siswa_id')->unique()->count(),
            'data' => $data,
        ]);
    }

    public function anggaran(Request $request): JsonResponse
    {
        $pos = AnggaranPos::with('pengajuan.realisasi')
            ->when($request->filled('tahun_ajaran'), fn ($q) => $q->where('tahun_ajaran', $request->string('tahun_ajaran')))
            ->get()
            ->map(function (AnggaranPos $p) {
                $realisasi = $p->pengajuan->flatMap->realisasi->sum('jumlah');

                return [
                    'id' => $p->id,
                    'tahun_ajaran' => $p->tahun_ajaran,
                    'bidang' => $p->bidang,
                    'uraian' => $p->uraian,
                    'jumlah_anggaran' => (float) $p->jumlah_anggaran,
                    'jumlah_realisasi' => (float) $realisasi,
                    'sisa' => (float) $p->jumlah_anggaran - (float) $realisasi,
                ];
            });

        return response()->json([
            'total_anggaran' => $pos->sum('jumlah_anggaran'),
            'total_realisasi' => $pos->sum('jumlah_realisasi'),
            'data' => $pos->values(),
        ]);
    }

    /**
     * Total penerimaan per hari untuk 30 hari terakhir — dipakai untuk
     * grafik tren penerimaan harian. Hari tanpa transaksi tetap muncul
     * dengan nilai 0 supaya sumbu waktu grafik tidak bolong.
     */
    public function penerimaanHarian(): JsonResponse
    {
        $mulai = now()->subDays(29)->startOfDay();

        $rows = Pembayaran::query()
            ->where('tanggal_bayar', '>=', $mulai->toDateString())
            ->selectRaw("date(tanggal_bayar) as tanggal, sum(jumlah) as total")
            ->groupBy(\Illuminate\Support\Facades\DB::raw('date(tanggal_bayar)'))
            ->pluck('total', 'tanggal');

        $hasil = collect(range(0, 29))->map(function ($i) use ($mulai, $rows) {
            $tanggal = (clone $mulai)->addDays($i)->toDateString();

            return [
                'tanggal' => $tanggal,
                'total' => (float) ($rows[$tanggal] ?? 0),
            ];
        });

        return response()->json($hasil);
    }

    /**
     * Total penerimaan dikelompokkan per judul tagihan (mis. "SPP
     * Oktober 2026", "Uang Buku") sebagai pemetaan "kategori" penerimaan.
     */
    public function penerimaanPerJenis(): JsonResponse
    {
        $rows = Pembayaran::query()
            ->join('tagihan', 'tagihan.id', '=', 'pembayaran.tagihan_id')
            ->selectRaw('tagihan.judul as judul, sum(pembayaran.jumlah) as total')
            ->groupBy('tagihan.judul')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        return response()->json($rows);
    }

    public function ringkasan(Request $request): JsonResponse
    {
        $penerimaan = json_decode($this->penerimaan($request)->getContent(), true);
        $pengeluaran = json_decode($this->pengeluaran($request)->getContent(), true);
        $tunggakan = json_decode($this->tunggakan($request)->getContent(), true);
        $anggaran = json_decode($this->anggaran($request)->getContent(), true);

        return response()->json([
            'total_penerimaan' => $penerimaan['total'],
            'total_pengeluaran' => $pengeluaran['total'],
            'saldo_kas' => $penerimaan['total'] - $pengeluaran['total'],
            'total_tunggakan' => $tunggakan['total'],
            'jumlah_siswa_menunggak' => $tunggakan['jumlah_siswa'],
            'jumlah_siswa_bertagihan' => Tagihan::aktif()->distinct()->count('siswa_id'),
            'total_anggaran' => $anggaran['total_anggaran'],
            'total_realisasi_anggaran' => $anggaran['total_realisasi'],
            'penerimaan_terbaru' => array_slice($penerimaan['data'], 0, 10),
            'pengeluaran_terbaru' => array_slice($pengeluaran['data'], 0, 10),
        ]);
    }
}

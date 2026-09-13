<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\Inventaris;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Pelanggaran;
use App\Models\PengajuanAnggaran;
use App\Models\Prestasi;
use App\Models\RealisasiAnggaran;
use App\Models\Siswa;
use App\Models\Tagihan;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Endpoint read-only khusus untuk Kepala Sekolah (dan role lain berizin
 * dashboard.view-all): rekap/agregat, bukan CRUD. Semua angka dihitung
 * langsung dari data asli — tidak ada yang dikarang.
 */
class PrincipalController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'total_siswa' => Siswa::where('status', 'aktif')->count(),
            'total_guru' => Guru::where('status', 'aktif')->count(),
            'total_kelas' => Kelas::count(),
            'kehadiran_siswa_persen' => $this->kehadiranPersen(Absensi::query(), 'bulan ini'),
            'rata_rata_nilai' => round((float) Nilai::avg('nilai'), 2),
            'prestasi_bulan_ini' => Prestasi::whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)->count(),
            'prestasi_total' => Prestasi::count(),
            'kasus_pembinaan_bulan_ini' => Pelanggaran::whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)->count(),
            'kasus_pembinaan_total' => Pelanggaran::count(),
            'anggaran' => $this->serapanAnggaran(),
            'spp' => $this->persentaseSpp(),
            'grafik_akademik' => $this->trendNilai(),
        ]);
    }

    public function keuangan(): JsonResponse
    {
        $total = Tagihan::count();
        $lunas = Tagihan::where('status', 'lunas')->count();
        $totalTagihan = (float) Tagihan::sum('jumlah');
        $totalTerbayar = (float) DB::table('pembayaran')->sum('jumlah');

        return response()->json([
            'total_tagihan' => $total,
            'lunas' => $lunas,
            'belum_lunas' => $total - $lunas,
            'persen_lunas' => $total > 0 ? round(($lunas / $total) * 100, 1) : 0,
            'total_nilai_tagihan' => $totalTagihan,
            'total_terbayar' => $totalTerbayar,
            'tunggakan' => $totalTagihan - $totalTerbayar,
            'mingguan' => $this->penerimaanMingguan(),
            'tunggakan_list' => Tagihan::where('status', 'belum_lunas')
                ->with('siswa:id,nama,kelas_id')
                ->orderBy('jatuh_tempo')
                ->limit(8)
                ->get(),
        ]);
    }

    /**
     * Total penerimaan (pembayaran) per hari-dalam-minggu, minggu berjalan
     * vs minggu sebelumnya — dipakai untuk grafik "Keuangan Sekolah" di
     * dashboard. Dihitung langsung dari tabel pembayaran, bukan data karangan.
     */
    private function penerimaanMingguan(): array
    {
        $awalMingguIni = now()->startOfWeek();
        $awalMingguLalu = (clone $awalMingguIni)->subWeek();

        $ambilPerHari = function ($mulai, $selesai) {
            $rows = DB::table('pembayaran')
                ->whereBetween('tanggal_bayar', [$mulai->toDateString(), $selesai->toDateString()])
                ->select(DB::raw("strftime('%w', tanggal_bayar) as hari"), DB::raw('sum(jumlah) as total'))
                ->groupBy('hari')
                ->pluck('total', 'hari');

            return collect(range(0, 6))->map(fn ($i) => (float) ($rows[(string) $i] ?? 0))->values();
        };

        return [
            'minggu_ini' => $ambilPerHari($awalMingguIni, (clone $awalMingguIni)->endOfWeek()),
            'minggu_lalu' => $ambilPerHari($awalMingguLalu, (clone $awalMingguLalu)->endOfWeek()),
        ];
    }

    public function akademik(): JsonResponse
    {
        $perKelas = Kelas::query()
            ->withCount('siswa')
            ->get()
            ->map(function (Kelas $kelas) {
                $rata = Nilai::whereHas('siswa', fn ($q) => $q->where('kelas_id', $kelas->id))->avg('nilai');

                return [
                    'kelas' => $kelas->nama_kelas,
                    'jumlah_siswa' => $kelas->siswa_count,
                    'rata_rata_nilai' => $rata ? round((float) $rata, 2) : null,
                ];
            });

        // KKM per mata pelajaran belum dikonfigurasi di sistem (lihat menu
        // KKM/KKTP di Kurikulum), jadi persentase tuntas di sini dihitung
        // memakai ambang standar 75 sebagai patokan sementara — bukan KKM
        // resmi yang ditetapkan sekolah.
        $kkmStandar = 75;

        $perMapel = MataPelajaran::query()
            ->get()
            ->map(function (MataPelajaran $mapel) use ($kkmStandar) {
                $nilaiMapel = Nilai::where('mata_pelajaran_id', $mapel->id);
                $rata = (clone $nilaiMapel)->avg('nilai');
                $jumlah = (clone $nilaiMapel)->count();
                $tuntas = (clone $nilaiMapel)->where('nilai', '>=', $kkmStandar)->count();

                return [
                    'mata_pelajaran' => $mapel->nama_mapel,
                    'rata_rata_nilai' => $rata ? round((float) $rata, 2) : null,
                    'jumlah_nilai' => $jumlah,
                    'tuntas_persen' => $jumlah > 0 ? round(($tuntas / $jumlah) * 100, 1) : null,
                ];
            });

        return response()->json([
            'rata_rata_sekolah' => round((float) Nilai::avg('nilai'), 2),
            'total_nilai_terinput' => Nilai::count(),
            'per_kelas' => $perKelas,
            'per_mata_pelajaran' => $perMapel,
            'trend' => $this->trendNilai(),
        ]);
    }

    public function kesiswaan(): JsonResponse
    {
        $perKelas = Kelas::query()
            ->withCount('siswa')
            ->get()
            ->map(fn (Kelas $k) => ['kelas' => $k->nama_kelas, 'jumlah_siswa' => $k->siswa_count]);

        return response()->json([
            'total_siswa' => Siswa::where('status', 'aktif')->count(),
            'per_kelas' => $perKelas,
            'prestasi_terbaru' => Prestasi::with('siswa:id,nama,kelas_id')->orderByDesc('tanggal')->limit(8)->get(),
            'pelanggaran_terbaru' => Pelanggaran::with('siswa:id,nama,kelas_id')->orderByDesc('tanggal')->limit(8)->get(),
            'prestasi_total' => Prestasi::count(),
            'pelanggaran_total' => Pelanggaran::count(),
        ]);
    }

    public function kehadiran(): JsonResponse
    {
        return response()->json([
            'siswa' => [
                'persen_hadir' => $this->kehadiranPersen(Absensi::query(), 'bulan ini'),
                'rekap' => $this->rekapStatus(Absensi::query()),
            ],
            'guru' => [
                'persen_hadir' => $this->kehadiranPersen(AbsensiGuru::query(), 'bulan ini'),
                'rekap' => $this->rekapStatus(AbsensiGuru::query()),
            ],
        ]);
    }

    public function kepegawaian(): JsonResponse
    {
        return response()->json([
            'total' => Guru::count(),
            'aktif' => Guru::where('status', 'aktif')->count(),
            'nonaktif' => Guru::where('status', 'nonaktif')->count(),
            'daftar' => Guru::orderBy('nama')->get(['id', 'nama', 'nip', 'jabatan', 'status']),
        ]);
    }

    public function sarpras(): JsonResponse
    {
        return response()->json([
            'total_item' => Inventaris::sum('jumlah'),
            'total_jenis' => Inventaris::count(),
            'per_kondisi' => Inventaris::select('kondisi', DB::raw('sum(jumlah) as total'))
                ->groupBy('kondisi')
                ->pluck('total', 'kondisi'),
            'per_kategori' => Inventaris::select('kategori', DB::raw('sum(jumlah) as total'))
                ->groupBy('kategori')
                ->pluck('total', 'kategori'),
        ]);
    }

    private function kehadiranPersen($query, string $periode): float
    {
        $total = (clone $query)->whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)->count();

        if ($total === 0) {
            return 0;
        }

        $hadir = (clone $query)
            ->whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)
            ->where('status', 'hadir')
            ->count();

        return round(($hadir / $total) * 100, 1);
    }

    private function rekapStatus($query): array
    {
        return (clone $query)
            ->whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
    }

    private function serapanAnggaran(): array
    {
        $totalAnggaran = (float) DB::table('anggaran_pos')->sum('jumlah_anggaran');
        $totalRealisasi = (float) RealisasiAnggaran::sum('jumlah');
        $totalDiajukan = PengajuanAnggaran::count();

        if ($totalAnggaran === 0.0 && $totalDiajukan === 0) {
            return ['tersedia' => false, 'catatan' => 'Belum ada data RKAS/anggaran yang dicatat.'];
        }

        return [
            'tersedia' => true,
            'total_anggaran' => $totalAnggaran,
            'total_realisasi' => $totalRealisasi,
            'persen_serapan' => $totalAnggaran > 0 ? round(($totalRealisasi / $totalAnggaran) * 100, 1) : 0,
        ];
    }

    private function persentaseSpp(): array
    {
        $total = Tagihan::count();

        if ($total === 0) {
            return ['tersedia' => false, 'catatan' => 'Belum ada data tagihan/SPP yang dicatat.'];
        }

        $lunas = Tagihan::where('status', 'lunas')->count();

        return [
            'tersedia' => true,
            'persen_lunas' => round(($lunas / $total) * 100, 1),
        ];
    }

    private function trendNilai()
    {
        return Nilai::select('tahun_ajaran', 'semester', DB::raw('avg(nilai) as rata_rata'))
            ->groupBy('tahun_ajaran', 'semester')
            ->orderBy('tahun_ajaran')
            ->orderBy('semester')
            ->get()
            ->map(fn ($row) => [
                'periode' => "{$row->semester} {$row->tahun_ajaran}",
                'rata_rata' => round((float) $row->rata_rata, 2),
            ]);
    }
}

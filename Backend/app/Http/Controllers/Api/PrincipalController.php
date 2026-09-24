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
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\TahunAjaran;
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
        $awalBulan = now()->startOfMonth();
        $totalSiswa = Siswa::where('status', 'aktif')->count();
        $totalGuru = Guru::where('status', 'aktif')->count();
        $siswaAwalBulan = Siswa::where('status', 'aktif')->where('created_at', '<', $awalBulan)->count();
        $guruAwalBulan = Guru::where('status', 'aktif')->where('created_at', '<', $awalBulan)->count();

        $kehadiranBulanIni = $this->kehadiranPersenBulan(Absensi::query(), now());
        $kehadiranBulanLalu = $this->kehadiranPersenBulan(Absensi::query(), now()->subMonthNoOverflow());

        $trendNilai = $this->trendNilai();
        $nilaiTrend = null;
        if (count($trendNilai) >= 2) {
            $nilaiTrend = round($trendNilai->last()['rata_rata'] - $trendNilai->slice(-2, 1)->first()['rata_rata'], 2);
        }

        return response()->json([
            'total_siswa' => $totalSiswa,
            'total_siswa_trend' => $totalSiswa - $siswaAwalBulan,
            'total_guru' => $totalGuru,
            'total_guru_trend' => $totalGuru - $guruAwalBulan,
            'total_kelas' => Kelas::count(),
            'kehadiran_siswa_persen' => $kehadiranBulanIni,
            'kehadiran_siswa_trend' => round($kehadiranBulanIni - $kehadiranBulanLalu, 1),
            'rata_rata_nilai' => round((float) Nilai::avg('nilai'), 2),
            'rata_rata_nilai_trend' => $nilaiTrend,
            'prestasi_bulan_ini' => Prestasi::whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)->count(),
            'prestasi_total' => Prestasi::count(),
            'kasus_pembinaan_bulan_ini' => Pelanggaran::whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)->count(),
            'kasus_pembinaan_total' => Pelanggaran::count(),
            'anggaran' => $this->serapanAnggaran(),
            'spp' => $this->persentaseSpp(),
            'grafik_akademik' => $trendNilai,
            'tahun_ajaran_aktif' => TahunAjaran::where('is_active', true)->value('nama'),
            'semester_aktif' => Semester::where('is_active', true)->value('nama'),
        ]);
    }

    public function keuangan(): JsonResponse
    {
        $total = Tagihan::aktif()->count();
        $lunas = Tagihan::where('status', 'lunas')->count();
        $totalTagihan = (float) Tagihan::aktif()->sum('jumlah');
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
        $perKelas = $this->perKelasAkademik();

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

    /**
     * Ringkasan & rekomendasi berbasis aturan (ambang batas atas data asli),
     * BUKAN AI/prediksi — dashboard menyebutnya "Ringkasan & Rekomendasi",
     * bukan "AI Insights", supaya tidak mengklaim kapabilitas yang tidak
     * benar-benar ada di sistem ini.
     */
    public function insights(): JsonResponse
    {
        return response()->json([
            'ringkasan' => $this->ringkasanRekomendasi(),
            'siswa_berprestasi' => $this->siswaBerprestasiList(),
            'siswa_perlu_perhatian' => $this->siswaPerluPerhatianList(),
            'performa_guru' => $this->performaGuruList(),
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
        $total = Tagihan::aktif()->count();

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

    private function perKelasAkademik()
    {
        return Kelas::query()
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
    }

    private function kehadiranPersenBulan($query, \Illuminate\Support\Carbon $bulan): float
    {
        $total = (clone $query)->whereMonth('tanggal', $bulan->month)->whereYear('tanggal', $bulan->year)->count();

        if ($total === 0) {
            return 0;
        }

        $hadir = (clone $query)
            ->whereMonth('tanggal', $bulan->month)
            ->whereYear('tanggal', $bulan->year)
            ->where('status', 'hadir')
            ->count();

        return round(($hadir / $total) * 100, 1);
    }

    /**
     * Ambang batas sederhana (bukan KKM resmi/model prediktif) dipakai
     * konsisten untuk menandai siswa/kelas "perlu perhatian" di seluruh
     * dashboard Kepala Sekolah.
     */
    private const AMBANG_KEHADIRAN = 80.0;

    private const AMBANG_NILAI = 70.0;

    private function siswaBerprestasiList(): array
    {
        return Siswa::where('status', 'aktif')
            ->whereHas('nilai')
            ->withAvg('nilai as rata_nilai', 'nilai')
            ->with('kelas:id,nama_kelas')
            ->orderByDesc('rata_nilai')
            ->limit(5)
            ->get(['id', 'nama', 'kelas_id'])
            ->map(fn (Siswa $s) => [
                'nama' => $s->nama,
                'kelas' => $s->kelas?->nama_kelas,
                'rata_nilai' => round((float) $s->rata_nilai, 2),
            ])
            ->all();
    }

    private function siswaPerluPerhatianList(): array
    {
        $bulanIni = now();

        $kehadiranBermasalah = Siswa::where('status', 'aktif')
            ->whereHas('absensi', fn ($q) => $q->whereMonth('tanggal', $bulanIni->month)->whereYear('tanggal', $bulanIni->year))
            ->with('kelas:id,nama_kelas')
            ->get(['id', 'nama', 'kelas_id'])
            ->map(function (Siswa $s) use ($bulanIni) {
                $total = $s->absensi()->whereMonth('tanggal', $bulanIni->month)->whereYear('tanggal', $bulanIni->year)->count();
                $hadir = $s->absensi()->whereMonth('tanggal', $bulanIni->month)->whereYear('tanggal', $bulanIni->year)->where('status', 'hadir')->count();
                $persen = $total > 0 ? round(($hadir / $total) * 100, 1) : null;

                if ($persen === null || $persen >= self::AMBANG_KEHADIRAN) {
                    return null;
                }

                return [
                    'siswa' => $s,
                    'alasan' => "Kehadiran {$persen}% bulan ini",
                    'skor' => $persen,
                ];
            })
            ->filter()
            ->values();

        $nilaiBermasalah = Siswa::where('status', 'aktif')
            ->whereHas('nilai')
            ->withAvg('nilai as rata_nilai', 'nilai')
            ->with('kelas:id,nama_kelas')
            ->get(['id', 'nama', 'kelas_id'])
            ->filter(fn (Siswa $s) => $s->rata_nilai !== null && (float) $s->rata_nilai < self::AMBANG_NILAI)
            ->map(fn (Siswa $s) => [
                'siswa' => $s,
                'alasan' => 'Rata-rata nilai ' . round((float) $s->rata_nilai, 1),
                'skor' => (float) $s->rata_nilai,
            ])
            ->values();

        return $kehadiranBermasalah->concat($nilaiBermasalah)
            ->unique(fn ($item) => $item['siswa']->id)
            ->sortBy('skor')
            ->take(5)
            ->values()
            ->map(fn ($item) => [
                'nama' => $item['siswa']->nama,
                'kelas' => $item['siswa']->kelas?->nama_kelas,
                'alasan' => $item['alasan'],
            ])
            ->all();
    }

    private function performaGuruList(): array
    {
        $bulanIni = now();

        return Guru::where('status', 'aktif')
            ->orderBy('nama')
            ->get(['id', 'nama'])
            ->map(function (Guru $g) use ($bulanIni) {
                $totalAbsen = AbsensiGuru::where('guru_id', $g->id)
                    ->whereMonth('tanggal', $bulanIni->month)->whereYear('tanggal', $bulanIni->year)->count();
                $hadirAbsen = AbsensiGuru::where('guru_id', $g->id)
                    ->whereMonth('tanggal', $bulanIni->month)->whereYear('tanggal', $bulanIni->year)
                    ->where('status', 'hadir')->count();

                $kelasIds = Kelas::where('wali_kelas_id', $g->id)->pluck('id');
                $rataNilai = $kelasIds->isNotEmpty()
                    ? Nilai::whereHas('siswa', fn ($q) => $q->whereIn('kelas_id', $kelasIds))->avg('nilai')
                    : null;

                return [
                    'nama' => $g->nama,
                    'jumlah_kelas_diampu' => $kelasIds->count(),
                    'persen_kehadiran' => $totalAbsen > 0 ? round(($hadirAbsen / $totalAbsen) * 100, 1) : null,
                    'rata_rata_nilai_kelas' => $rataNilai ? round((float) $rataNilai, 2) : null,
                ];
            })
            ->take(8)
            ->values()
            ->all();
    }

    private function ringkasanRekomendasi(): array
    {
        $items = [];

        $kehadiranBulanIni = $this->kehadiranPersenBulan(Absensi::query(), now());
        $kehadiranBulanLalu = $this->kehadiranPersenBulan(Absensi::query(), now()->subMonthNoOverflow());

        if ($kehadiranBulanIni > 0 || $kehadiranBulanLalu > 0) {
            $selisih = round($kehadiranBulanIni - $kehadiranBulanLalu, 1);
            $items[] = [
                'tipe' => $selisih >= 0 ? 'positif' : 'perhatian',
                'judul' => $selisih >= 0 ? 'Kehadiran siswa meningkat' : 'Kehadiran siswa menurun',
                'deskripsi' => 'Kehadiran siswa ' . ($selisih >= 0 ? 'naik' : 'turun') . ' ' . abs($selisih) . '% dibanding bulan lalu.',
            ];
        }

        $siswaPerlu = $this->siswaPerluPerhatianList();
        if (count($siswaPerlu) > 0) {
            $items[] = [
                'tipe' => 'perhatian',
                'judul' => count($siswaPerlu) . ' siswa perlu perhatian',
                'deskripsi' => 'Kehadiran atau nilai berada di bawah ambang batas bulan ini.',
            ];
        }

        $kelasBermasalah = $this->perKelasAkademik()
            ->filter(fn ($k) => $k['rata_rata_nilai'] !== null && $k['rata_rata_nilai'] < self::AMBANG_NILAI);

        if ($kelasBermasalah->count() > 0) {
            $items[] = [
                'tipe' => 'perhatian',
                'judul' => $kelasBermasalah->count() . ' kelas di bawah rata-rata',
                'deskripsi' => $kelasBermasalah->pluck('kelas')->implode(', ') . ' perlu perhatian tambahan.',
            ];
        }

        if (empty($items)) {
            $items[] = [
                'tipe' => 'info',
                'judul' => 'Belum cukup data',
                'deskripsi' => 'Ringkasan akan muncul otomatis setelah data kehadiran dan nilai mulai tercatat.',
            ];
        }

        return $items;
    }
}

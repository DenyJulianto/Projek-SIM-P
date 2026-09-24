<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\JamBelajar;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\PengajuanAnggaran;
use App\Models\PengajuanKepegawaian;
use App\Models\Pelanggaran;
use App\Models\Prestasi;
use App\Models\Rapor;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/**
 * Endpoint read-only untuk dashboard Wakil Kepala Sekolah: rekap/agregat dari
 * data akademik, kesiswaan, guru, kehadiran, jadwal, dan pengajuan. Semua angka
 * dihitung dari data asli. Tidak ada operasi tulis di sini.
 */
class WakasekController extends Controller
{
    private const STATUS_HADIR = ['hadir', 'izin', 'sakit', 'alpha'];

    public function dashboard(): JsonResponse
    {
        $bulan = now();

        return response()->json([
            'siswa_aktif' => Siswa::where('status', 'aktif')->count(),
            'guru_aktif' => Guru::where('status', 'aktif')->count(),
            'total_kelas' => Kelas::count(),
            'total_jadwal' => JadwalPelajaran::count(),
            'kehadiran_siswa_persen' => $this->persenHadir(Absensi::query(), $bulan),
            'kehadiran_guru_persen' => $this->persenHadir(AbsensiGuru::query(), $bulan),
            'pelanggaran_bulan_ini' => Pelanggaran::whereMonth('tanggal', $bulan->month)->whereYear('tanggal', $bulan->year)->count(),
            'prestasi_bulan_ini' => Prestasi::whereMonth('tanggal', $bulan->month)->whereYear('tanggal', $bulan->year)->count(),
            'rata_rata_nilai' => round((float) Nilai::avg('nilai'), 2),
            'menunggu_persetujuan' => PengajuanKepegawaian::where('status', 'diajukan')->count()
                + PengajuanAnggaran::where('status', 'diajukan')->count(),
            'rapor_menunggu' => Rapor::where('status', 'diajukan')->count(),
            'tren_kehadiran' => $this->trenKehadiran(),
            'pelanggaran_terbaru' => $this->pelanggaranQuery()->limit(5)->get(),
            'jadwal_hari_ini' => $this->jadwalHariIni(),
        ]);
    }

    public function kurikulum(): JsonResponse
    {
        $kelas = Kelas::withCount('siswa')->orderBy('tingkat')->orderBy('nama_kelas')->get();
        $wali = Guru::whereIn('id', $kelas->pluck('wali_kelas_id')->filter())->pluck('nama', 'id');
        $jadwalPerMapel = JadwalPelajaran::selectRaw('mata_pelajaran_id, count(*) as total')->groupBy('mata_pelajaran_id')->pluck('total', 'mata_pelajaran_id');

        return response()->json([
            'kelas' => $kelas->map(fn (Kelas $k) => [
                'id' => $k->id,
                'nama_kelas' => $k->nama_kelas,
                'tingkat' => $k->tingkat,
                'jurusan' => $k->jurusan,
                'tahun_ajaran' => $k->tahun_ajaran,
                'wali_kelas' => $wali[$k->wali_kelas_id] ?? null,
                'jumlah_siswa' => $k->siswa_count,
            ]),
            'mapel' => MataPelajaran::orderBy('nama_mapel')->get()->map(fn (MataPelajaran $m) => [
                'id' => $m->id,
                'kode_mapel' => $m->kode_mapel,
                'nama_mapel' => $m->nama_mapel,
                'jumlah_jadwal' => (int) ($jadwalPerMapel[$m->id] ?? 0),
            ]),
        ]);
    }

    public function pembelajaran(): JsonResponse
    {
        $guru = Guru::pluck('nama', 'id');
        $kelas = Kelas::pluck('nama_kelas', 'id');

        $rows = JadwalPelajaran::with('mataPelajaran:id,nama_mapel')->get()
            ->groupBy('mata_pelajaran_id')
            ->map(function (Collection $items) use ($guru, $kelas) {
                return [
                    'id' => $items->first()->mata_pelajaran_id,
                    'mata_pelajaran' => $items->first()->mataPelajaran?->nama_mapel ?? '-',
                    'guru' => $items->pluck('guru_id')->unique()->map(fn ($id) => $guru[$id] ?? null)->filter()->values()->all(),
                    'kelas' => $items->pluck('kelas_id')->unique()->map(fn ($id) => $kelas[$id] ?? null)->filter()->values()->all(),
                    'jumlah_sesi' => $items->count(),
                    'total_menit' => $items->sum(fn ($j) => $this->menit($j->jam_mulai, $j->jam_selesai)),
                ];
            })
            ->values();

        return response()->json($rows);
    }

    public function nilaiRapor(): JsonResponse
    {
        $rapor = Rapor::query()
            ->join('siswa', 'siswa.id', '=', 'rapor.siswa_id')
            ->selectRaw('siswa.kelas_id, rapor.status, count(*) as total')
            ->groupBy('siswa.kelas_id', 'rapor.status')
            ->get()
            ->groupBy('kelas_id');

        $rows = Kelas::orderBy('tingkat')->orderBy('nama_kelas')->get()->map(function (Kelas $k) use ($rapor) {
            $nilai = Nilai::whereHas('siswa', fn ($q) => $q->where('kelas_id', $k->id));
            $status = ($rapor[$k->id] ?? collect())->pluck('total', 'status');

            return [
                'id' => $k->id,
                'kelas' => $k->nama_kelas,
                'jumlah_nilai' => (clone $nilai)->count(),
                'rata_rata' => ($avg = (clone $nilai)->avg('nilai')) ? round((float) $avg, 2) : null,
                'rapor_diajukan' => (int) ($status['diajukan'] ?? 0),
                'rapor_disahkan' => (int) ($status['disahkan'] ?? 0),
                'rapor_ditolak' => (int) ($status['ditolak'] ?? 0),
            ];
        });

        return response()->json($rows);
    }

    public function siswa(): JsonResponse
    {
        return response()->json(
            Siswa::with('kelas:id,nama_kelas')->orderBy('nama')->get(['id', 'kelas_id', 'nis', 'nisn', 'nama', 'jenis_kelamin', 'status'])
        );
    }

    public function pelanggaran(): JsonResponse
    {
        return response()->json($this->pelanggaranQuery()->get());
    }

    public function prestasi(): JsonResponse
    {
        return response()->json(
            Prestasi::with('siswa:id,nama,kelas_id', 'siswa.kelas:id,nama_kelas')->orderByDesc('tanggal')->get()
        );
    }

    public function guru(): JsonResponse
    {
        return response()->json(
            Guru::orderBy('nama')->get(['id', 'nip', 'nuptk', 'nama', 'gelar', 'jabatan', 'pendidikan_terakhir', 'tahun_mulai_mengajar', 'no_telepon', 'status'])
        );
    }

    public function bebanMengajar(): JsonResponse
    {
        $jadwal = JadwalPelajaran::all()->groupBy('guru_id');

        $rows = Guru::orderBy('nama')->get()->map(function (Guru $g) use ($jadwal) {
            $items = $jadwal[$g->id] ?? collect();

            return [
                'id' => $g->id,
                'nama' => $g->nama,
                'nip' => $g->nip,
                'jumlah_kelas' => $items->pluck('kelas_id')->unique()->count(),
                'jumlah_mapel' => $items->pluck('mata_pelajaran_id')->unique()->count(),
                'jumlah_sesi' => $items->count(),
                'jam_per_minggu' => round($items->sum(fn ($j) => $this->menit($j->jam_mulai, $j->jam_selesai)) / 60, 1),
            ];
        });

        return response()->json($rows);
    }

    public function aktivitasGuru(): JsonResponse
    {
        $bulan = now();
        $absen = AbsensiGuru::whereMonth('tanggal', $bulan->month)->whereYear('tanggal', $bulan->year)
            ->selectRaw('guru_id, status, count(*) as total')->groupBy('guru_id', 'status')->get()->groupBy('guru_id');
        $nilai = Nilai::selectRaw('guru_id, count(*) as total, max(created_at) as terakhir')->groupBy('guru_id')->get()->keyBy('guru_id');

        $rows = Guru::orderBy('nama')->get()->map(function (Guru $g) use ($absen, $nilai) {
            $status = ($absen[$g->id] ?? collect())->pluck('total', 'status');
            $hadir = (int) ($status['hadir'] ?? 0);
            $total = (int) $status->sum();

            return [
                'id' => $g->id,
                'nama' => $g->nama,
                'hadir_bulan_ini' => $hadir,
                'tidak_hadir_bulan_ini' => $total - $hadir,
                'persen_hadir' => $total > 0 ? round(($hadir / $total) * 100, 1) : null,
                'nilai_diinput' => (int) ($nilai[$g->id]->total ?? 0),
                'nilai_terakhir' => $nilai[$g->id]->terakhir ?? null,
            ];
        });

        return response()->json($rows);
    }

    public function kehadiran(): JsonResponse
    {
        $bulan = now();

        $siswa = Absensi::whereMonth('tanggal', $bulan->month)->whereYear('tanggal', $bulan->year)
            ->selectRaw('kelas_id, status, count(*) as total')->groupBy('kelas_id', 'status')->get()->groupBy('kelas_id');
        $perKelas = Kelas::orderBy('tingkat')->orderBy('nama_kelas')->get()->map(fn (Kelas $k) => $this->rekap($k->id, $k->nama_kelas, $siswa[$k->id] ?? collect()));

        $guruAbsen = AbsensiGuru::whereMonth('tanggal', $bulan->month)->whereYear('tanggal', $bulan->year)
            ->selectRaw('guru_id, status, count(*) as total')->groupBy('guru_id', 'status')->get()->groupBy('guru_id');
        $perGuru = Guru::orderBy('nama')->get()->map(fn (Guru $g) => $this->rekap($g->id, $g->nama, $guruAbsen[$g->id] ?? collect()));

        return response()->json(['siswa' => $perKelas, 'guru' => $perGuru, 'tren' => $this->trenKehadiran()]);
    }

    public function jadwal(): JsonResponse
    {
        $guru = Guru::pluck('nama', 'id');
        $hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        $rows = JadwalPelajaran::with('kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel')->get()
            ->map(fn (JadwalPelajaran $j) => [
                'id' => $j->id,
                'hari' => $j->hari,
                'jam_mulai' => substr((string) $j->jam_mulai, 0, 5),
                'jam_selesai' => substr((string) $j->jam_selesai, 0, 5),
                'kelas' => $j->kelas?->nama_kelas,
                'mata_pelajaran' => $j->mataPelajaran?->nama_mapel,
                'guru' => $guru[$j->guru_id] ?? null,
            ])
            ->sortBy(fn ($r) => (array_search($r['hari'], $hari, true) === false ? 9 : array_search($r['hari'], $hari, true)) . $r['jam_mulai'])
            ->values();

        return response()->json($rows);
    }

    public function jamPelajaran(): JsonResponse
    {
        return response()->json(JamBelajar::orderBy('jam_ke')->get());
    }

    public function persetujuan(): JsonResponse
    {
        $kepegawaian = PengajuanKepegawaian::with('diajukanOleh:id,name', 'disetujuiOleh:id,name', 'guru:id,nama')->get()
            ->map(fn ($p) => [
                'id' => 'kepegawaian-' . $p->id,
                'jenis' => 'Kepegawaian',
                'judul' => $p->judul,
                'keterangan' => $p->guru?->nama ? 'Terkait: ' . $p->guru->nama : $p->keterangan,
                'jumlah' => null,
                'status' => $p->status,
                'diajukan_oleh' => $p->diajukanOleh?->name,
                'diputuskan_oleh' => $p->disetujuiOleh?->name,
                'catatan' => $p->catatan_persetujuan,
                'tanggal' => $p->created_at,
                'tanggal_keputusan' => $p->tanggal_keputusan,
            ]);

        $anggaran = PengajuanAnggaran::with('diajukanOleh:id,name', 'disetujuiOleh:id,name')->get()
            ->map(fn ($p) => [
                'id' => 'anggaran-' . $p->id,
                'jenis' => 'Anggaran',
                'judul' => $p->judul,
                'keterangan' => $p->keterangan,
                'jumlah' => (float) $p->jumlah,
                'status' => $p->status,
                'diajukan_oleh' => $p->diajukanOleh?->name,
                'diputuskan_oleh' => $p->disetujuiOleh?->name,
                'catatan' => $p->catatan_persetujuan,
                'tanggal' => $p->created_at,
                'tanggal_keputusan' => $p->tanggal_keputusan,
            ]);

        return response()->json($kepegawaian->concat($anggaran)->sortByDesc('tanggal')->values());
    }

    private function pelanggaranQuery()
    {
        return Pelanggaran::with('siswa:id,nama,kelas_id', 'siswa.kelas:id,nama_kelas')->orderByDesc('tanggal');
    }

    private function persenHadir($query, Carbon $bulan): float
    {
        $base = (clone $query)->whereMonth('tanggal', $bulan->month)->whereYear('tanggal', $bulan->year);
        $total = (clone $base)->count();

        return $total > 0 ? round(((clone $base)->where('status', 'hadir')->count() / $total) * 100, 1) : 0;
    }

    /** Persentase kehadiran siswa per bulan sepanjang tahun ini (null = belum ada data). */
    private function trenKehadiran(): array
    {
        return collect(range(1, 12))->map(function (int $bulan) {
            $q = Absensi::whereMonth('tanggal', $bulan)->whereYear('tanggal', now()->year);
            $total = (clone $q)->count();

            return ['bulan' => $bulan, 'persen' => $total > 0 ? round(((clone $q)->where('status', 'hadir')->count() / $total) * 100, 1) : null];
        })->all();
    }

    private function jadwalHariIni(): array
    {
        $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now()->dayOfWeek];
        $guru = Guru::pluck('nama', 'id');

        return JadwalPelajaran::with('kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel')
            ->where('hari', $hari)->orderBy('jam_mulai')->limit(8)->get()
            ->map(fn (JadwalPelajaran $j) => [
                'id' => $j->id,
                'jam' => substr((string) $j->jam_mulai, 0, 5) . ' - ' . substr((string) $j->jam_selesai, 0, 5),
                'kelas' => $j->kelas?->nama_kelas,
                'mata_pelajaran' => $j->mataPelajaran?->nama_mapel,
                'guru' => $guru[$j->guru_id] ?? null,
            ])->all();
    }

    private function rekap(int $id, string $nama, Collection $rows): array
    {
        $status = $rows->pluck('total', 'status');
        $total = (int) $status->sum();
        $hadir = (int) ($status['hadir'] ?? 0);

        return [
            'id' => $id,
            'nama' => $nama,
            'hadir' => $hadir,
            'izin' => (int) ($status['izin'] ?? 0),
            'sakit' => (int) ($status['sakit'] ?? 0),
            'alpha' => (int) ($status['alpha'] ?? 0),
            'total' => $total,
            'persen' => $total > 0 ? round(($hadir / $total) * 100, 1) : null,
        ];
    }

    private function menit(?string $mulai, ?string $selesai): int
    {
        if (! $mulai || ! $selesai) {
            return 0;
        }

        return max((int) Carbon::parse($mulai)->diffInMinutes(Carbon::parse($selesai), false), 0);
    }
}

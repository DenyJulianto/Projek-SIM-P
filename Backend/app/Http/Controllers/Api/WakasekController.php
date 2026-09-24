<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\WakasekData;
use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\GuruPengganti;
use App\Models\JadwalPelajaran;
use App\Models\Kelas;
use App\Models\Pelanggaran;
use App\Models\PerubahanJadwal;
use App\Models\Prestasi;
use App\Models\Siswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Data untuk dashboard Wakil Kepala Sekolah. Semuanya dibaca dari modul yang sudah ada; keputusan persetujuan
 * tetap diambil lewat endpoint asli tiap modul.
 */
class WakasekController extends Controller
{
    use WakasekData;

    private const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    public function dashboard(): JsonResponse
    {
        $hariIni = now()->toDateString();
        $absen = Absensi::whereDate('tanggal', $hariIni)->selectRaw('count(*) as total, sum(case when status = ? then 1 else 0 end) as hadir, count(distinct kelas_id) as kelas', ['hadir'])->first();
        $absenGuru = AbsensiGuru::whereDate('tanggal', $hariIni)->selectRaw('count(*) as total, sum(case when status = ? then 1 else 0 end) as hadir', ['hadir'])->first();
        $guruAktif = Guru::where('status', 'aktif')->count();

        $tujuh = collect(range(6, 0))->map(function (int $mundur) {
            $t = now()->subDays($mundur)->toDateString();
            $a = Absensi::whereDate('tanggal', $t)->selectRaw('count(*) as total, sum(case when status = ? then 1 else 0 end) as hadir', ['hadir'])->first();

            return ['tanggal' => $t, 'hari' => self::HARI[Carbon::parse($t)->dayOfWeek], 'persen' => $this->persen((int) ($a->hadir ?? 0), (int) ($a->total ?? 0))];
        })->values();

        $menunggu = $this->daftarPersetujuan(null, ['menunggu_persetujuan']);

        return response()->json([
            'siswa_aktif' => Siswa::where('status', 'aktif')->count(), 'guru_aktif' => $guruAktif, 'kelas' => Kelas::count(),
            'jadwal_hari_ini' => JadwalPelajaran::where('hari', self::HARI[now()->dayOfWeek])->count(), 'hari' => self::HARI[now()->dayOfWeek],
            'kehadiran_siswa' => ['persen' => $this->persen((int) ($absen->hadir ?? 0), (int) ($absen->total ?? 0)), 'kelas_terisi' => (int) ($absen->kelas ?? 0), 'kelas_total' => Kelas::count()],
            'kehadiran_guru' => ['persen' => $this->persen((int) ($absenGuru->hadir ?? 0), (int) ($absenGuru->total ?? 0)), 'tercatat' => (int) ($absenGuru->total ?? 0), 'guru_total' => $guruAktif],
            'guru_pengganti_hari_ini' => GuruPengganti::where('status', 'disetujui')->whereDate('tanggal', $hariIni)->count(),
            'menunggu' => ['total' => $menunggu->count(), 'perubahan_jadwal' => $menunggu->where('jenis', 'perubahan_jadwal')->count(), 'guru_pengganti' => $menunggu->where('jenis', 'guru_pengganti')->count(), 'terbaru' => $menunggu->take(5)->values()],
            'pelanggaran_aktif' => Pelanggaran::where('status', '!=', 'selesai')->count(),
            'prestasi_bulan_ini' => Prestasi::where('status', 'terverifikasi')->whereYear('tanggal', now()->year)->whereMonth('tanggal', now()->month)->count(),
            'kehadiran_7_hari' => $tujuh,
        ]);
    }

    /** Data guru & tenaga kependidikan (baca saja) beserta beban jadwalnya. */
    public function guruTendik(Request $request): JsonResponse
    {
        $in = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'string', 'max:30'], 'jabatan' => ['nullable', 'string', 'max:100']]);
        $jadwal = JadwalPelajaran::selectRaw('guru_id, count(*) as sesi, count(distinct kelas_id) as kelas, count(distinct mata_pelajaran_id) as mapel')->groupBy('guru_id')->get()->keyBy('guru_id');

        $semua = Guru::orderBy('nama')->get();
        $daftar = $semua->filter(fn (Guru $g) => (empty($in['status']) || $g->status === $in['status']) && (empty($in['jabatan']) || $g->jabatan === $in['jabatan'])
            && (empty($in['search']) || str_contains(mb_strtolower($g->nama.' '.$g->nip.' '.$g->nuptk.' '.$g->mata_pelajaran), mb_strtolower($in['search']))))
            ->map(function (Guru $g) use ($jadwal) {
                $j = $jadwal->get($g->id);

                return [
                    'id' => $g->id, 'nama' => trim($g->nama.($g->gelar ? ', '.$g->gelar : '')), 'nip' => $g->nip, 'nuptk' => $g->nuptk, 'jenis_kelamin' => $g->jenis_kelamin, 'jabatan' => $g->jabatan,
                    'mata_pelajaran' => $g->mata_pelajaran, 'status_kepegawaian' => $g->status_kepegawaian, 'pendidikan_terakhir' => $g->pendidikan_terakhir, 'no_telepon' => $g->no_telepon,
                    'status' => $g->status, 'sesi_per_minggu' => (int) ($j->sesi ?? 0), 'kelas' => (int) ($j->kelas ?? 0), 'mapel' => (int) ($j->mapel ?? 0),
                ];
            })->values();

        return response()->json([
            'ringkasan' => [
                'total' => $semua->count(), 'aktif' => $semua->where('status', 'aktif')->count(), 'nonaktif' => $semua->where('status', '!=', 'aktif')->count(),
                'per_jabatan' => $semua->groupBy(fn (Guru $g) => $g->jabatan ?: 'Belum diisi')->map(fn ($g, $k) => ['label' => $k, 'jumlah' => $g->count()])->sortByDesc('jumlah')->values(),
                'per_status_kepegawaian' => $semua->groupBy(fn (Guru $g) => $g->status_kepegawaian ?: 'Belum diisi')->map(fn ($g, $k) => ['label' => $k, 'jumlah' => $g->count()])->sortByDesc('jumlah')->values(),
            ],
            'jabatan' => $semua->pluck('jabatan')->filter()->unique()->sort()->values(), 'status' => $semua->pluck('status')->filter()->unique()->values(),
            'daftar' => $daftar,
        ]);
    }

    public function aktivitasGuru(Request $request): JsonResponse
    {
        [$dari, $sampai] = $this->periode($request);
        $data = $this->hitungAktivitasGuru($dari, $sampai, $request->string('search')->toString() ?: null);

        return response()->json([
            'periode' => ['dari' => $dari, 'sampai' => $sampai],
            'ringkasan' => [
                'guru' => $data->count(), 'aktif_mencatat' => $data->where('kegiatan', '>', 0)->count(), 'perlu_perhatian' => $data->where('perlu_perhatian', true)->count(),
                'materi' => (int) $data->sum('materi'), 'tugas' => (int) $data->sum('tugas'), 'ujian' => (int) $data->sum('ujian'), 'nilai' => (int) $data->sum('nilai'),
            ],
            'daftar' => $data,
        ]);
    }

    public function rekapKehadiran(Request $request): JsonResponse
    {
        [$dari, $sampai] = $this->periode($request);
        $kelasId = $request->integer('kelas_id') ?: null;
        $siswa = $this->kehadiranSiswaPerKelas($dari, $sampai, $kelasId);
        $guru = $this->kehadiranGuru($dari, $sampai);

        $harian = collect();
        $awal = Carbon::parse($dari);
        for ($t = $awal->copy(); $t->lte(Carbon::parse($sampai)) && $harian->count() < 62; $t->addDay()) {
            $harian->push($t->toDateString());
        }
        $sHari = Absensi::whereBetween('tanggal', [$dari, $sampai])->when($kelasId, fn ($q) => $q->where('kelas_id', $kelasId))->selectRaw('date(tanggal) as t, count(*) as total, sum(case when status = ? then 1 else 0 end) as hadir', ['hadir'])->groupBy('t')->get()->keyBy('t');
        $gHari = AbsensiGuru::whereBetween('tanggal', [$dari, $sampai])->selectRaw('date(tanggal) as t, count(*) as total, sum(case when status = ? then 1 else 0 end) as hadir', ['hadir'])->groupBy('t')->get()->keyBy('t');

        $jumlah = fn ($c, string $k) => (int) $c->sum($k);
        $tot = fn ($c) => ['hadir' => $jumlah($c, 'hadir'), 'sakit' => $jumlah($c, 'sakit'), 'izin' => $jumlah($c, 'izin'), 'alpha' => $jumlah($c, 'alpha'), 'total' => $jumlah($c, 'total'), 'persen' => $this->persen($jumlah($c, 'hadir'), $jumlah($c, 'total'))];

        return response()->json([
            'periode' => ['dari' => $dari, 'sampai' => $sampai],
            'kelas' => Kelas::orderBy('nama_kelas')->get(['id', 'nama_kelas']),
            'siswa' => ['total' => $tot($siswa), 'per_kelas' => $siswa],
            'guru' => ['total' => $tot($guru), 'per_guru' => $guru],
            'harian' => $harian->map(fn (string $t) => [
                'tanggal' => $t, 'siswa' => $this->persen((int) ($sHari->get($t)->hadir ?? 0), (int) ($sHari->get($t)->total ?? 0)), 'guru' => $this->persen((int) ($gHari->get($t)->hadir ?? 0), (int) ($gHari->get($t)->total ?? 0)),
            ])->filter(fn ($h) => $h['siswa'] !== null || $h['guru'] !== null)->values(),
        ]);
    }

    /** Antrean persetujuan: mode menunggu (butuh keputusan), pengajuan (semua), atau riwayat (sudah diputuskan). */
    public function persetujuan(Request $request): JsonResponse
    {
        $in = $request->validate([
            'mode' => ['required', 'in:menunggu,pengajuan,riwayat'], 'jenis' => ['nullable', 'in:perubahan_jadwal,guru_pengganti'], 'status' => ['nullable', 'in:menunggu_persetujuan,disetujui,ditolak,dibatalkan'],
            'search' => ['nullable', 'string', 'max:100'], 'dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
        ]);
        $status = match ($in['mode']) {
            'menunggu' => ['menunggu_persetujuan'],
            'riwayat' => ! empty($in['status']) && $in['status'] !== 'menunggu_persetujuan' ? [$in['status']] : ['disetujui', 'ditolak', 'dibatalkan'],
            default => ! empty($in['status']) ? [$in['status']] : null,
        };
        $daftar = $this->daftarPersetujuan($in['jenis'] ?? null, $status, $in['search'] ?? null, $in['dari'] ?? null, $in['sampai'] ?? null);
        $menunggu = PerubahanJadwal::where('status', 'menunggu_persetujuan')->count() + GuruPengganti::where('status', 'menunggu_persetujuan')->count();

        return response()->json(['daftar' => $daftar, 'menunggu_total' => $menunggu, 'jenis' => collect(self::JENIS_PERSETUJUAN)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(), 'status' => collect(self::STATUS_PERSETUJUAN)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values()]);
    }
}

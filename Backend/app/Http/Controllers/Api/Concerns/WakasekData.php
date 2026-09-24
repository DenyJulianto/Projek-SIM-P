<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Absensi;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\GuruPengganti;
use App\Models\JadwalPelajaran;
use App\Models\Kelas;
use App\Models\Materi;
use App\Models\Nilai;
use App\Models\PerubahanJadwal;
use App\Models\Tugas;
use App\Models\Ujian;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/** Pengolah data untuk dashboard Wakil Kepala Sekolah: kehadiran, aktivitas guru, dan antrean persetujuan. */
trait WakasekData
{
    public const STATUS_PERSETUJUAN = ['menunggu_persetujuan' => 'Menunggu Persetujuan', 'disetujui' => 'Disetujui', 'ditolak' => 'Ditolak', 'dibatalkan' => 'Dibatalkan'];

    public const JENIS_PERSETUJUAN = ['perubahan_jadwal' => 'Perubahan Jadwal', 'guru_pengganti' => 'Guru Pengganti'];

    /** @return array{0: string, 1: string} awal & akhir periode (bawaan: awal bulan ini s.d. hari ini) */
    protected function periode(Request $request): array
    {
        $in = $request->validate(['dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date', 'after_or_equal:dari']]);

        return [$in['dari'] ?? now()->startOfMonth()->toDateString(), $in['sampai'] ?? now()->toDateString()];
    }

    protected function persen(int|float $a, int|float $b): ?int
    {
        return $b > 0 ? (int) round($a / $b * 100) : null;
    }

    /** Kehadiran siswa per kelas pada rentang tanggal. */
    protected function kehadiranSiswaPerKelas(string $dari, string $sampai, ?int $kelasId = null): Collection
    {
        $hitung = Absensi::query()->whereBetween('tanggal', [$dari, $sampai])->when($kelasId, fn ($q) => $q->where('kelas_id', $kelasId))
            ->selectRaw('kelas_id, status, count(*) as n')->groupBy('kelas_id', 'status')->get()->groupBy('kelas_id');

        return Kelas::when($kelasId, fn ($q) => $q->whereKey($kelasId))->orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tingkat'])->map(function (Kelas $k) use ($hitung) {
            $s = ($hitung->get($k->id) ?? collect())->pluck('n', 'status');
            $total = (int) $s->sum();

            return [
                'kelas_id' => $k->id, 'kelas' => $k->nama_kelas, 'tingkat' => $k->tingkat, 'hadir' => (int) ($s['hadir'] ?? 0), 'sakit' => (int) ($s['sakit'] ?? 0), 'izin' => (int) ($s['izin'] ?? 0),
                'alpha' => (int) ($s['alpha'] ?? 0), 'total' => $total, 'persen' => $this->persen((int) ($s['hadir'] ?? 0), $total),
            ];
        })->values();
    }

    /** Kehadiran guru & tendik pada rentang tanggal (semua guru aktif, termasuk yang belum punya catatan). */
    protected function kehadiranGuru(string $dari, string $sampai): Collection
    {
        $hitung = AbsensiGuru::query()->whereBetween('tanggal', [$dari, $sampai])->selectRaw('guru_id, status, count(*) as n')->groupBy('guru_id', 'status')->get()->groupBy('guru_id');

        return Guru::where('status', 'aktif')->orderBy('nama')->get(['id', 'nama', 'nip', 'jabatan'])->map(function (Guru $g) use ($hitung) {
            $s = ($hitung->get($g->id) ?? collect())->pluck('n', 'status');
            $total = (int) $s->sum();

            return [
                'guru_id' => $g->id, 'nama' => $g->nama, 'nip' => $g->nip, 'jabatan' => $g->jabatan, 'hadir' => (int) ($s['hadir'] ?? 0), 'sakit' => (int) ($s['sakit'] ?? 0), 'izin' => (int) ($s['izin'] ?? 0),
                'alpha' => (int) ($s['alpha'] ?? 0), 'total' => $total, 'persen' => $this->persen((int) ($s['hadir'] ?? 0), $total),
            ];
        })->values();
    }

    /** Aktivitas per guru: jadwal, kehadiran, penggantian, dan materi/tugas/ujian/nilai yang dibuat pada periode. */
    protected function hitungAktivitasGuru(string $dari, string $sampai, ?string $cari = null): Collection
    {
        $awal = Carbon::parse($dari)->startOfDay();
        $akhir = Carbon::parse($sampai)->endOfDay();
        $perGuru = fn ($model, string $kolom = 'created_at') => $model::query()->whereBetween($kolom, [$awal, $akhir])->selectRaw('guru_id, count(*) as n, max('.$kolom.') as terakhir')->groupBy('guru_id')->get()->keyBy('guru_id');

        $materi = $perGuru(Materi::class);
        $tugas = $perGuru(Tugas::class);
        $ujian = $perGuru(Ujian::class);
        $nilai = $perGuru(Nilai::class);
        $jadwal = JadwalPelajaran::query()->selectRaw('guru_id, count(*) as sesi, count(distinct kelas_id) as kelas, count(distinct mata_pelajaran_id) as mapel')->groupBy('guru_id')->get()->keyBy('guru_id');
        $hadir = $this->kehadiranGuru($dari, $sampai)->keyBy('guru_id');
        $berhalangan = GuruPengganti::where('status', 'disetujui')->whereBetween('tanggal', [$dari, $sampai])->selectRaw('guru_berhalangan_id as gid, count(*) as n')->groupBy('guru_berhalangan_id')->pluck('n', 'gid');
        $menggantikan = GuruPengganti::where('status', 'disetujui')->whereBetween('tanggal', [$dari, $sampai])->selectRaw('guru_pengganti_id as gid, count(*) as n')->groupBy('guru_pengganti_id')->pluck('n', 'gid');

        return Guru::where('status', 'aktif')->when($cari, fn ($q) => $q->where('nama', 'like', '%'.$cari.'%'))->orderBy('nama')->get(['id', 'nama', 'nip', 'jabatan'])->map(function (Guru $g) use ($materi, $tugas, $ujian, $nilai, $jadwal, $hadir, $berhalangan, $menggantikan) {
            $n = fn (Collection $c) => (int) ($c->get($g->id)->n ?? 0);
            $terakhir = collect([$materi, $tugas, $ujian, $nilai])->map(fn ($c) => $c->get($g->id)->terakhir ?? null)->filter()->max();
            $j = $jadwal->get($g->id);
            $h = $hadir->get($g->id);
            $kegiatan = $n($materi) + $n($tugas) + $n($ujian) + $n($nilai);

            return [
                'guru_id' => $g->id, 'nama' => $g->nama, 'nip' => $g->nip, 'jabatan' => $g->jabatan,
                'sesi_per_minggu' => (int) ($j->sesi ?? 0), 'kelas' => (int) ($j->kelas ?? 0), 'mapel' => (int) ($j->mapel ?? 0),
                'kehadiran_persen' => $h['persen'] ?? null, 'hadir' => $h['hadir'] ?? 0, 'tidak_hadir' => ($h['sakit'] ?? 0) + ($h['izin'] ?? 0) + ($h['alpha'] ?? 0),
                'berhalangan' => (int) ($berhalangan[$g->id] ?? 0), 'menggantikan' => (int) ($menggantikan[$g->id] ?? 0),
                'materi' => $n($materi), 'tugas' => $n($tugas), 'ujian' => $n($ujian), 'nilai' => $n($nilai), 'kegiatan' => $kegiatan,
                'terakhir_aktif' => $terakhir ? Carbon::parse($terakhir)->toDateString() : null,
                // Guru yang mengampu jadwal tetapi belum mencatat aktivitas pembelajaran apa pun pada periode ini.
                'perlu_perhatian' => (int) ($j->sesi ?? 0) > 0 && $kegiatan === 0,
            ];
        })->values();
    }

    // ------------------------------------------------------------ persetujuan

    /**
     * Antrean gabungan pengajuan yang membutuhkan keputusan pimpinan. Keputusan diambil lewat endpoint asli tiap modul
     * (perubahan jadwal dan guru pengganti), sehingga aturan bentrok dan notifikasinya tetap berlaku.
     */
    protected function daftarPersetujuan(?string $jenis = null, ?array $status = null, ?string $cari = null, ?string $dari = null, ?string $sampai = null): Collection
    {
        $item = collect();
        if (! $jenis || $jenis === 'perubahan_jadwal') {
            PerubahanJadwal::with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruLama:id,nama', 'guruBaru:id,nama', 'pengaju:id,name', 'diputuskanOleh:id,name'])
                ->when($status, fn ($q) => $q->whereIn('status', $status))->when($dari, fn ($q) => $q->whereDate('created_at', '>=', $dari))->when($sampai, fn ($q) => $q->whereDate('created_at', '<=', $sampai))
                ->orderByDesc('id')->limit(300)->get()->each(function (PerubahanJadwal $p) use ($item) {
                    $item->push([
                        'kunci' => 'pj'.$p->id, 'jenis' => 'perubahan_jadwal', 'jenis_label' => self::JENIS_PERSETUJUAN['perubahan_jadwal'], 'id' => $p->id,
                        'judul' => trim(($p->mataPelajaran?->nama_mapel ?? '-').' — '.($p->kelas?->nama_kelas ?? '-')),
                        'ringkas' => ucfirst((string) $p->jenis).': '.$p->hari_lama.' '.substr((string) $p->jam_mulai_lama, 0, 5).' ('.($p->guruLama?->nama ?? '-').') → '.$p->hari_baru.' '.substr((string) $p->jam_mulai_baru, 0, 5).' ('.($p->guruBaru?->nama ?? '-').')',
                        'tanggal_efektif' => substr((string) $p->tanggal_perubahan, 0, 10), 'alasan' => $p->alasan, 'catatan' => $p->catatan,
                        'diajukan_oleh' => $p->pengaju?->name, 'diajukan_pada' => $p->created_at?->toDateTimeString(),
                        'status' => $p->status, 'status_label' => self::STATUS_PERSETUJUAN[$p->status] ?? $p->status,
                        'diputuskan_oleh' => $p->diputuskanOleh?->name, 'tanggal_keputusan' => $p->tanggal_keputusan ? Carbon::parse($p->tanggal_keputusan)->toDateTimeString() : null, 'catatan_keputusan' => $p->catatan_keputusan,
                    ]);
                });
        }
        if (! $jenis || $jenis === 'guru_pengganti') {
            GuruPengganti::with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruBerhalangan:id,nama', 'guruPengganti:id,nama', 'pengaju:id,name', 'diputuskanOleh:id,name'])
                ->when($status, fn ($q) => $q->whereIn('status', $status))->when($dari, fn ($q) => $q->whereDate('created_at', '>=', $dari))->when($sampai, fn ($q) => $q->whereDate('created_at', '<=', $sampai))
                ->orderByDesc('id')->limit(300)->get()->each(function (GuruPengganti $p) use ($item) {
                    $item->push([
                        'kunci' => 'gp'.$p->id, 'jenis' => 'guru_pengganti', 'jenis_label' => self::JENIS_PERSETUJUAN['guru_pengganti'], 'id' => $p->id,
                        'judul' => trim(($p->mataPelajaran?->nama_mapel ?? '-').' — '.($p->kelas?->nama_kelas ?? '-')),
                        'ringkas' => ($p->guruBerhalangan?->nama ?? '-').' digantikan '.($p->guruPengganti?->nama ?? '-').', '.substr((string) $p->jam_mulai, 0, 5).'–'.substr((string) $p->jam_selesai, 0, 5),
                        'tanggal_efektif' => substr((string) $p->tanggal, 0, 10), 'alasan' => $p->alasan, 'catatan' => $p->catatan,
                        'diajukan_oleh' => $p->pengaju?->name, 'diajukan_pada' => $p->created_at?->toDateTimeString(),
                        'status' => $p->status, 'status_label' => self::STATUS_PERSETUJUAN[$p->status] ?? $p->status,
                        'diputuskan_oleh' => $p->diputuskanOleh?->name, 'tanggal_keputusan' => $p->tanggal_keputusan ? Carbon::parse($p->tanggal_keputusan)->toDateTimeString() : null, 'catatan_keputusan' => $p->catatan_keputusan,
                    ]);
                });
        }
        if ($cari) {
            $kata = mb_strtolower($cari);
            $item = $item->filter(fn ($i) => str_contains(mb_strtolower($i['judul'].' '.$i['ringkas'].' '.$i['alasan'].' '.$i['diajukan_oleh']), $kata));
        }

        return $item->sortByDesc('diajukan_pada')->values();
    }
}

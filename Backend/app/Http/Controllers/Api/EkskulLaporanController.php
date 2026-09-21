<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EkskulHelpers;
use App\Http\Controllers\Controller;
use App\Models\Ekskul;
use App\Models\EkskulAnggota;
use App\Models\EkskulKegiatan;
use App\Models\EkskulPenilaian;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\Response;

/**
 * Laporan khusus Ekstrakurikuler. Dihitung dari data modul ini saja; laporan gabungan
 * kesiswaan tetap berada di Laporan → Rekap Pembinaan. Bentuk keluaran seragam
 * ({judul, konteks, ringkasan, catatan, tabel}) agar preview, Excel, PDF, dan cetak sama.
 */
class EkskulLaporanController extends Controller
{
    use EkskulHelpers;

    public const JENIS = [
        'ringkasan' => 'Ringkasan Ekstrakurikuler',
        'peserta' => 'Daftar Peserta',
        'kehadiran' => 'Rekap Kehadiran',
        'penilaian' => 'Rekap Penilaian',
        'kegiatan' => 'Rekap Kegiatan',
        'perkembangan' => 'Perkembangan Peserta',
        'kelas' => 'Rekap per Kelas',
        'semester' => 'Rekap per Semester',
    ];

    public function tampil(Request $request, string $jenis): JsonResponse
    {
        return response()->json($this->bangun($request, $jenis));
    }

    public function export(Request $request, string $jenis): Response
    {
        $format = $request->validate(['format' => ['required', 'in:xlsx,pdf']])['format'];
        $laporan = $this->bangun($request, $jenis);
        $sekolah = tenant()->nama_sekolah ?: 'Sekolah';
        $nama = "ekskul-{$jenis}-".now()->format('Ymd-His').".{$format}";

        if ($format === 'xlsx') {
            $isi = app(LaporanAkademikController::class)->xlsx($laporan, $sekolah);

            return response($isi, 200, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition' => 'attachment; filename="'.$nama.'"']);
        }

        return Pdf::loadView('ekskul.laporan', ['laporan' => $laporan, 'sekolah' => $sekolah, 'dibuat' => now()->locale('id')->translatedFormat('d F Y H:i')])
            ->setPaper('a4', 'landscape')->download($nama);
    }

    // ------------------------------------------------------------- pembentukan

    private function bangun(Request $request, string $jenis): array
    {
        abort_unless(isset(self::JENIS[$jenis]), 404, 'Jenis laporan tidak dikenal.');
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'], 'semester' => ['nullable', 'in:ganjil,genap'], 'ekskul_id' => ['nullable', 'integer'],
            'kelas_id' => ['nullable', 'integer'], 'dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
        ]);
        $ta = TahunAjaran::findOrFail($in['tahun_ajaran_id']);
        $semester = $jenis === 'semester' ? null : ($in['semester'] ?? null);

        $ekskul = Ekskul::where('tahun_ajaran_id', $ta->id)->when($semester, fn ($q) => $q->where('semester', $semester))->when(! empty($in['ekskul_id']), fn ($q) => $q->whereKey($in['ekskul_id']))->orderBy('nama')->get();
        $ctx = $in + ['ta' => $ta, 'semester_pilih' => $semester, 'ekskul' => $ekskul];
        $hasil = $this->{'laporan'.ucfirst($jenis)}($ctx);

        $bagian = [];
        if (! empty($in['ekskul_id'])) {
            $bagian[] = 'Ekskul: '.Ekskul::whereKey($in['ekskul_id'])->value('nama');
        }
        if (! empty($in['kelas_id'])) {
            $bagian[] = 'Rombel: '.Kelas::whereKey($in['kelas_id'])->value('nama_kelas');
        }
        $rentang = ! empty($in['dari']) || ! empty($in['sampai']) ? Carbon::parse($in['dari'] ?? $ta->tanggal_mulai)->format('d/m/Y').' – '.Carbon::parse($in['sampai'] ?? $ta->tanggal_selesai)->format('d/m/Y') : 'Seluruh periode';

        return [
            'jenis' => $jenis, 'judul' => self::JENIS[$jenis],
            'konteks' => [
                'tahun_ajaran_id' => $ta->id, 'tahun_ajaran' => $ta->nama, 'semester' => $semester ?? 'semua',
                'periode' => trim($rentang.($bagian ? ' · '.implode(' · ', $bagian) : '')), 'dibuat' => now()->toDateTimeString(),
            ],
            'ringkasan' => $hasil['ringkasan'] ?? [], 'catatan' => $hasil['catatan'] ?? [], 'tabel' => $hasil['tabel'] ?? [],
        ];
    }

    private function stat(string $label, mixed $nilai, ?string $ket = null): array
    {
        return ['label' => $label, 'nilai' => $nilai, 'keterangan' => $ket];
    }

    /** @param list<array{0: string, 1: string, 2?: string}> $kolom */
    private function tabel(string $id, string $judul, array $kolom, iterable $baris, ?string $ket = null): array
    {
        return ['id' => $id, 'judul' => $judul, 'keterangan' => $ket, 'kolom' => array_map(fn ($k) => ['key' => $k[0], 'label' => $k[1], 'tipe' => $k[2] ?? 'teks'], $kolom), 'baris' => collect($baris)->values()->all()];
    }

    private function persen(int|float $a, int|float $b): ?int
    {
        return $b > 0 ? (int) round($a / $b * 100) : null;
    }

    /** Keanggotaan (dengan siswa & rombel) pada ekskul terpilih, sesuai filter kelas. */
    private function anggota(array $c, ?string $status = null): Collection
    {
        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat')->when(! empty($c['kelas_id']), fn ($q) => $q->where('kelas_id', $c['kelas_id']))->get()->keyBy('id');

        return EkskulAnggota::whereIn('ekskul_id', $c['ekskul']->pluck('id'))->when($status, fn ($q) => $q->where('status', $status))->get()
            ->filter(fn ($a) => $siswa->has($a->siswa_id))->map(function (EkskulAnggota $a) use ($siswa, $c) {
                $s = $siswa[$a->siswa_id];
                $e = $c['ekskul']->firstWhere('id', $a->ekskul_id);

                return ['a' => $a, 's' => $s, 'e' => $e];
            })->values();
    }

    private function rekap(array $c): array
    {
        $req = Request::create('/', 'GET', array_filter([
            'tahun_ajaran_id' => $c['ta']->id, 'semester' => $c['semester_pilih'], 'ekskul_id' => $c['ekskul_id'] ?? null, 'kelas_id' => $c['kelas_id'] ?? null, 'dari' => $c['dari'] ?? null, 'sampai' => $c['sampai'] ?? null,
        ], fn ($v) => $v !== null && $v !== ''));

        return app(EkskulKegiatanController::class)->rekapData($req);
    }

    private function kegiatan(array $c): Collection
    {
        return EkskulKegiatan::whereIn('ekskul_id', $c['ekskul']->pluck('id'))
            ->when(! empty($c['dari']), fn ($q) => $q->where('tanggal', '>=', $c['dari']))->when(! empty($c['sampai']), fn ($q) => $q->where('tanggal', '<=', $c['sampai']))->orderBy('tanggal')->get();
    }

    // ================================================================ 1. RINGKASAN

    private function laporanRingkasan(array $c): array
    {
        $aktif = $this->anggota($c, 'aktif');
        $rekap = $this->rekap($c);
        $kegiatan = $this->kegiatan($c);
        $pembina = Guru::whereIn('id', $c['ekskul']->pluck('pembina_guru_id')->filter())->pluck('nama', 'id');

        $perEkskul = $c['ekskul']->map(function (Ekskul $e) use ($aktif, $pembina) {
            $n = $aktif->filter(fn ($x) => $x['e']->id === $e->id)->count();

            return ['ekskul' => $e->nama, 'kategori' => self::KATEGORI[$e->kategori], 'pembina' => $pembina[$e->pembina_guru_id] ?? '-', 'status' => ucfirst($e->status), 'peserta' => $n, 'kuota' => $e->kuota, 'terisi' => $e->kuota ? $this->persen($n, $e->kuota) : null];
        });

        $teraktif = collect($rekap['baris'])->groupBy('siswa_id')->map(function (Collection $g) {
            $hadir = $g->sum('hadir');
            $total = $g->sum('total');

            return ['siswa' => $g->first()['nama'], 'kelas' => $g->first()['rombel'] ?? '-', 'ekskul' => $g->pluck('ekskul')->unique()->implode(', '), 'hadir' => $hadir, 'total' => $total, 'persen' => $this->persen($hadir, $total)];
        })->sortBy([['hadir', 'desc'], ['persen', 'desc']])->take(10)->values();

        return [
            'ringkasan' => [
                $this->stat('Ekstrakurikuler aktif', $c['ekskul']->where('status', 'aktif')->count(), 'dari '.$c['ekskul']->count().' terdaftar'),
                $this->stat('Peserta (siswa unik)', $aktif->pluck('s.id')->unique()->count(), 'keanggotaan aktif: '.$aktif->count()),
                $this->stat('Kegiatan terlaksana', $kegiatan->where('status', 'terlaksana')->count(), $kegiatan->where('status', 'terjadwal')->count().' masih terjadwal'),
                $this->stat('Kehadiran', $rekap['ringkasan']['persen'], '%'),
                $this->stat('Ekskul tanpa peserta', $c['ekskul']->where('status', 'aktif')->filter(fn ($e) => $aktif->where('e.id', $e->id)->isEmpty())->count()),
            ],
            'catatan' => $c['ekskul']->isEmpty() ? ['Belum ada ekstrakurikuler pada tahun ajaran/semester ini.'] : [],
            'tabel' => [
                $this->tabel('per_ekskul', 'Jumlah peserta per ekstrakurikuler', [['ekskul', 'Ekstrakurikuler'], ['kategori', 'Kategori'], ['pembina', 'Pembina'], ['status', 'Status'], ['peserta', 'Peserta Aktif', 'angka'], ['kuota', 'Kuota', 'angka'], ['terisi', 'Terisi', 'persen']], $perEkskul),
                $this->tabel('teraktif', 'Siswa paling aktif (10 teratas)', [['siswa', 'Siswa'], ['kelas', 'Rombel'], ['ekskul', 'Ekstrakurikuler'], ['hadir', 'Hadir', 'angka'], ['total', 'Total Kegiatan', 'angka'], ['persen', 'Kehadiran', 'persen']], $teraktif, 'Urut berdasarkan jumlah kehadiran, lalu persentase.'),
            ],
        ];
    }

    // ================================================================ 2. PESERTA

    private function laporanPeserta(array $c): array
    {
        $semua = $this->anggota($c);
        $baris = $semua->map(fn ($x) => [
            'ekskul' => $x['e']->nama, 'siswa' => $x['s']->nama, 'nis' => $x['s']->nis, 'kelas' => $x['s']->kelas?->tingkat ?? '-', 'rombel' => $x['s']->kelas?->nama_kelas ?? '-',
            'bergabung' => Carbon::parse($x['a']->tanggal_bergabung)->format('d/m/Y'), 'status' => ucfirst($x['a']->status),
            'keluar' => $x['a']->tanggal_keluar ? Carbon::parse($x['a']->tanggal_keluar)->format('d/m/Y').($x['a']->alasan_keluar ? ' — '.$x['a']->alasan_keluar : '') : '-',
        ])->sortBy([['ekskul', 'asc'], ['siswa', 'asc']])->values();

        return [
            'ringkasan' => [$this->stat('Keanggotaan', $baris->count()), $this->stat('Aktif', $semua->where('a.status', 'aktif')->count()), $this->stat('Keluar', $semua->where('a.status', 'keluar')->count()), $this->stat('Pindah', $semua->where('a.status', 'pindah')->count())],
            'tabel' => [$this->tabel('peserta', 'Daftar peserta ekstrakurikuler', [['ekskul', 'Ekstrakurikuler'], ['siswa', 'Siswa'], ['nis', 'NIS'], ['kelas', 'Kelas'], ['rombel', 'Rombel'], ['bergabung', 'Bergabung'], ['status', 'Status'], ['keluar', 'Keluar/Pindah']], $baris)],
        ];
    }

    // ================================================================ 3. KEHADIRAN

    private function laporanKehadiran(array $c): array
    {
        $r = $this->rekap($c);
        $baris = collect($r['baris']);
        $perEkskul = $baris->groupBy('ekskul')->map(function (Collection $g, $nama) {
            $hadir = $g->sum('hadir');
            $total = $g->sum('total');

            return ['ekskul' => $nama, 'siswa' => $g->count(), 'hadir' => $hadir, 'izin' => $g->sum('izin'), 'sakit' => $g->sum('sakit'), 'alpha' => $g->sum('alpha'), 'persen' => $this->persen($hadir, $total)];
        })->values();

        return [
            'ringkasan' => [
                $this->stat('Kehadiran', $r['ringkasan']['persen'], '%'), $this->stat('Siswa tercatat', $r['ringkasan']['siswa']),
                $this->stat('Hadir', $baris->sum('hadir'), 'catatan'), $this->stat('Izin', $baris->sum('izin'), 'catatan'), $this->stat('Sakit', $baris->sum('sakit'), 'catatan'), $this->stat('Alpa', $baris->sum('alpha'), 'catatan'),
            ],
            'catatan' => ['Persentase = hadir ÷ jumlah kegiatan yang presensinya tercatat (kegiatan dibatalkan tidak dihitung).'],
            'tabel' => [
                $this->tabel('per_ekskul', 'Kehadiran per ekstrakurikuler', [['ekskul', 'Ekstrakurikuler'], ['siswa', 'Siswa', 'angka'], ['hadir', 'Hadir', 'angka'], ['izin', 'Izin', 'angka'], ['sakit', 'Sakit', 'angka'], ['alpha', 'Alpa', 'angka'], ['persen', '% Hadir', 'persen']], $perEkskul),
                $this->tabel('per_siswa', 'Kehadiran per siswa', [['ekskul', 'Ekstrakurikuler'], ['nama', 'Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['hadir', 'Hadir', 'angka'], ['izin', 'Izin', 'angka'], ['sakit', 'Sakit', 'angka'], ['alpha', 'Alpa', 'angka'], ['total', 'Total', 'angka'], ['persen', '% Hadir', 'persen']], $baris),
            ],
        ];
    }

    // ================================================================ 4. PENILAIAN

    private function laporanPenilaian(array $c): array
    {
        $ids = $c['ekskul']->pluck('id');
        $siswa = Siswa::with('kelas:id,nama_kelas')->when(! empty($c['kelas_id']), fn ($q) => $q->where('kelas_id', $c['kelas_id']))->get()->keyBy('id');
        $nilai = EkskulPenilaian::whereIn('ekskul_id', $ids)->get()->filter(fn ($n) => $siswa->has($n->siswa_id));

        $baris = $nilai->map(function (EkskulPenilaian $n) use ($siswa, $c) {
            $e = $c['ekskul']->firstWhere('id', $n->ekskul_id);
            $s = $siswa[$n->siswa_id];

            return ['ekskul' => $e->nama, 'siswa' => $s->nama, 'rombel' => $s->kelas?->nama_kelas ?? '-', 'aspek' => collect($n->aspek ?? [])->map(fn ($v, $k) => "{$k}: {$v}")->implode('; ') ?: '-', 'nilai' => $n->nilai, 'predikat' => $n->predikat ?? '-', 'status' => ucfirst($n->status), 'deskripsi' => $n->deskripsi ?? '-'];
        })->sortBy([['ekskul', 'asc'], ['siswa', 'asc']])->values();

        $distribusi = $nilai->groupBy(fn ($n) => $c['ekskul']->firstWhere('id', $n->ekskul_id)->nama)->map(fn (Collection $g, $nama) => [
            'ekskul' => $nama, 'dinilai' => $g->whereNotNull('nilai')->count(), 'rata' => $g->whereNotNull('nilai')->isEmpty() ? null : round((float) $g->whereNotNull('nilai')->avg('nilai'), 2),
            'A' => $g->where('predikat', 'A')->count(), 'B' => $g->where('predikat', 'B')->count(), 'C' => $g->where('predikat', 'C')->count(), 'D' => $g->where('predikat', 'D')->count(),
        ])->values();

        return [
            'ringkasan' => [
                $this->stat('Siswa dinilai', $nilai->whereNotNull('nilai')->count()), $this->stat('Rata-rata nilai', $nilai->whereNotNull('nilai')->isEmpty() ? null : round((float) $nilai->whereNotNull('nilai')->avg('nilai'), 2)),
                $this->stat('Tervalidasi/terkunci', $nilai->whereIn('status', ['tervalidasi', 'terkunci'])->count()), $this->stat('Terkunci', $nilai->where('status', 'terkunci')->count()),
            ],
            'catatan' => ['Predikat: A ≥ 90, B ≥ 80, C ≥ 70, D < 70. Nilai akhir adalah rata-rata aspek yang dipakai tiap ekstrakurikuler.'],
            'tabel' => [
                $this->tabel('distribusi', 'Distribusi predikat per ekstrakurikuler', [['ekskul', 'Ekstrakurikuler'], ['dinilai', 'Dinilai', 'angka'], ['rata', 'Rata-rata', 'desimal'], ['A', 'A', 'angka'], ['B', 'B', 'angka'], ['C', 'C', 'angka'], ['D', 'D', 'angka']], $distribusi),
                $this->tabel('nilai', 'Rekap nilai siswa', [['ekskul', 'Ekstrakurikuler'], ['siswa', 'Siswa'], ['rombel', 'Rombel'], ['aspek', 'Aspek'], ['nilai', 'Nilai', 'desimal'], ['predikat', 'Predikat'], ['status', 'Status'], ['deskripsi', 'Deskripsi Perkembangan']], $baris),
            ],
        ];
    }

    // ================================================================ 5. KEGIATAN

    private function laporanKegiatan(array $c): array
    {
        $k = $this->kegiatan($c);
        $nama = $c['ekskul']->pluck('nama', 'id');
        $hadir = \Illuminate\Support\Facades\DB::table('ekskul_presensi')->whereIn('kegiatan_id', $k->pluck('id'))->selectRaw('kegiatan_id, count(*) as n, sum(case when status = ? then 1 else 0 end) as h', ['hadir'])->groupBy('kegiatan_id')->get()->keyBy('kegiatan_id');

        $per = $k->groupBy('ekskul_id')->map(fn (Collection $g, $id) => [
            'ekskul' => $nama[$id] ?? '-', 'total' => $g->count(), 'terlaksana' => $g->where('status', 'terlaksana')->count(), 'terjadwal' => $g->where('status', 'terjadwal')->count(), 'dibatalkan' => $g->where('status', 'dibatalkan')->count(),
            'rutin' => $g->where('jenis', 'rutin')->count(), 'khusus' => $g->where('jenis', '!=', 'rutin')->count(), 'diubah' => $g->filter(fn ($x) => ! empty($x->jadwal_semula))->count(),
        ])->values();

        return [
            'ringkasan' => [$this->stat('Total kegiatan', $k->count()), $this->stat('Terlaksana', $k->where('status', 'terlaksana')->count()), $this->stat('Terjadwal', $k->where('status', 'terjadwal')->count()), $this->stat('Dibatalkan', $k->where('status', 'dibatalkan')->count()), $this->stat('Dijadwal ulang', $k->filter(fn ($x) => ! empty($x->jadwal_semula))->count())],
            'tabel' => [
                $this->tabel('per_ekskul', 'Rekap kegiatan per ekstrakurikuler', [['ekskul', 'Ekstrakurikuler'], ['total', 'Total', 'angka'], ['terlaksana', 'Terlaksana', 'angka'], ['terjadwal', 'Terjadwal', 'angka'], ['dibatalkan', 'Dibatalkan', 'angka'], ['rutin', 'Rutin', 'angka'], ['khusus', 'Khusus/Lainnya', 'angka'], ['diubah', 'Dijadwal Ulang', 'angka']], $per),
                $this->tabel('daftar', 'Daftar kegiatan', [['tanggal', 'Tanggal'], ['hari', 'Hari'], ['jam', 'Jam'], ['ekskul', 'Ekstrakurikuler'], ['jenis', 'Jenis'], ['materi', 'Materi'], ['tempat', 'Tempat'], ['status', 'Status'], ['hadir', 'Hadir', 'angka']], $k->map(fn ($x) => [
                    'tanggal' => Carbon::parse($x->tanggal)->format('d/m/Y'), 'hari' => $x->hari, 'jam' => $this->hm($x->jam_mulai).'–'.$this->hm($x->jam_selesai), 'ekskul' => $nama[$x->ekskul_id] ?? '-', 'jenis' => self::JENIS_KEGIATAN[$x->jenis],
                    'materi' => $x->materi ?? '-', 'tempat' => $x->tempat ?? '-', 'status' => self::STATUS_KEGIATAN[$x->status], 'hadir' => isset($hadir[$x->id]) ? (int) $hadir[$x->id]->h.'/'.(int) $hadir[$x->id]->n : null,
                ])),
            ],
        ];
    }

    // ================================================================ 6. PERKEMBANGAN

    private function laporanPerkembangan(array $c): array
    {
        $siswa = Siswa::with('kelas:id,nama_kelas')->when(! empty($c['kelas_id']), fn ($q) => $q->where('kelas_id', $c['kelas_id']))->get()->keyBy('id');
        $sekarang = EkskulPenilaian::whereIn('ekskul_id', $c['ekskul']->pluck('id'))->whereNotNull('nilai')->get()->filter(fn ($n) => $siswa->has($n->siswa_id));

        $semuaEkskul = Ekskul::whereIn('nama', $c['ekskul']->pluck('nama'))->get()->keyBy('id');
        $tahun = TahunAjaran::pluck('nama', 'id');
        $urut = fn (Ekskul $e) => $e->tahun_ajaran_id * 10 + ($e->semester === 'genap' ? 2 : 1);
        $riwayat = EkskulPenilaian::whereIn('ekskul_id', $semuaEkskul->keys())->whereIn('siswa_id', $sekarang->pluck('siswa_id'))->whereNotNull('nilai')->get();

        $baris = $sekarang->map(function (EkskulPenilaian $n) use ($c, $siswa, $semuaEkskul, $riwayat, $urut, $tahun) {
            $e = $c['ekskul']->firstWhere('id', $n->ekskul_id);
            $sebelum = $riwayat->filter(fn ($r) => $r->siswa_id === $n->siswa_id && mb_strtolower($semuaEkskul[$r->ekskul_id]->nama) === mb_strtolower($e->nama) && $urut($semuaEkskul[$r->ekskul_id]) < $urut($e))
                ->sortByDesc(fn ($r) => $urut($semuaEkskul[$r->ekskul_id]))->first();
            $eS = $sebelum ? $semuaEkskul[$sebelum->ekskul_id] : null;

            return [
                'siswa' => $siswa[$n->siswa_id]->nama, 'rombel' => $siswa[$n->siswa_id]->kelas?->nama_kelas ?? '-', 'ekskul' => $e->nama,
                'periode_sebelumnya' => $eS ? ($tahun[$eS->tahun_ajaran_id] ?? '').' '.ucfirst($eS->semester) : '-', 'nilai_sebelumnya' => $sebelum?->nilai, 'nilai_sekarang' => $n->nilai,
                'selisih' => $sebelum ? round((float) $n->nilai - (float) $sebelum->nilai, 2) : null,
                'tren' => ! $sebelum ? 'Data pertama' : ((float) $n->nilai > (float) $sebelum->nilai ? 'Naik' : ((float) $n->nilai < (float) $sebelum->nilai ? 'Turun' : 'Tetap')),
                'predikat' => $n->predikat ?? '-', 'deskripsi' => $n->deskripsi ?? '-',
            ];
        })->sortBy([['ekskul', 'asc'], ['siswa', 'asc']])->values();

        return [
            'ringkasan' => [$this->stat('Nilai naik', $baris->where('tren', 'Naik')->count()), $this->stat('Nilai turun', $baris->where('tren', 'Turun')->count()), $this->stat('Tetap', $baris->where('tren', 'Tetap')->count()), $this->stat('Belum ada pembanding', $baris->where('tren', 'Data pertama')->count())],
            'catatan' => ['Perkembangan membandingkan nilai siswa pada ekstrakurikuler bernama sama di semester sebelumnya. Ekstrakurikuler baru atau siswa baru bergabung ditandai “Data pertama”.'],
            'tabel' => [$this->tabel('perkembangan', 'Perkembangan nilai peserta', [['siswa', 'Siswa'], ['rombel', 'Rombel'], ['ekskul', 'Ekstrakurikuler'], ['periode_sebelumnya', 'Periode Sebelumnya'], ['nilai_sebelumnya', 'Nilai Lalu', 'desimal'], ['nilai_sekarang', 'Nilai Sekarang', 'desimal'], ['selisih', 'Selisih', 'desimal'], ['tren', 'Tren'], ['predikat', 'Predikat'], ['deskripsi', 'Deskripsi']], $baris)],
        ];
    }

    // ================================================================ 7. PER KELAS

    private function laporanKelas(array $c): array
    {
        $aktif = $this->anggota($c, 'aktif');
        $rekap = collect($this->rekap($c)['baris']);
        $nilai = EkskulPenilaian::whereIn('ekskul_id', $c['ekskul']->pluck('id'))->whereNotNull('nilai')->get();

        $baris = $aktif->groupBy(fn ($x) => $x['s']->kelas_id ?? 0)->map(function (Collection $g, $kid) use ($rekap, $nilai) {
            $siswaIds = $g->pluck('s.id')->unique();
            $r = $rekap->whereIn('siswa_id', $siswaIds);
            $n = $nilai->whereIn('siswa_id', $siswaIds);
            $f = $g->first()['s'];

            return [
                'rombel' => $f->kelas?->nama_kelas ?? 'Tanpa rombel', 'kelas' => $f->kelas?->tingkat ?? '-', 'siswa' => $siswaIds->count(), 'keanggotaan' => $g->count(), 'ekskul' => $g->pluck('e.id')->unique()->count(),
                'kehadiran' => $this->persen($r->sum('hadir'), $r->sum('total')), 'nilai' => $n->isEmpty() ? null : round((float) $n->avg('nilai'), 2),
            ];
        })->sortBy('rombel', SORT_NATURAL | SORT_FLAG_CASE)->values();

        return [
            'ringkasan' => [$this->stat('Rombel berpartisipasi', $baris->count()), $this->stat('Siswa berpartisipasi', $aktif->pluck('s.id')->unique()->count())],
            'tabel' => [$this->tabel('kelas', 'Rekap ekstrakurikuler per rombel', [['rombel', 'Rombel'], ['kelas', 'Kelas'], ['siswa', 'Siswa Peserta', 'angka'], ['keanggotaan', 'Keanggotaan', 'angka'], ['ekskul', 'Jumlah Ekskul', 'angka'], ['kehadiran', 'Kehadiran', 'persen'], ['nilai', 'Rata-rata Nilai', 'desimal']], $baris)],
        ];
    }

    // ================================================================ 8. PER SEMESTER

    private function laporanSemester(array $c): array
    {
        $baris = collect(['ganjil', 'genap'])->map(function ($sem) use ($c) {
            $ekskul = Ekskul::where('tahun_ajaran_id', $c['ta']->id)->where('semester', $sem)->get();
            $ids = $ekskul->pluck('id');
            $rekapReq = Request::create('/', 'GET', ['tahun_ajaran_id' => $c['ta']->id, 'semester' => $sem]);
            $r = app(EkskulKegiatanController::class)->rekapData($rekapReq);
            $nilai = EkskulPenilaian::whereIn('ekskul_id', $ids)->whereNotNull('nilai')->get();

            return [
                'semester' => ucfirst($sem), 'ekskul' => $ekskul->count(), 'aktif' => $ekskul->where('status', 'aktif')->count(),
                'peserta' => EkskulAnggota::whereIn('ekskul_id', $ids)->where('status', 'aktif')->distinct()->count('siswa_id'),
                'kegiatan' => EkskulKegiatan::whereIn('ekskul_id', $ids)->where('status', 'terlaksana')->count(), 'kehadiran' => $r['ringkasan']['persen'],
                'dinilai' => $nilai->count(), 'nilai' => $nilai->isEmpty() ? null : round((float) $nilai->avg('nilai'), 2),
            ];
        });

        return [
            'ringkasan' => [$this->stat('Ekskul (setahun)', $baris->sum('ekskul')), $this->stat('Kegiatan terlaksana', $baris->sum('kegiatan'))],
            'tabel' => [$this->tabel('semester', 'Rekap per semester', [['semester', 'Semester'], ['ekskul', 'Ekskul', 'angka'], ['aktif', 'Aktif', 'angka'], ['peserta', 'Peserta Aktif', 'angka'], ['kegiatan', 'Kegiatan Terlaksana', 'angka'], ['kehadiran', 'Kehadiran', 'persen'], ['dinilai', 'Dinilai', 'angka'], ['nilai', 'Rata-rata Nilai', 'desimal']], $baris)],
        ];
    }
}

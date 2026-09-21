<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\GuruPengganti;
use App\Models\HariEfektifPeriode;
use App\Models\JadwalPelajaran;
use App\Models\KalenderKegiatan;
use App\Models\Kelas;
use App\Models\KkmKktp;
use App\Models\LaporanAkademikRiwayat;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\PembagianMapel;
use App\Models\PenerbitanRapor;
use App\Models\PerubahanJadwal;
use App\Models\Rapor;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\StrukturKurikulum;
use App\Models\TahunAjaran;
use App\Models\VerifikasiNilai;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;

/**
 * Laporan Akademik. Modul ini tidak menyimpan data akademik sendiri: semua
 * angka dihitung dari modul yang sudah ada (Nilai, Absensi, Kurikulum, Hari
 * Efektif, Kalender, Penerbitan Rapor, dst.). Satu-satunya tabel miliknya
 * adalah riwayat laporan yang pernah dibuat/diunduh.
 *
 * Setiap jenis laporan menghasilkan struktur seragam
 * {judul, konteks, ringkasan[], catatan[], tabel[]} sehingga preview, Excel,
 * PDF, dan cetak memakai data yang sama persis.
 */
class LaporanAkademikController extends Controller
{
    public const JENIS = [
        'ringkasan' => 'Ringkasan Akademik',
        'nilai' => 'Laporan Nilai',
        'kenaikan' => 'Laporan Kenaikan & Kelulusan',
        'kehadiran' => 'Laporan Kehadiran',
        'kurikulum' => 'Laporan Kurikulum',
        'pembelajaran' => 'Laporan Pembelajaran',
        'rapor' => 'Laporan Rapor',
        'guru' => 'Laporan Guru',
    ];

    private const DISTRIBUSI = [['0–59', 0, 59.99], ['60–69', 60, 69.99], ['70–79', 70, 79.99], ['80–89', 80, 89.99], ['90–100', 90, 100]];

    private const STATUS_RAPOR = [
        'belum' => 'Belum Digenerate', 'draft' => 'Draft', 'diajukan' => 'Menunggu Pengesahan', 'disahkan' => 'Disahkan',
        'ditolak' => 'Ditolak', 'diterbitkan' => 'Diterbitkan', 'dicabut' => 'Dicabut',
    ];

    private const STATUS_KENAIKAN = [
        'naik' => 'Naik Kelas', 'tidak_naik' => 'Tidak Naik Kelas', 'lulus' => 'Lulus', 'tidak_lulus' => 'Tidak Lulus',
        'belum' => 'Belum Dapat Ditentukan', 'lulus_tercatat' => 'Lulus (tercatat)', 'pindah_keluar' => 'Pindah/Keluar',
    ];

    private const STATUS_PELAKSANAAN = ['belum_terlaksana' => 'Belum', 'berjalan' => 'Berjalan', 'terlaksana' => 'Terlaksana', 'ditunda' => 'Ditunda'];

    private const STATUS_PERSETUJUAN = ['menunggu_persetujuan' => 'Menunggu', 'disetujui' => 'Disetujui', 'ditolak' => 'Ditolak', 'dibatalkan' => 'Dibatalkan'];

    public function __construct(private readonly MonitoringNilaiController $monitoring) {}

    // ---------------------------------------------------------------- endpoint

    public function opsi(): JsonResponse
    {
        $tahun = TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']);
        $semesterAktif = Semester::where('is_active', true)->value('nama');

        return response()->json([
            'jenis' => collect(self::JENIS)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
            'tahun_ajaran' => $tahun,
            'semester_aktif' => $semesterAktif ? strtolower($semesterAktif) : null,
            'jenjang' => Kelas::whereNotNull('jenjang')->distinct()->orderBy('jenjang')->pluck('jenjang')->values(),
            'jenjang_sekolah' => tenant()->jenjang ?? null,
            'tingkat' => Kelas::whereNotNull('tingkat')->distinct()->orderBy('tingkat')->pluck('tingkat')->values(),
            'kelas' => Kelas::orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tahun_ajaran', 'tahun_ajaran_id', 'tingkat', 'jenjang']),
            'mata_pelajaran' => MataPelajaran::orderBy('nama_mapel')->get(['id', 'nama_mapel']),
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function tampil(Request $request, string $jenis): JsonResponse
    {
        return response()->json($this->bangunLaporan($request, $jenis));
    }

    public function export(Request $request, string $jenis): Response
    {
        $format = $request->validate(['format' => ['required', 'in:xlsx,pdf']])['format'];
        $laporan = $this->bangunLaporan($request, $jenis);

        $sekolah = tenant()->nama_sekolah ?: 'Sekolah';
        $slug = $jenis.'-'.str_replace('/', '-', $laporan['konteks']['tahun_ajaran']).'-'.$laporan['konteks']['semester'].'-'.now()->format('Ymd-His');

        if ($format === 'xlsx') {
            $isi = $this->xlsx($laporan, $sekolah);
            $tipe = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else {
            $isi = Pdf::loadView('laporan.pdf', ['laporan' => $laporan, 'sekolah' => $sekolah, 'dibuat' => now()->translatedFormat('d F Y H:i')])
                ->setPaper('a4', 'landscape')->output();
            $tipe = 'application/pdf';
        }

        $nama = "laporan-{$slug}.{$format}";
        $riwayat = $this->catat($request, $jenis, $laporan, $format);
        $path = "laporan-akademik/{$riwayat->id}-{$nama}";
        Storage::disk('local')->put($path, $isi);
        $riwayat->update(['file_path' => $path, 'file_nama' => $nama, 'ukuran' => strlen($isi)]);

        return response($isi, 200, ['Content-Type' => $tipe, 'Content-Disposition' => 'attachment; filename="'.$nama.'"']);
    }

    /** Mencatat pencetakan (cetak dilakukan di browser, tidak ada berkas tersimpan). */
    public function catatCetak(Request $request, string $jenis): JsonResponse
    {
        $laporan = $this->bangunLaporan($request, $jenis);
        $this->catat($request, $jenis, $laporan, 'cetak');

        return response()->json(['message' => 'Pencetakan dicatat di Riwayat Laporan.']);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $in = $request->validate([
            'jenis' => ['nullable', 'in:'.implode(',', array_keys(self::JENIS))],
            'format' => ['nullable', 'in:xlsx,pdf,cetak'],
            'tahun_ajaran_id' => ['nullable', 'integer'],
        ]);

        return response()->json(
            LaporanAkademikRiwayat::with(['pembuat:id,name', 'tahunAjaran:id,nama'])
                ->when(! empty($in['jenis']), fn ($q) => $q->where('jenis', $in['jenis']))
                ->when(! empty($in['format']), fn ($q) => $q->where('format', $in['format']))
                ->when(! empty($in['tahun_ajaran_id']), fn ($q) => $q->where('tahun_ajaran_id', $in['tahun_ajaran_id']))
                ->orderByDesc('id')->limit(200)->get()
                ->map(fn (LaporanAkademikRiwayat $r) => [
                    'id' => $r->id,
                    'jenis' => $r->jenis,
                    'jenis_label' => self::JENIS[$r->jenis] ?? $r->jenis,
                    'judul' => $r->judul,
                    'format' => $r->format,
                    'tahun_ajaran_id' => $r->tahun_ajaran_id,
                    'tahun_ajaran' => $r->tahunAjaran?->nama,
                    'semester' => $r->semester,
                    'periode' => $r->periode,
                    'parameter' => $r->parameter,
                    'dapat_diunduh' => (bool) ($r->file_path && Storage::disk('local')->exists($r->file_path)),
                    'ukuran' => $r->ukuran,
                    'pembuat' => $r->pembuat?->name,
                    'created_at' => $r->created_at,
                ])
        );
    }

    public function unduh(int $riwayat): Response
    {
        $r = LaporanAkademikRiwayat::findOrFail($riwayat);
        if (! $r->file_path || ! Storage::disk('local')->exists($r->file_path)) {
            throw ValidationException::withMessages(['riwayat' => 'Berkas laporan ini tidak tersimpan (pencetakan di browser tidak menyimpan berkas). Buka ulang laporan dengan parameter yang sama.']);
        }

        return response(Storage::disk('local')->get($r->file_path), 200, [
            'Content-Type' => $r->format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$r->file_nama.'"',
        ]);
    }

    // ------------------------------------------------------------- pembentukan

    private function bangunLaporan(Request $request, string $jenis): array
    {
        if (! isset(self::JENIS[$jenis])) {
            abort(404, 'Jenis laporan tidak dikenal.');
        }
        $ctx = $this->konteks($request);
        $hasil = $this->{'laporan'.ucfirst($jenis)}($ctx);

        return [
            'jenis' => $jenis,
            'judul' => self::JENIS[$jenis],
            'konteks' => $this->labelKonteks($ctx),
            'ringkasan' => $hasil['ringkasan'] ?? [],
            'catatan' => $hasil['catatan'] ?? [],
            'tabel' => $hasil['tabel'] ?? [],
        ];
    }

    private function catat(Request $request, string $jenis, array $laporan, string $format): LaporanAkademikRiwayat
    {
        $k = $laporan['konteks'];

        return LaporanAkademikRiwayat::create([
            'jenis' => $jenis,
            'judul' => $laporan['judul'].' — '.$k['tahun_ajaran'].' '.ucfirst($k['semester']),
            'format' => $format,
            'tahun_ajaran_id' => $k['tahun_ajaran_id'],
            'semester' => $k['semester'],
            'periode' => $k['periode'],
            'parameter' => $request->except(['format']),
            'dibuat_oleh' => $request->user()?->id,
        ]);
    }

    /** Filter yang dipakai semua laporan. */
    private function konteks(Request $request): array
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'tingkat' => ['nullable', 'string', 'max:20'],
            'kelas_id' => ['nullable', 'integer'],
            'mata_pelajaran_id' => ['nullable', 'integer'],
            'guru_id' => ['nullable', 'integer'],
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'batas_hadir' => ['nullable', 'integer', 'between:1,100'],
            'maks_mapel_di_bawah' => ['nullable', 'integer', 'between:0,30'],
            'tingkat_akhir' => ['nullable', 'integer', 'between:1,13'],
            'status' => ['nullable', 'string', 'max:30'],
        ]);

        $ta = TahunAjaran::findOrFail($in['tahun_ajaran_id']);
        $semester = $in['semester'];

        $kelas = Kelas::where(fn ($q) => $q->where('tahun_ajaran', $ta->nama)->orWhere('tahun_ajaran_id', $ta->id))
            ->when(! empty($in['jenjang']), fn ($q) => $q->where('jenjang', $in['jenjang']))
            ->when(! empty($in['tingkat']), fn ($q) => $q->where('tingkat', $in['tingkat']))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->where('id', $in['kelas_id']))
            ->orderBy('nama_kelas')->get()->keyBy('id');

        // Periode default: rentang semester terpilih; bila tak ada, rentang tahun ajaran.
        $sem = Semester::where('tahun_ajaran_id', $ta->id)->whereRaw('lower(nama) = ?', [$semester])->first();
        $awalDefault = substr((string) ($sem->tanggal_mulai ?? $ta->tanggal_mulai), 0, 10);
        $akhirDefault = substr((string) ($sem->tanggal_selesai ?? $ta->tanggal_selesai), 0, 10);
        $dari = $in['dari'] ?? $awalDefault;
        $sampai = $in['sampai'] ?? $akhirDefault;

        $semuaSiswa = Siswa::whereIn('kelas_id', $kelas->keys())->orderBy('nama')->get(['id', 'kelas_id', 'nis', 'nama', 'status']);

        return $in + [
            'ta' => $ta,
            'semester' => $semester,
            'kelas' => $kelas,
            'semua_siswa' => $semuaSiswa,
            'siswa' => $semuaSiswa->where('status', 'aktif')->values(),
            'dari' => $dari,
            'sampai' => $sampai,
            'periode_default' => ! isset($in['dari']) && ! isset($in['sampai']),
        ];
    }

    private function labelKonteks(array $c): array
    {
        return [
            'tahun_ajaran_id' => $c['ta']->id,
            'tahun_ajaran' => $c['ta']->nama,
            'semester' => $c['semester'],
            'jenjang' => $c['jenjang'] ?? null,
            'tingkat' => $c['tingkat'] ?? null,
            'rombel' => ! empty($c['kelas_id']) ? $c['kelas']->get((int) $c['kelas_id'])?->nama_kelas : null,
            'mata_pelajaran' => ! empty($c['mata_pelajaran_id']) ? MataPelajaran::whereKey($c['mata_pelajaran_id'])->value('nama_mapel') : null,
            'guru' => ! empty($c['guru_id']) ? Guru::whereKey($c['guru_id'])->value('nama') : null,
            'periode' => Carbon::parse($c['dari'])->format('d/m/Y').' – '.Carbon::parse($c['sampai'])->format('d/m/Y'),
            'dibuat' => now()->toDateTimeString(),
        ];
    }

    // ---------------------------------------------------------------- pembantu

    private function stat(string $label, mixed $nilai, ?string $ket = null): array
    {
        return ['label' => $label, 'nilai' => $nilai, 'keterangan' => $ket];
    }

    /** @param list<array{0: string, 1: string, 2?: string}> $kolom [key, label, tipe = teks|angka|desimal|persen] */
    private function tabel(string $id, string $judul, array $kolom, iterable $baris, ?string $ket = null): array
    {
        return [
            'id' => $id,
            'judul' => $judul,
            'keterangan' => $ket,
            'kolom' => array_map(fn ($k) => ['key' => $k[0], 'label' => $k[1], 'tipe' => $k[2] ?? 'teks'], $kolom),
            'baris' => collect($baris)->values()->all(),
        ];
    }

    private function persen(int|float $bagian, int|float $total): ?int
    {
        return $total > 0 ? (int) round($bagian / $total * 100) : null;
    }

    private function rata(Collection|array $angka, int $desimal = 2): ?float
    {
        $c = collect($angka);

        return $c->isEmpty() ? null : round((float) $c->avg(), $desimal);
    }

    /** Baris Monitoring Nilai untuk rombel yang lolos filter (jenjang/tingkat/rombel/mapel/guru). */
    private function monitoringRows(array $c, bool $denganSiswa = false): Collection
    {
        if ($c['kelas']->isEmpty()) {
            return collect();
        }
        $req = Request::create('/', 'GET', array_filter([
            'tahun_ajaran_id' => $c['ta']->id, 'semester' => $c['semester'], 'jenis_wajib' => '',
            'kelas_id' => $c['kelas_id'] ?? null, 'mata_pelajaran_id' => $c['mata_pelajaran_id'] ?? null, 'guru_id' => $c['guru_id'] ?? null,
        ], fn ($v) => $v !== null && $v !== ''));

        return $this->monitoring->bangun($req, $denganSiswa)['rows']
            ->filter(fn ($r) => $c['kelas']->has($r['kelas']['id']))->values();
    }

    /** Kunci "kelas|mapel" rombel yang nilainya sudah disetujui Verifikasi. */
    private function disetujui(array $c): Collection
    {
        return VerifikasiNilai::where('tahun_ajaran_id', $c['ta']->id)->where('semester', $c['semester'])->where('status', 'disetujui')->get()
            ->map(fn ($v) => "{$v->kelas_id}|{$v->mata_pelajaran_id}")->flip();
    }

    /**
     * Rata-rata nilai per siswa × mapel beserta batas KKTP (bila ada KKTP aktif).
     * Rata-rata = rerata seluruh nilai siswa pada mapel itu di semester terpilih,
     * konsisten dengan Monitoring & Verifikasi Nilai.
     *
     * @return Collection<int, array{siswa_id: int, kelas_id: int, mapel_id: int, rata: float, n: int, kktp: ?float}>
     */
    private function nilaiSiswaMapel(array $c): Collection
    {
        $siswa = $c['siswa']->pluck('kelas_id', 'id');
        if ($siswa->isEmpty()) {
            return collect();
        }
        $nilai = Nilai::where('tahun_ajaran', $c['ta']->nama)->whereRaw('lower(semester) = ?', [$c['semester']])
            ->whereIn('siswa_id', $siswa->keys())
            ->when(! empty($c['mata_pelajaran_id']), fn ($q) => $q->where('mata_pelajaran_id', $c['mata_pelajaran_id']))
            ->when(! empty($c['guru_id']), fn ($q) => $q->where('guru_id', $c['guru_id']))
            ->get(['siswa_id', 'mata_pelajaran_id', 'nilai']);

        $kktp = KkmKktp::where('tahun_ajaran_id', $c['ta']->id)->where('semester', $c['semester'])->where('status', 'aktif')->whereNotNull('nilai_batas')
            ->get(['mata_pelajaran_id', 'tingkat', 'nilai_batas'])->groupBy('mata_pelajaran_id');

        return $nilai->groupBy(fn ($n) => $n->siswa_id.'|'.$n->mata_pelajaran_id)->map(function (Collection $g) use ($siswa, $c, $kktp) {
            $first = $g->first();
            $kelasId = (int) $siswa[$first->siswa_id];
            $tingkat = $c['kelas'][$kelasId]->tingkat ?? null;
            $daftar = $kktp->get($first->mata_pelajaran_id, collect());
            $batas = $daftar->firstWhere('tingkat', $tingkat) ?? $daftar->firstWhere('tingkat', null);

            return [
                'siswa_id' => (int) $first->siswa_id,
                'kelas_id' => $kelasId,
                'mapel_id' => (int) $first->mata_pelajaran_id,
                'rata' => round((float) $g->avg('nilai'), 2),
                'n' => $g->count(),
                'kktp' => $batas ? (float) $batas->nilai_batas : null,
            ];
        })->values();
    }

    // ================================================================ 1. RINGKASAN

    private function laporanRingkasan(array $c): array
    {
        $rows = $this->monitoringRows($c);
        $disetujui = $this->disetujui($c);
        $adaSiswa = $rows->where('status', '!=', 'tanpa_siswa');
        $seharusnya = $rows->sum('total_seharusnya');
        $terinput = $rows->sum('nilai_diinput');
        $verif = $adaSiswa->filter(fn ($r) => $disetujui->has("{$r['kelas']['id']}|{$r['mata_pelajaran']['id']}"))->count();

        $siswaIds = $c['siswa']->pluck('id');
        $diterbitkan = PenerbitanRapor::where('tahun_ajaran_id', $c['ta']->id)->where('semester', $c['semester'])->where('status', 'diterbitkan')->whereIn('siswa_id', $siswaIds)->get(['siswa_id', 'kelas_id']);

        $periode = HariEfektifPeriode::where('tahun_ajaran_id', $c['ta']->id)->where('semester', $c['semester'])->first();
        $rekapHari = $periode ? app(HariEfektifController::class)->rekap($periode)['total'] : null;

        $kegiatan = KalenderKegiatan::where('tahun_ajaran_id', $c['ta']->id)->where('status', '!=', 'dibatalkan')
            ->where('tanggal_mulai', '<=', $c['sampai'])->where('tanggal_selesai', '>=', $c['dari'])->get(['kategori', 'status']);

        $perRombel = $c['kelas']->map(function (Kelas $k) use ($rows, $disetujui, $c, $diterbitkan) {
            $r = $rows->filter(fn ($x) => $x['kelas']['id'] === $k->id);
            $ada = $r->where('status', '!=', 'tanpa_siswa');
            $siswa = $c['siswa']->where('kelas_id', $k->id)->count();

            return [
                'rombel' => $k->nama_kelas,
                'siswa' => $siswa,
                'mapel' => $r->count(),
                'kelengkapan' => $this->persen($r->sum('nilai_diinput'), $r->sum('total_seharusnya')),
                'terverifikasi' => $this->persen($ada->filter(fn ($x) => $disetujui->has("{$x['kelas']['id']}|{$x['mata_pelajaran']['id']}"))->count(), $ada->count()),
                'rapor' => $diterbitkan->where('kelas_id', $k->id)->count(),
            ];
        });

        $catatan = [];
        if (! $periode) {
            $catatan[] = 'Hari Efektif semester ini belum disusun di menu Hari Efektif.';
        }

        return [
            'ringkasan' => [
                $this->stat('Total siswa aktif', $c['siswa']->count()),
                $this->stat('Total guru', Guru::count()),
                $this->stat('Total rombel', $c['kelas']->count()),
                $this->stat('Total mata pelajaran', MataPelajaran::where('status', 'aktif')->count(), 'Berstatus aktif'),
                $this->stat('Kelengkapan nilai', $this->persen($terinput, $seharusnya), '%'),
                $this->stat('Nilai terverifikasi', $this->persen($verif, $adaSiswa->count()), "% ({$verif} dari {$adaSiswa->count()} rombel × mapel)"),
                $this->stat('Rapor diterbitkan', $diterbitkan->count()),
                $this->stat('Hari efektif', $rekapHari['hari_efektif'] ?? null, $rekapHari ? "{$rekapHari['minggu_efektif']} minggu efektif" : 'Belum disusun'),
                $this->stat('Kegiatan akademik', $kegiatan->count(), 'Agenda Kalender Akademik pada periode, tidak termasuk yang dibatalkan'),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('per_rombel', 'Ringkasan per rombel', [['rombel', 'Rombel'], ['siswa', 'Siswa', 'angka'], ['mapel', 'Mapel', 'angka'], ['kelengkapan', 'Kelengkapan Nilai', 'persen'], ['terverifikasi', 'Terverifikasi', 'persen'], ['rapor', 'Rapor Terbit', 'angka']], $perRombel),
                $this->tabel('kegiatan', 'Kegiatan akademik menurut kategori', [['kategori', 'Kategori'], ['jumlah', 'Jumlah', 'angka']], $kegiatan->countBy('kategori')->map(fn ($n, $k) => ['kategori' => ucwords(str_replace('_', ' ', $k)), 'jumlah' => $n])),
            ],
        ];
    }

    // ================================================================ 2. NILAI

    private function laporanNilai(array $c): array
    {
        $data = $this->nilaiSiswaMapel($c);
        $rows = $this->monitoringRows($c);
        $siswa = $c['siswa']->keyBy('id');
        $mapel = MataPelajaran::pluck('nama_mapel', 'id');
        $adaKktp = $data->filter(fn ($d) => $d['kktp'] !== null);
        $tuntas = fn ($d) => $d['rata'] >= $d['kktp'];

        $jumlahNilai = $rows->sum('jumlah_nilai');
        $rataUmum = $jumlahNilai > 0 ? round($rows->sum('total_nilai') / $jumlahNilai, 2) : null;

        $rekapSiswa = $data->groupBy('siswa_id')->map(function (Collection $g, $sid) use ($siswa, $c) {
            $s = $siswa[$sid];
            $kk = $g->filter(fn ($d) => $d['kktp'] !== null);

            return [
                'siswa' => $s->nama, 'nis' => $s->nis, 'rombel' => $c['kelas'][$s->kelas_id]->nama_kelas ?? '-',
                'mapel' => $g->count(), 'rata' => $this->rata($g->pluck('rata')),
                'terendah' => $g->min('rata'), 'tertinggi' => $g->max('rata'),
                'belum_kktp' => $kk->filter(fn ($d) => $d['rata'] < $d['kktp'])->count(),
            ];
        })->sortBy(fn ($r) => [$r['rombel'], $r['siswa']])->values();

        $rekapKelas = $rows->groupBy(fn ($r) => $r['kelas']['id'])->map(function (Collection $g) {
            $n = $g->sum('jumlah_nilai');

            return [
                'rombel' => $g->first()['kelas']['nama_kelas'], 'siswa' => $g->max('jumlah_siswa'), 'jumlah_nilai' => $n,
                'rata' => $n > 0 ? round($g->sum('total_nilai') / $n, 2) : null,
                'terendah' => $g->pluck('terendah')->filter(fn ($v) => $v !== null)->min(), 'tertinggi' => $g->pluck('tertinggi')->filter(fn ($v) => $v !== null)->max(),
            ];
        })->sortBy('rombel', SORT_NATURAL | SORT_FLAG_CASE)->values();

        $rekapMapel = $rows->groupBy(fn ($r) => $r['mata_pelajaran']['id'])->map(function (Collection $g) {
            $n = $g->sum('jumlah_nilai');

            return [
                'mapel' => $g->first()['mata_pelajaran']['nama_mapel'], 'rombel' => $g->count(), 'jumlah_nilai' => $n,
                'rata' => $n > 0 ? round($g->sum('total_nilai') / $n, 2) : null,
                'terendah' => $g->pluck('terendah')->filter(fn ($v) => $v !== null)->min(), 'tertinggi' => $g->pluck('tertinggi')->filter(fn ($v) => $v !== null)->max(),
            ];
        })->sortBy('mapel', SORT_NATURAL | SORT_FLAG_CASE)->values();

        $distribusi = collect(self::DISTRIBUSI)->map(fn ($b) => [
            'rentang' => $b[0], 'jumlah' => $data->filter(fn ($d) => $d['rata'] >= $b[1] && $d['rata'] <= $b[2])->count(),
        ])->map(fn ($r) => $r + ['persen' => $this->persen($r['jumlah'], $data->count())]);

        $kktpMapel = $adaKktp->groupBy('mapel_id')->map(function (Collection $g, $mid) use ($mapel, $tuntas) {
            $ok = $g->filter($tuntas)->count();

            return [
                'mapel' => $mapel[$mid] ?? '-', 'batas' => $g->pluck('kktp')->unique()->sort()->implode(' / '),
                'dinilai' => $g->count(), 'tuntas' => $ok, 'belum' => $g->count() - $ok, 'persen' => $this->persen($ok, $g->count()),
            ];
        })->sortBy('mapel')->values();

        $belumKktp = $adaKktp->reject($tuntas)->map(fn ($d) => [
            'siswa' => $siswa[$d['siswa_id']]->nama, 'nis' => $siswa[$d['siswa_id']]->nis, 'rombel' => $c['kelas'][$d['kelas_id']]->nama_kelas ?? '-',
            'mapel' => $mapel[$d['mapel_id']] ?? '-', 'rata' => $d['rata'], 'batas' => $d['kktp'], 'selisih' => round($d['rata'] - $d['kktp'], 2),
        ])->sortBy(fn ($r) => [$r['rombel'], $r['siswa'], $r['mapel']])->values();

        $bandingKelas = $c['kelas']->map(function (Kelas $k) use ($data, $rekapKelas, $tuntas) {
            $g = $data->where('kelas_id', $k->id);
            $kk = $g->filter(fn ($d) => $d['kktp'] !== null);
            $ok = $kk->filter($tuntas)->count();

            return [
                'rombel' => $k->nama_kelas, 'rata' => $rekapKelas->firstWhere('rombel', $k->nama_kelas)['rata'] ?? null,
                'siswa_dinilai' => $g->pluck('siswa_id')->unique()->count(), 'kktp_tuntas' => $ok, 'kktp_belum' => $kk->count() - $ok, 'persen' => $this->persen($ok, $kk->count()),
            ];
        })->filter(fn ($r) => $r['rata'] !== null)->sortBy('rata', SORT_REGULAR, true)->values();

        $catatan = ['Rata-rata per siswa dan mata pelajaran adalah rerata seluruh nilai (harian, tugas, UTS, UAS) pada semester terpilih.'];
        $tanpaKktp = $data->count() - $adaKktp->count();
        if ($tanpaKktp > 0) {
            $catatan[] = "{$tanpaKktp} kombinasi siswa × mata pelajaran belum memiliki KKTP aktif di menu KKM/KKTP sehingga tidak ikut penilaian ketercapaian.";
        }

        return [
            'ringkasan' => [
                $this->stat('Siswa dinilai', $data->pluck('siswa_id')->unique()->count()),
                $this->stat('Nilai rata-rata', $rataUmum),
                $this->stat('Nilai tertinggi', $rows->pluck('tertinggi')->filter(fn ($v) => $v !== null)->max()),
                $this->stat('Nilai terendah', $rows->pluck('terendah')->filter(fn ($v) => $v !== null)->min()),
                $this->stat('Ketercapaian KKTP', $this->persen($adaKktp->filter($tuntas)->count(), $adaKktp->count()), '% siswa × mapel mencapai KKTP'),
                $this->stat('Belum mencapai KKTP', $belumKktp->count(), 'siswa × mata pelajaran'),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('rekap_siswa', 'Rekap nilai per siswa', [['siswa', 'Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['mapel', 'Mapel', 'angka'], ['rata', 'Rata-rata', 'desimal'], ['terendah', 'Terendah (mapel)', 'desimal'], ['tertinggi', 'Tertinggi (mapel)', 'desimal'], ['belum_kktp', 'Mapel < KKTP', 'angka']], $rekapSiswa),
                $this->tabel('rekap_kelas', 'Rekap nilai per rombel', [['rombel', 'Rombel'], ['siswa', 'Siswa', 'angka'], ['jumlah_nilai', 'Jumlah Nilai', 'angka'], ['rata', 'Rata-rata', 'desimal'], ['terendah', 'Terendah', 'desimal'], ['tertinggi', 'Tertinggi', 'desimal']], $rekapKelas),
                $this->tabel('rekap_mapel', 'Rekap nilai per mata pelajaran', [['mapel', 'Mata Pelajaran'], ['rombel', 'Rombel', 'angka'], ['jumlah_nilai', 'Jumlah Nilai', 'angka'], ['rata', 'Rata-rata', 'desimal'], ['terendah', 'Terendah', 'desimal'], ['tertinggi', 'Tertinggi', 'desimal']], $rekapMapel),
                $this->tabel('distribusi', 'Distribusi nilai', [['rentang', 'Rentang Nilai'], ['jumlah', 'Siswa × Mapel', 'angka'], ['persen', 'Persentase', 'persen']], $distribusi, 'Dihitung dari rata-rata siswa pada tiap mata pelajaran.'),
                $this->tabel('kktp_mapel', 'Ketercapaian KKTP per mata pelajaran', [['mapel', 'Mata Pelajaran'], ['batas', 'KKTP'], ['dinilai', 'Dinilai', 'angka'], ['tuntas', 'Tercapai', 'angka'], ['belum', 'Belum', 'angka'], ['persen', 'Ketercapaian', 'persen']], $kktpMapel),
                $this->tabel('banding_kelas', 'Perbandingan nilai antar rombel', [['rombel', 'Rombel'], ['rata', 'Rata-rata', 'desimal'], ['siswa_dinilai', 'Siswa Dinilai', 'angka'], ['kktp_tuntas', 'KKTP Tercapai', 'angka'], ['kktp_belum', 'KKTP Belum', 'angka'], ['persen', 'Ketercapaian', 'persen']], $bandingKelas, 'Diurutkan dari rata-rata tertinggi.'),
                $this->tabel('belum_kktp', 'Siswa yang belum mencapai KKTP', [['siswa', 'Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['mapel', 'Mata Pelajaran'], ['rata', 'Rata-rata', 'desimal'], ['batas', 'KKTP', 'desimal'], ['selisih', 'Selisih', 'desimal']], $belumKktp),
            ],
        ];
    }

    // ================================================================ 3. KENAIKAN / KELULUSAN

    private function tingkatAngka(Kelas $k): ?int
    {
        foreach ([$k->tingkat, $k->nama_kelas] as $teks) {
            $teks = trim((string) $teks);
            if (preg_match('/^(\d{1,2})/', $teks, $m)) {
                return (int) $m[1];
            }
            if (preg_match('/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/i', $teks, $m)) {
                return ['I' => 1, 'II' => 2, 'III' => 3, 'IV' => 4, 'V' => 5, 'VI' => 6, 'VII' => 7, 'VIII' => 8, 'IX' => 9, 'X' => 10, 'XI' => 11, 'XII' => 12][strtoupper($m[1])];
            }
        }

        return null;
    }

    private function tingkatAkhirJenjang(?string $jenjang): ?int
    {
        $j = strtoupper((string) $jenjang);

        return match (true) {
            str_contains($j, 'SMK'), str_contains($j, 'SMA'), $j === 'MA' => 12,
            str_contains($j, 'SMP'), $j === 'MTS' => 9,
            str_contains($j, 'SD'), $j === 'MI' => 6,
            default => null,
        };
    }

    private function laporanKenaikan(array $c): array
    {
        $maks = (int) ($c['maks_mapel_di_bawah'] ?? 0);
        $nilai = $this->nilaiSiswaMapel($c)->groupBy('siswa_id');
        $filterStatus = $c['status'] ?? null;

        $daftar = $c['semua_siswa']->map(function (Siswa $s) use ($c, $nilai, $maks) {
            $kelas = $c['kelas'][$s->kelas_id];
            $akhir = ! empty($c['tingkat_akhir']) ? (int) $c['tingkat_akhir'] : $this->tingkatAkhirJenjang($kelas->jenjang ?: (tenant()->jenjang ?? null));
            $tingkat = $this->tingkatAngka($kelas);
            $kelasAkhir = $akhir !== null && $tingkat !== null && $tingkat >= $akhir;
            $g = $nilai->get($s->id, collect());
            $kk = $g->filter(fn ($d) => $d['kktp'] !== null);
            $bawah = $kk->filter(fn ($d) => $d['rata'] < $d['kktp'])->count();

            $status = match (true) {
                $s->status === 'lulus' => 'lulus_tercatat',
                in_array($s->status, ['pindah', 'keluar'], true) => 'pindah_keluar',
                $g->isEmpty() => 'belum',
                default => $bawah <= $maks ? ($kelasAkhir ? 'lulus' : 'naik') : ($kelasAkhir ? 'tidak_lulus' : 'tidak_naik'),
            };

            return [
                'siswa' => $s->nama, 'nis' => $s->nis, 'rombel' => $kelas->nama_kelas, 'kelas_id' => $kelas->id, 'kelas_akhir' => $kelasAkhir,
                'mapel' => $g->count(), 'belum_kktp' => $bawah, 'rata' => $this->rata($g->pluck('rata')),
                'status' => $status, 'status_label' => self::STATUS_KENAIKAN[$status], 'status_siswa' => $s->status,
            ];
        });

        $hitung = fn (Collection $g, string $s) => $g->where('status', $s)->count();
        $rekap = fn (bool $akhir) => $daftar->where('kelas_akhir', $akhir)->groupBy('kelas_id')->map(function (Collection $g) use ($hitung) {
            return [
                'rombel' => $g->first()['rombel'], 'siswa' => $g->count(),
                'naik' => $hitung($g, 'naik'), 'tidak_naik' => $hitung($g, 'tidak_naik'),
                'lulus' => $hitung($g, 'lulus') + $hitung($g, 'lulus_tercatat'), 'tidak_lulus' => $hitung($g, 'tidak_lulus'),
                'belum' => $hitung($g, 'belum'), 'pindah_keluar' => $hitung($g, 'pindah_keluar'),
            ];
        })->sortBy('rombel', SORT_NATURAL | SORT_FLAG_CASE)->values();

        $terpilih = $daftar->when($filterStatus && isset(self::STATUS_KENAIKAN[$filterStatus]), fn ($d) => $d->where('status', $filterStatus))
            ->sortBy(fn ($r) => [$r['rombel'], $r['siswa']])->values()
            ->map(fn ($r) => collect($r)->except(['kelas_id', 'kelas_akhir'])->all());

        $catatan = [
            'Sistem belum menyimpan keputusan kenaikan/kelulusan. Kolom Naik/Lulus di sini adalah REKOMENDASI yang dihitung dari nilai semester terpilih, bukan keputusan resmi sekolah.',
            "Aturan hitung: naik/lulus bila jumlah mata pelajaran di bawah KKTP ≤ {$maks} (dapat diubah pada filter “Maks. mapel di bawah KKTP”); siswa tanpa nilai masuk “Belum Dapat Ditentukan”. Gunakan Semester Genap untuk keputusan akhir tahun.",
            'Status Lulus/Pindah/Keluar yang sudah dicatat pada data siswa ditampilkan apa adanya.',
        ];
        if (! $daftar->contains('kelas_akhir', true)) {
            $catatan[] = 'Tidak ada rombel tingkat akhir yang terdeteksi. Isi jenjang/tingkat rombel atau tentukan “Tingkat akhir” pada filter agar rekap kelulusan terisi.';
        }

        return [
            'ringkasan' => [
                $this->stat('Naik kelas (rekomendasi)', $hitung($daftar, 'naik')),
                $this->stat('Tidak naik (rekomendasi)', $hitung($daftar, 'tidak_naik')),
                $this->stat('Lulus', $hitung($daftar, 'lulus') + $hitung($daftar, 'lulus_tercatat'), 'Rekomendasi + tercatat'),
                $this->stat('Tidak lulus (rekomendasi)', $hitung($daftar, 'tidak_lulus')),
                $this->stat('Belum dapat ditentukan', $hitung($daftar, 'belum')),
                $this->stat('Pindah/keluar', $hitung($daftar, 'pindah_keluar')),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('rekap_kenaikan', 'Rekap kenaikan kelas', [['rombel', 'Rombel'], ['siswa', 'Siswa', 'angka'], ['naik', 'Naik', 'angka'], ['tidak_naik', 'Tidak Naik', 'angka'], ['belum', 'Belum Ditentukan', 'angka'], ['pindah_keluar', 'Pindah/Keluar', 'angka']], $rekap(false)),
                $this->tabel('rekap_kelulusan', 'Rekap kelulusan (rombel tingkat akhir)', [['rombel', 'Rombel'], ['siswa', 'Siswa', 'angka'], ['lulus', 'Lulus', 'angka'], ['tidak_lulus', 'Tidak Lulus', 'angka'], ['belum', 'Belum Ditentukan', 'angka'], ['pindah_keluar', 'Pindah/Keluar', 'angka']], $rekap(true)),
                $this->tabel('daftar', 'Daftar siswa berdasarkan status'.($filterStatus && isset(self::STATUS_KENAIKAN[$filterStatus]) ? ': '.self::STATUS_KENAIKAN[$filterStatus] : ''), [['siswa', 'Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['mapel', 'Mapel Dinilai', 'angka'], ['belum_kktp', 'Mapel < KKTP', 'angka'], ['rata', 'Rata-rata', 'desimal'], ['status_label', 'Status']], $terpilih),
            ],
        ];
    }

    // ================================================================ 4. KEHADIRAN

    private function laporanKehadiran(array $c): array
    {
        $batas = (int) ($c['batas_hadir'] ?? 75);
        $siswa = $c['siswa'];
        $absen = Absensi::whereIn('siswa_id', $siswa->pluck('id'))->whereBetween('tanggal', [$c['dari'], $c['sampai']])->get(['siswa_id', 'tanggal', 'status']);
        $hitung = fn (Collection $g) => [
            'hadir' => $g->where('status', 'hadir')->count(), 'sakit' => $g->where('status', 'sakit')->count(),
            'izin' => $g->where('status', 'izin')->count(), 'alpa' => $g->where('status', 'alpha')->count(), 'total' => $g->count(),
        ];
        $persenHadir = fn (array $h) => $this->persen($h['hadir'], $h['total']);

        $perSiswa = $siswa->map(function (Siswa $s) use ($absen, $hitung, $persenHadir, $c) {
            $h = $hitung($absen->where('siswa_id', $s->id));

            return ['siswa' => $s->nama, 'nis' => $s->nis, 'rombel' => $c['kelas'][$s->kelas_id]->nama_kelas ?? '-'] + $h + ['persen' => $persenHadir($h)];
        })->sortBy(fn ($r) => [$r['rombel'], $r['siswa']])->values();

        $perKelas = $c['kelas']->map(function (Kelas $k) use ($siswa, $absen, $hitung, $persenHadir) {
            $ids = $siswa->where('kelas_id', $k->id)->pluck('id');
            $h = $hitung($absen->whereIn('siswa_id', $ids));

            return ['rombel' => $k->nama_kelas, 'siswa' => $ids->count()] + $h + ['persen' => $persenHadir($h)];
        })->values();

        $rendah = $perSiswa->filter(fn ($r) => $r['persen'] !== null && $r['persen'] < $batas)->sortBy('persen')->values();

        $guruAbsen = AbsensiGuru::whereBetween('tanggal', [$c['dari'], $c['sampai']])->when(! empty($c['guru_id']), fn ($q) => $q->where('guru_id', $c['guru_id']))->get(['guru_id', 'status']);
        $perGuru = Guru::when(! empty($c['guru_id']), fn ($q) => $q->whereKey($c['guru_id']))->orderBy('nama')->get(['id', 'nama'])->map(function (Guru $g) use ($guruAbsen, $hitung, $persenHadir) {
            $h = $hitung($guruAbsen->where('guru_id', $g->id));

            return ['guru' => $g->nama] + $h + ['persen' => $persenHadir($h)];
        })->values();

        $totS = $hitung($absen);
        $totG = $hitung($guruAbsen);
        $catatan = ['Persentase kehadiran = hadir ÷ seluruh hari yang tercatat pada periode. Hari tanpa catatan absensi tidak dihitung.'];
        if ($c['periode_default']) {
            $catatan[] = 'Periode mengikuti rentang semester terpilih. Ubah pada filter Periode untuk rentang lain.';
        }
        if ($totS['total'] === 0) {
            $catatan[] = 'Belum ada data absensi siswa pada periode ini.';
        }

        return [
            'ringkasan' => [
                $this->stat('Kehadiran siswa', $persenHadir($totS), '%'),
                $this->stat('Siswa hadir', $totS['hadir'], 'catatan'),
                $this->stat('Sakit', $totS['sakit'], 'catatan'),
                $this->stat('Izin', $totS['izin'], 'catatan'),
                $this->stat('Alpa', $totS['alpa'], 'catatan'),
                $this->stat('Kehadiran guru', $persenHadir($totG), '%'),
                $this->stat("Siswa hadir < {$batas}%", $rendah->count()),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('kelas', 'Rekap kehadiran per rombel', [['rombel', 'Rombel'], ['siswa', 'Siswa', 'angka'], ['hadir', 'Hadir', 'angka'], ['sakit', 'Sakit', 'angka'], ['izin', 'Izin', 'angka'], ['alpa', 'Alpa', 'angka'], ['persen', '% Hadir', 'persen']], $perKelas),
                $this->tabel('siswa', 'Rekap kehadiran per siswa', [['siswa', 'Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['hadir', 'Hadir', 'angka'], ['sakit', 'Sakit', 'angka'], ['izin', 'Izin', 'angka'], ['alpa', 'Alpa', 'angka'], ['persen', '% Hadir', 'persen']], $perSiswa),
                $this->tabel('rendah', "Siswa dengan kehadiran rendah (< {$batas}%)", [['siswa', 'Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['alpa', 'Alpa', 'angka'], ['persen', '% Hadir', 'persen']], $rendah),
                $this->tabel('guru', 'Kehadiran guru', [['guru', 'Guru'], ['hadir', 'Hadir', 'angka'], ['sakit', 'Sakit', 'angka'], ['izin', 'Izin', 'angka'], ['alpa', 'Alpa', 'angka'], ['persen', '% Hadir', 'persen']], $perGuru),
            ],
        ];
    }

    // ================================================================ 5. KURIKULUM

    private function laporanKurikulum(array $c): array
    {
        $ta = $c['ta'];
        $mapelId = $c['mata_pelajaran_id'] ?? null;
        $tingkat = $c['tingkat'] ?? null;

        $struktur = StrukturKurikulum::with('mapel')->where('tahun_ajaran_id', $ta->id)->when($tingkat, fn ($q) => $q->where('tingkat', $tingkat))->orderBy('tingkat')->get();
        $mapel = MataPelajaran::when($mapelId, fn ($q) => $q->whereKey($mapelId))->orderBy('nama_mapel')->get();

        $cp = DB::table('capaian_pembelajaran')->where('tahun_ajaran_id', $ta->id)->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->get(['id', 'mata_pelajaran_id', 'status']);
        $tp = DB::table('tujuan_pembelajaran as t')->join('capaian_pembelajaran as cp', 'cp.id', '=', 't.capaian_pembelajaran_id')
            ->where('cp.tahun_ajaran_id', $ta->id)->where('t.semester', $c['semester'])->when($mapelId, fn ($q) => $q->where('cp.mata_pelajaran_id', $mapelId))
            ->get(['t.id', 'cp.mata_pelajaran_id', 't.status', 't.progres']);
        $kktp = KkmKktp::where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->get(['mata_pelajaran_id', 'nilai_batas', 'status']);

        $kelasIds = $c['kelas']->keys();
        $prota = DB::table('program_tahunan')->where('tahun_ajaran_id', $ta->id)->whereIn('kelas_id', $kelasIds)->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))
            ->when(! empty($c['guru_id']), fn ($q) => $q->where('guru_id', $c['guru_id']))->get(['id', 'mata_pelajaran_id', 'status_dokumen']);
        $prosem = DB::table('program_semester')->where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->whereIn('kelas_id', $kelasIds)->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))
            ->when(! empty($c['guru_id']), fn ($q) => $q->where('guru_id', $c['guru_id']))->get(['id', 'mata_pelajaran_id', 'status_dokumen']);
        $prosemItem = DB::table('program_semester_item')->whereIn('program_semester_id', $prosem->pluck('id'))->get(['program_semester_id', 'alokasi_jp', 'status_pelaksanaan']);

        $rekapStruktur = $struktur->map(fn (StrukturKurikulum $s) => [
            'tingkat' => $s->tingkat, 'fase' => $s->fase ?: '-', 'kurikulum' => $s->kurikulum, 'aktif' => $s->is_aktif ? 'Aktif' : 'Nonaktif',
            'mapel' => $s->mapel->count(), 'wajib' => $s->mapel->where('jenis', 'wajib')->count(), 'pilihan' => $s->mapel->where('jenis', 'pilihan')->count(),
            'jp' => (int) $s->mapel->sum('jp_per_minggu'),
        ]);

        $dokumen = $mapel->map(function (MataPelajaran $m) use ($cp, $tp, $kktp, $prota, $prosem) {
            $t = $tp->where('mata_pelajaran_id', $m->id);
            $k = $kktp->where('mata_pelajaran_id', $m->id)->where('status', 'aktif');

            return [
                'mapel' => $m->nama_mapel, 'kelompok' => $m->kelompok ?: '-', 'jenis' => ucfirst(str_replace('_', ' ', (string) $m->jenis)), 'status' => ucfirst((string) $m->status),
                'cp' => $cp->where('mata_pelajaran_id', $m->id)->count(), 'tp' => $t->count(), 'tp_selesai' => $t->where('progres', 'selesai')->count(),
                'kktp' => $k->isEmpty() ? '-' : $k->pluck('nilai_batas')->unique()->sort()->implode(' / '),
                'prota' => $prota->where('mata_pelajaran_id', $m->id)->count(), 'prosem' => $prosem->where('mata_pelajaran_id', $m->id)->count(),
            ];
        });

        $status = fn (Collection $d, string $kolom, array $nilai) => collect($nilai)->mapWithKeys(fn ($l, $k) => [$k => $d->where($kolom, $k)->count()]);
        $statusDokumen = collect([
            ['dok' => 'Struktur Kurikulum', 'total' => $struktur->count(), 'ket' => "{$struktur->where('is_aktif', true)->count()} aktif, {$struktur->where('is_aktif', false)->count()} nonaktif"],
            ['dok' => 'Capaian Pembelajaran (CP)', 'total' => $cp->count(), 'ket' => $this->ringkasStatus($status($cp, 'status', ['aktif' => 1, 'draft' => 1, 'nonaktif' => 1]))],
            ['dok' => 'Tujuan Pembelajaran (TP)', 'total' => $tp->count(), 'ket' => $this->ringkasStatus($status($tp, 'status', ['aktif' => 1, 'draft' => 1, 'nonaktif' => 1]))],
            ['dok' => 'KKTP', 'total' => $kktp->count(), 'ket' => $this->ringkasStatus($status($kktp, 'status', ['aktif' => 1, 'draft' => 1, 'nonaktif' => 1]))],
            ['dok' => 'Program Tahunan (Prota)', 'total' => $prota->count(), 'ket' => $this->ringkasStatus($status($prota, 'status_dokumen', ['terverifikasi' => 1, 'diajukan' => 1, 'draft' => 1]))],
            ['dok' => 'Program Semester (Prosem)', 'total' => $prosem->count(), 'ket' => $this->ringkasStatus($status($prosem, 'status_dokumen', ['disahkan' => 1, 'diajukan' => 1, 'draft' => 1]))],
        ]);

        $jpRencana = (int) $prosemItem->sum('alokasi_jp');
        $jpSelesai = (int) $prosemItem->where('status_pelaksanaan', 'terlaksana')->sum('alokasi_jp');
        $progres = collect([
            ['aspek' => 'TP diajarkan (selesai)', 'selesai' => $tp->where('progres', 'selesai')->count(), 'berjalan' => $tp->where('progres', 'berlangsung')->count(), 'belum' => $tp->where('progres', 'belum_diajarkan')->count(), 'total' => $tp->count()],
            ['aspek' => 'Butir Prosem terlaksana', 'selesai' => $prosemItem->where('status_pelaksanaan', 'terlaksana')->count(), 'berjalan' => $prosemItem->where('status_pelaksanaan', 'berjalan')->count(), 'belum' => $prosemItem->whereIn('status_pelaksanaan', ['belum_terlaksana', 'ditunda'])->count(), 'total' => $prosemItem->count()],
        ])->map(fn ($r) => $r + ['persen' => $this->persen($r['selesai'], $r['total'])]);

        // Kesesuaian alokasi JP: pembagian mapel vs jp_per_minggu Struktur Kurikulum aktif.
        $sesuai = collect();
        $pembagian = PembagianMapel::where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->where('status', '!=', 'nonaktif')
            ->whereIn('kelas_id', $kelasIds)->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->when(! empty($c['guru_id']), fn ($q) => $q->where('guru_id', $c['guru_id']))
            ->get(['kelas_id', 'mata_pelajaran_id', 'alokasi_jp'])->groupBy('kelas_id');
        $nama = MataPelajaran::pluck('nama_mapel', 'id');
        foreach ($c['kelas'] as $k) {
            $s = $struktur->where('is_aktif', true)->filter(fn ($x) => $x->tingkat === $k->tingkat)->sortByDesc(fn ($x) => $k->fase && $x->fase === $k->fase ? 1 : 0)->first();
            $jp = [];
            foreach ($s?->mapel ?? [] as $m) {
                if ($m->mata_pelajaran_id && (! $mapelId || $m->mata_pelajaran_id === (int) $mapelId)) {
                    $jp[$m->mata_pelajaran_id] = ($jp[$m->mata_pelajaran_id] ?? 0) + $m->jp_per_minggu;
                }
            }
            $dibagi = ($pembagian->get($k->id) ?? collect())->groupBy('mata_pelajaran_id')->map(fn ($g) => (int) $g->sum('alokasi_jp'));
            foreach ($dibagi->keys()->merge(array_keys($jp))->unique() as $mid) {
                $seharusnya = $jp[$mid] ?? null;
                $terbagi = $dibagi[$mid] ?? 0;
                $st = $seharusnya === null ? 'Tanpa struktur' : ($terbagi === 0 ? 'Belum dibagi' : ($terbagi === $seharusnya ? 'Sesuai' : ($terbagi < $seharusnya ? 'Kurang' : 'Lebih')));
                $sesuai->push(['rombel' => $k->nama_kelas, 'mapel' => $nama[$mid] ?? '-', 'struktur' => $seharusnya, 'dibagi' => $terbagi, 'selisih' => $seharusnya === null ? null : $terbagi - $seharusnya, 'status' => $st]);
            }
        }
        $sesuai = $sesuai->sortBy(fn ($r) => [$r['rombel'], $r['mapel']])->values();

        return [
            'ringkasan' => [
                $this->stat('Struktur kurikulum', $struktur->count(), "{$struktur->where('is_aktif', true)->count()} aktif"),
                $this->stat('Mata pelajaran', $mapel->count()),
                $this->stat('CP', $cp->count()),
                $this->stat('TP', $tp->count(), 'Semester terpilih'),
                $this->stat('KKTP', $kktp->count(), 'Semester terpilih'),
                $this->stat('Prota', $prota->count(), 'Dokumen'),
                $this->stat('Prosem', $prosem->count(), 'Dokumen, semester terpilih'),
                $this->stat('Progres Prosem', $this->persen($jpSelesai, $jpRencana), "% JP terlaksana ({$jpSelesai} dari {$jpRencana} JP)"),
                $this->stat('Alokasi JP sesuai struktur', $this->persen($sesuai->where('status', 'Sesuai')->count(), $sesuai->count()), '% rombel × mapel'),
            ],
            'catatan' => ['Rekap CP mengikuti tahun ajaran; TP, KKTP, dan Prosem mengikuti semester terpilih. Kesesuaian JP membandingkan Pembagian Mata Pelajaran dengan JP/minggu pada Struktur Kurikulum aktif.'],
            'tabel' => [
                $this->tabel('struktur', 'Rekap struktur kurikulum', [['tingkat', 'Tingkat'], ['fase', 'Fase'], ['kurikulum', 'Kurikulum'], ['aktif', 'Status'], ['mapel', 'Mapel', 'angka'], ['wajib', 'Wajib', 'angka'], ['pilihan', 'Pilihan', 'angka'], ['jp', 'JP/Minggu', 'angka']], $rekapStruktur),
                $this->tabel('status_dokumen', 'Status dokumen kurikulum', [['dok', 'Dokumen'], ['total', 'Jumlah', 'angka'], ['ket', 'Rincian Status']], $statusDokumen),
                $this->tabel('mapel', 'Rekap mata pelajaran, CP, TP, KKTP, Prota, dan Prosem', [['mapel', 'Mata Pelajaran'], ['kelompok', 'Kelompok'], ['jenis', 'Jenis'], ['status', 'Status'], ['cp', 'CP', 'angka'], ['tp', 'TP', 'angka'], ['tp_selesai', 'TP Selesai', 'angka'], ['kktp', 'KKTP'], ['prota', 'Prota', 'angka'], ['prosem', 'Prosem', 'angka']], $dokumen),
                $this->tabel('progres', 'Progress pembelajaran', [['aspek', 'Aspek'], ['total', 'Total', 'angka'], ['selesai', 'Selesai', 'angka'], ['berjalan', 'Berjalan', 'angka'], ['belum', 'Belum/Ditunda', 'angka'], ['persen', 'Progres', 'persen']], $progres),
                $this->tabel('kesesuaian_jp', 'Kesesuaian alokasi JP', [['rombel', 'Rombel'], ['mapel', 'Mata Pelajaran'], ['struktur', 'JP Struktur', 'angka'], ['dibagi', 'JP Dibagi', 'angka'], ['selisih', 'Selisih', 'angka'], ['status', 'Status']], $sesuai),
            ],
        ];
    }

    private function ringkasStatus(Collection $hitung): string
    {
        $bagian = $hitung->filter(fn ($n) => $n > 0)->map(fn ($n, $k) => "{$n} ".str_replace('_', ' ', $k))->values();

        return $bagian->isEmpty() ? '-' : $bagian->implode(', ');
    }

    // ================================================================ 6. PEMBELAJARAN

    private function laporanPembelajaran(array $c): array
    {
        $ta = $c['ta'];
        $kelasIds = $c['kelas']->keys();
        $mapelId = $c['mata_pelajaran_id'] ?? null;
        $guruId = $c['guru_id'] ?? null;
        $mapel = MataPelajaran::pluck('nama_mapel', 'id');
        $guru = Guru::pluck('nama', 'id');

        $jadwal = JadwalPelajaran::whereIn('kelas_id', $kelasIds)->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->when($guruId, fn ($q) => $q->where('guru_id', $guruId))->get();
        $rekapJadwal = $c['kelas']->map(function (Kelas $k) use ($jadwal) {
            $j = $jadwal->where('kelas_id', $k->id);
            $menit = $j->sum(fn ($x) => max(0, Carbon::parse($x->jam_selesai)->diffInMinutes(Carbon::parse($x->jam_mulai), true)));

            return ['rombel' => $k->nama_kelas, 'sesi' => $j->count(), 'mapel' => $j->pluck('mata_pelajaran_id')->unique()->count(), 'guru' => $j->pluck('guru_id')->unique()->count(), 'hari' => $j->pluck('hari')->unique()->count(), 'jam' => round($menit / 60, 1)];
        })->filter(fn ($r) => $r['sesi'] > 0)->values();

        $prosem = DB::table('program_semester')->where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->whereIn('kelas_id', $kelasIds)
            ->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->when($guruId, fn ($q) => $q->where('guru_id', $guruId))->get(['id', 'kelas_id', 'mata_pelajaran_id', 'guru_id']);
        $item = DB::table('program_semester_item')->whereIn('program_semester_id', $prosem->pluck('id'))->get(['program_semester_id', 'alokasi_jp', 'status_pelaksanaan'])->groupBy('program_semester_id');
        $jp = fn (Collection $g, ?string $s = null) => (int) ($s ? $g->where('status_pelaksanaan', $s) : $g)->sum('alokasi_jp');

        $realisasi = $prosem->map(function ($p) use ($item, $jp, $c, $mapel, $guru) {
            $g = $item->get($p->id, collect());
            $rencana = $jp($g);

            return [
                'rombel' => $c['kelas'][$p->kelas_id]->nama_kelas ?? '-', 'mapel' => $mapel[$p->mata_pelajaran_id] ?? '-', 'guru' => $p->guru_id ? ($guru[$p->guru_id] ?? '-') : '-',
                'rencana' => $rencana, 'terlaksana' => $jp($g, 'terlaksana'), 'berjalan' => $jp($g, 'berjalan'), 'ditunda' => $jp($g, 'ditunda'),
                'belum' => $jp($g, 'belum_terlaksana'), 'persen' => $this->persen($jp($g, 'terlaksana'), $rencana),
            ];
        })->sortBy(fn ($r) => [$r['rombel'], $r['mapel']])->values();

        $totalRencana = $realisasi->sum('rencana');
        $totalSelesai = $realisasi->sum('terlaksana');

        // Rencana Prota vs Prosem.
        $prota = DB::table('program_tahunan')->where('tahun_ajaran_id', $ta->id)->whereIn('kelas_id', $kelasIds)->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->when($guruId, fn ($q) => $q->where('guru_id', $guruId))->get(['id', 'kelas_id', 'mata_pelajaran_id']);
        $protaJp = DB::table('program_tahunan_item')->whereIn('program_tahunan_id', $prota->pluck('id'))->where('semester', $c['semester'])->selectRaw('program_tahunan_id, sum(alokasi_jp) as jp')->groupBy('program_tahunan_id')->pluck('jp', 'program_tahunan_id');
        $rencanaSesuai = $prota->map(function ($p) use ($protaJp, $prosem, $item, $jp, $c, $mapel) {
            $ps = $prosem->first(fn ($x) => $x->kelas_id === $p->kelas_id && $x->mata_pelajaran_id === $p->mata_pelajaran_id);
            $g = $ps ? $item->get($ps->id, collect()) : collect();
            $pro = (int) ($protaJp[$p->id] ?? 0);
            $sem = $jp($g);

            return [
                'rombel' => $c['kelas'][$p->kelas_id]->nama_kelas ?? '-', 'mapel' => $mapel[$p->mata_pelajaran_id] ?? '-', 'prota' => $pro, 'prosem' => $ps ? $sem : null,
                'terlaksana' => $ps ? $jp($g, 'terlaksana') : null,
                'status' => ! $ps ? 'Prosem belum disusun' : ($sem === $pro ? 'Sesuai' : ($sem < $pro ? 'Prosem kurang dari Prota' : 'Prosem melebihi Prota')),
            ];
        })->sortBy(fn ($r) => [$r['rombel'], $r['mapel']])->values();

        // Hari efektif.
        $periode = HariEfektifPeriode::where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->first();
        $rekapHari = $periode ? app(HariEfektifController::class)->rekap($periode) : null;

        $tampilTanggal = fn ($d) => Carbon::parse($d)->format('d/m/Y');
        $perubahan = PerubahanJadwal::whereIn('kelas_id', $kelasIds)->whereBetween('tanggal_perubahan', [$c['dari'], $c['sampai']])
            ->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->when($guruId, fn ($q) => $q->where(fn ($w) => $w->where('guru_lama_id', $guruId)->orWhere('guru_baru_id', $guruId)))
            ->orderBy('tanggal_perubahan')->get();
        $pengganti = GuruPengganti::whereIn('kelas_id', $kelasIds)->whereBetween('tanggal', [$c['dari'], $c['sampai']])
            ->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->when($guruId, fn ($q) => $q->where(fn ($w) => $w->where('guru_berhalangan_id', $guruId)->orWhere('guru_pengganti_id', $guruId)))
            ->orderBy('tanggal')->get();
        $hm = fn ($t) => substr((string) $t, 0, 5);

        $catatan = ['Realisasi pembelajaran diambil dari status pelaksanaan butir Program Semester yang diperbarui guru.'];
        if (! $periode) {
            $catatan[] = 'Hari Efektif semester ini belum disusun di menu Hari Efektif.';
        }
        if ($prosem->isEmpty()) {
            $catatan[] = 'Belum ada Program Semester untuk filter ini sehingga JP terlaksana belum dapat dihitung.';
        }

        return [
            'ringkasan' => [
                $this->stat('Sesi jadwal / minggu', $jadwal->count()),
                $this->stat('JP terlaksana', $totalSelesai, "dari {$totalRencana} JP rencana Prosem"),
                $this->stat('JP belum terlaksana', $totalRencana - $totalSelesai, 'Belum, berjalan, dan ditunda'),
                $this->stat('Progres pembelajaran', $this->persen($totalSelesai, $totalRencana), '%'),
                $this->stat('Hari efektif', $rekapHari['total']['hari_efektif'] ?? null),
                $this->stat('Minggu efektif', $rekapHari['total']['minggu_efektif'] ?? null),
                $this->stat('Jadwal berubah', $perubahan->count(), 'Pada periode'),
                $this->stat('Guru pengganti', $pengganti->count(), 'Pada periode'),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('jadwal', 'Rekap jadwal pembelajaran', [['rombel', 'Rombel'], ['sesi', 'Sesi/Minggu', 'angka'], ['mapel', 'Mapel', 'angka'], ['guru', 'Guru', 'angka'], ['hari', 'Hari', 'angka'], ['jam', 'Jam/Minggu', 'desimal']], $rekapJadwal),
                $this->tabel('realisasi', 'JP terlaksana dan belum terlaksana (Prosem)', [['rombel', 'Rombel'], ['mapel', 'Mata Pelajaran'], ['guru', 'Guru'], ['rencana', 'Rencana JP', 'angka'], ['terlaksana', 'Terlaksana', 'angka'], ['berjalan', 'Berjalan', 'angka'], ['ditunda', 'Ditunda', 'angka'], ['belum', 'Belum', 'angka'], ['persen', 'Progres', 'persen']], $realisasi),
                $this->tabel('rencana', 'Kesesuaian rencana (Prota – Prosem – realisasi)', [['rombel', 'Rombel'], ['mapel', 'Mata Pelajaran'], ['prota', 'JP Prota', 'angka'], ['prosem', 'JP Prosem', 'angka'], ['terlaksana', 'JP Terlaksana', 'angka'], ['status', 'Status']], $rencanaSesuai),
                $this->tabel('hari_efektif', 'Rekap hari dan minggu efektif per bulan', [['nama', 'Bulan'], ['hari_efektif', 'Hari Efektif', 'angka'], ['libur', 'Libur', 'angka'], ['kegiatan_sekolah', 'Kegiatan Sekolah', 'angka'], ['ujian', 'Ujian', 'angka']], collect($rekapHari['per_bulan'] ?? []),
                    $rekapHari ? "Total {$rekapHari['total']['hari_efektif']} hari efektif = {$rekapHari['total']['minggu_efektif']} minggu efektif (sumber: menu Hari Efektif)." : 'Belum disusun.'),
                $this->tabel('perubahan', 'Jadwal yang berubah', [['tanggal', 'Tanggal'], ['rombel', 'Rombel'], ['mapel', 'Mata Pelajaran'], ['lama', 'Jadwal Lama'], ['baru', 'Jadwal Baru'], ['alasan', 'Alasan'], ['status', 'Status']], $perubahan->map(fn ($p) => [
                    'tanggal' => $tampilTanggal($p->tanggal_perubahan), 'rombel' => $c['kelas'][$p->kelas_id]->nama_kelas ?? '-', 'mapel' => $mapel[$p->mata_pelajaran_id] ?? '-',
                    'lama' => "{$p->hari_lama} {$hm($p->jam_mulai_lama)}–{$hm($p->jam_selesai_lama)}", 'baru' => "{$p->hari_baru} {$hm($p->jam_mulai_baru)}–{$hm($p->jam_selesai_baru)}",
                    'alasan' => $p->alasan, 'status' => self::STATUS_PERSETUJUAN[$p->status] ?? $p->status,
                ])),
                $this->tabel('pengganti', 'Rekap guru pengganti', [['tanggal', 'Tanggal'], ['rombel', 'Rombel'], ['mapel', 'Mata Pelajaran'], ['berhalangan', 'Guru Berhalangan'], ['pengganti', 'Guru Pengganti'], ['alasan', 'Alasan'], ['status', 'Status']], $pengganti->map(fn ($p) => [
                    'tanggal' => $tampilTanggal($p->tanggal), 'rombel' => $c['kelas'][$p->kelas_id]->nama_kelas ?? '-', 'mapel' => $mapel[$p->mata_pelajaran_id] ?? '-',
                    'berhalangan' => $guru[$p->guru_berhalangan_id] ?? '-', 'pengganti' => $guru[$p->guru_pengganti_id] ?? '-', 'alasan' => $p->alasan, 'status' => self::STATUS_PERSETUJUAN[$p->status] ?? $p->status,
                ])),
            ],
        ];
    }

    // ================================================================ 7. RAPOR

    private function laporanRapor(array $c): array
    {
        $ta = $c['ta'];
        $siswa = $c['siswa'];
        $ids = $siswa->pluck('id');
        $rows = $this->monitoringRows($c);
        $disetujui = $this->disetujui($c);

        $penerbitan = PenerbitanRapor::where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->whereIn('siswa_id', $ids)->get()->keyBy('siswa_id');
        $pengesahan = Rapor::whereIn('siswa_id', $ids)->where('tahun_ajaran', $ta->nama)->whereRaw('lower(semester) = ?', [$c['semester']])->get()->keyBy('siswa_id');

        // Verifikasi bersifat per rombel × mapel; siswa terverifikasi bila seluruh mapel rombelnya disetujui.
        $verifKelas = $rows->groupBy(fn ($r) => $r['kelas']['id'])->map(function (Collection $g) use ($disetujui) {
            $ada = $g->where('status', '!=', 'tanpa_siswa');
            $ok = $ada->filter(fn ($r) => $disetujui->has("{$r['kelas']['id']}|{$r['mata_pelajaran']['id']}"))->count();

            return $ada->isEmpty() ? 'tanpa_mapel' : ($ok === $ada->count() ? 'terverifikasi' : 'belum');
        });

        $daftar = $siswa->map(function (Siswa $s) use ($penerbitan, $pengesahan, $verifKelas, $c) {
            $p = $penerbitan->get($s->id);
            $r = $pengesahan->get($s->id);
            $status = $p?->status === 'diterbitkan' ? 'diterbitkan' : ($p?->status === 'dicabut' ? 'dicabut' : ($p && $r ? $r->status : ($p ? 'draft' : 'belum')));
            $v = $verifKelas->get($s->kelas_id, 'tanpa_mapel');

            return [
                'siswa_id' => $s->id, 'kelas_id' => $s->kelas_id, 'siswa' => $s->nama, 'nis' => $s->nis, 'rombel' => $c['kelas'][$s->kelas_id]->nama_kelas ?? '-',
                'verifikasi' => ['terverifikasi' => 'Terverifikasi', 'belum' => 'Belum', 'tanpa_mapel' => 'Tanpa mapel'][$v], 'terverifikasi' => $v === 'terverifikasi',
                'status' => $status, 'status_label' => self::STATUS_RAPOR[$status], 'nomor' => $p?->nomor_rapor ?: '-',
                'tanggal' => $p?->tanggal_terbit ? Carbon::parse($p->tanggal_terbit)->format('d/m/Y') : '-',
            ];
        })->sortBy(fn ($r) => [$r['rombel'], $r['siswa']])->values();

        $terbit = $daftar->where('status', 'diterbitkan');
        $perKelas = $c['kelas']->map(function (Kelas $k) use ($daftar) {
            $g = $daftar->where('kelas_id', $k->id);

            return [
                'rombel' => $k->nama_kelas, 'wali' => $k->wali_kelas_id ? (Guru::whereKey($k->wali_kelas_id)->value('nama') ?? '-') : '-', 'siswa' => $g->count(),
                'terbit' => $g->where('status', 'diterbitkan')->count(), 'belum_terbit' => $g->where('status', '!=', 'diterbitkan')->count(),
                'terverifikasi' => $g->where('terverifikasi', true)->count(), 'belum_verifikasi' => $g->where('terverifikasi', false)->count(),
                'persen' => $this->persen($g->where('status', 'diterbitkan')->count(), $g->count()),
            ];
        })->values();

        $riwayat = Activity::where('log_name', 'penerbitan-rapor')->where('subject_type', PenerbitanRapor::class)->whereIn('subject_id', $penerbitan->pluck('id'))
            ->with('causer:id,name')->orderByDesc('created_at')->limit(100)->get()
            ->map(fn (Activity $a) => ['waktu' => $a->created_at?->format('d/m/Y H:i'), 'peristiwa' => ucfirst((string) $a->event), 'keterangan' => $a->description, 'oleh' => $a->causer?->name ?? '-']);

        return [
            'ringkasan' => [
                $this->stat('Rapor diterbitkan', $terbit->count()),
                $this->stat('Belum diterbitkan', $daftar->count() - $terbit->count()),
                $this->stat('Sudah diverifikasi', $daftar->where('terverifikasi', true)->count(), 'Seluruh nilai rombelnya disetujui'),
                $this->stat('Belum diverifikasi', $daftar->where('terverifikasi', false)->count()),
                $this->stat('Persentase terbit', $this->persen($terbit->count(), $daftar->count()), '%'),
            ],
            'catatan' => ['Laporan ini hanya merekap data Penerbitan Rapor. Penerbitan, pengesahan, dan pencabutan tetap dilakukan di menu Penerbitan Rapor. Cetak ulang memakai rapor yang sudah dibekukan saat penerbitan.'],
            'tabel' => [
                $this->tabel('rapor_kelas', 'Rekap rapor per rombel', [['rombel', 'Rombel'], ['wali', 'Wali Kelas'], ['siswa', 'Siswa', 'angka'], ['terbit', 'Diterbitkan', 'angka'], ['belum_terbit', 'Belum', 'angka'], ['terverifikasi', 'Terverifikasi', 'angka'], ['belum_verifikasi', 'Belum Verifikasi', 'angka'], ['persen', 'Terbit', 'persen']], $perKelas),
                $this->tabel('rapor_siswa', 'Rekap rapor per siswa', [['siswa', 'Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['verifikasi', 'Verifikasi Nilai'], ['status_label', 'Status Rapor'], ['nomor', 'Nomor Rapor'], ['tanggal', 'Tgl Terbit']], $daftar->map(fn ($r) => collect($r)->except(['kelas_id', 'terverifikasi', 'status'])->all() + ['status' => $r['status']])),
                $this->tabel('rapor_riwayat', 'Riwayat penerbitan', [['waktu', 'Waktu'], ['peristiwa', 'Peristiwa'], ['keterangan', 'Keterangan'], ['oleh', 'Oleh']], $riwayat),
            ],
        ];
    }

    // ================================================================ 8. GURU

    private function laporanGuru(array $c): array
    {
        $ta = $c['ta'];
        $kelasIds = $c['kelas']->keys();
        $guruId = $c['guru_id'] ?? null;
        $mapelId = $c['mata_pelajaran_id'] ?? null;
        $mapel = MataPelajaran::pluck('nama_mapel', 'id');

        $rows = $this->monitoringRows($c);
        $disetujui = $this->disetujui($c);
        $pembagian = PembagianMapel::where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->where('status', '!=', 'nonaktif')->whereIn('kelas_id', $kelasIds)
            ->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->get(['guru_id', 'kelas_id', 'mata_pelajaran_id', 'alokasi_jp'])->groupBy('guru_id');
        $jadwal = JadwalPelajaran::whereIn('kelas_id', $kelasIds)->when($mapelId, fn ($q) => $q->where('mata_pelajaran_id', $mapelId))->get(['guru_id', 'kelas_id', 'mata_pelajaran_id'])->groupBy('guru_id');
        $prosem = DB::table('program_semester')->where('tahun_ajaran_id', $ta->id)->where('semester', $c['semester'])->whereIn('kelas_id', $kelasIds)->whereNotNull('guru_id')->get(['id', 'guru_id'])->groupBy('guru_id');
        $item = DB::table('program_semester_item')->whereIn('program_semester_id', $prosem->flatten(1)->pluck('id'))->get(['program_semester_id', 'alokasi_jp', 'status_pelaksanaan'])->groupBy('program_semester_id');
        $pengganti = GuruPengganti::whereIn('kelas_id', $kelasIds)->whereBetween('tanggal', [$c['dari'], $c['sampai']])->where('status', 'disetujui')->get(['guru_berhalangan_id', 'guru_pengganti_id']);

        $daftar = Guru::when($guruId, fn ($q) => $q->whereKey($guruId))->orderBy('nama')->get(['id', 'nama', 'nip'])->map(function (Guru $g) use ($rows, $disetujui, $pembagian, $jadwal, $prosem, $item, $pengganti, $mapel) {
            $p = $pembagian->get($g->id, collect());
            $j = $jadwal->get($g->id, collect());
            $r = $rows->filter(fn ($x) => collect($x['guru'])->contains('id', $g->id));
            $ada = $r->where('status', '!=', 'tanpa_siswa');
            $butir = ($prosem->get($g->id, collect()))->flatMap(fn ($x) => $item->get($x->id, collect()));
            $rencana = (int) $butir->sum('alokasi_jp');
            $selesai = (int) $butir->where('status_pelaksanaan', 'terlaksana')->sum('alokasi_jp');
            $mapelIds = $p->pluck('mata_pelajaran_id')->merge($j->pluck('mata_pelajaran_id'))->unique();
            $kelasGuru = $p->pluck('kelas_id')->merge($j->pluck('kelas_id'))->unique();

            return [
                'guru' => $g->nama, 'nip' => $g->nip ?: '-', 'jp' => (int) $p->sum('alokasi_jp'), 'sesi' => $j->count(), 'rombel' => $kelasGuru->count(),
                'mapel_daftar' => $mapelIds->map(fn ($id) => $mapel[$id] ?? '-')->sort()->implode(', ') ?: '-',
                'kelengkapan' => $this->persen($r->sum('nilai_diinput'), $r->sum('total_seharusnya')),
                'verifikasi' => $ada->isEmpty() ? '-' : $ada->filter(fn ($x) => $disetujui->has("{$x['kelas']['id']}|{$x['mata_pelajaran']['id']}"))->count().' / '.$ada->count(),
                'progres' => $this->persen($selesai, $rencana),
                'menggantikan' => $pengganti->where('guru_pengganti_id', $g->id)->count(), 'digantikan' => $pengganti->where('guru_berhalangan_id', $g->id)->count(),
                '_aktif' => $p->isNotEmpty() || $j->isNotEmpty() || $r->isNotEmpty(),
            ];
        });

        $aktif = $daftar->where('_aktif', true);
        $tabel = fn ($d) => $d->map(fn ($r) => collect($r)->except('_aktif')->all());

        return [
            'ringkasan' => [
                $this->stat('Guru mengajar', $aktif->count(), 'Punya pembagian/jadwal/nilai pada filter ini'),
                $this->stat('Total beban JP', $aktif->sum('jp'), 'Pembagian Mata Pelajaran'),
                $this->stat('Rata-rata beban JP', $aktif->isEmpty() ? null : round($aktif->sum('jp') / $aktif->count(), 1), 'per guru mengajar'),
                $this->stat('Kelengkapan input nilai', $this->persen($rows->sum('nilai_diinput'), $rows->sum('total_seharusnya')), '%'),
                $this->stat('Penggantian disetujui', $pengganti->count(), 'Pada periode'),
            ],
            'catatan' => ['Beban mengajar dan jumlah rombel dari Pembagian Mata Pelajaran (aktif/draft) serta Jadwal Pelajaran. Kelengkapan nilai dan verifikasi mengikuti Monitoring Nilai; progres dari Program Semester yang guru isi. Guru tanpa penugasan ditampilkan di bagian bawah.'],
            'tabel' => [
                $this->tabel('guru', 'Rekap akademik per guru', [['guru', 'Guru'], ['nip', 'NIP'], ['jp', 'Beban JP', 'angka'], ['sesi', 'Sesi Jadwal', 'angka'], ['rombel', 'Rombel', 'angka'], ['mapel_daftar', 'Mata Pelajaran Diampu'], ['kelengkapan', 'Kelengkapan Nilai', 'persen'], ['verifikasi', 'Nilai Terverifikasi'], ['progres', 'Progres Pembelajaran', 'persen'], ['menggantikan', 'Menggantikan', 'angka'], ['digantikan', 'Digantikan', 'angka']], $tabel($aktif)),
                $this->tabel('guru_tanpa', 'Guru tanpa penugasan pada filter ini', [['guru', 'Guru'], ['nip', 'NIP']], $daftar->where('_aktif', false)->map(fn ($r) => ['guru' => $r['guru'], 'nip' => $r['nip']])),
            ],
        ];
    }

    // ================================================================ EXPORT

    private function nilaiSel(array $kolom, mixed $v): mixed
    {
        return match ($kolom['tipe']) {
            'persen' => $v === null ? '-' : $v,
            'angka', 'desimal' => $v ?? '-',
            default => $v === null || $v === '' ? '-' : $v,
        };
    }

    public function xlsx(array $laporan, string $sekolah): string
    {
        $k = $laporan['konteks'];
        $wb = new Spreadsheet;
        $ws = $wb->getActiveSheet();
        $ws->setTitle('Ringkasan');
        $ws->fromArray([[$sekolah], [$laporan['judul']], ['Tahun Ajaran', $k['tahun_ajaran']], ['Semester', ucfirst($k['semester'])], ['Periode', $k['periode']]], null, 'A1');
        foreach (['jenjang' => 'Jenjang', 'tingkat' => 'Tingkat', 'rombel' => 'Rombel', 'mata_pelajaran' => 'Mata Pelajaran', 'guru' => 'Guru'] as $key => $label) {
            if (! empty($k[$key])) {
                $ws->fromArray([[$label, $k[$key]]], null, 'A'.($ws->getHighestRow() + 1));
            }
        }
        $baris = $ws->getHighestRow() + 2;
        $ws->fromArray([['Ringkasan', 'Nilai', 'Keterangan']], null, 'A'.$baris);
        $ws->getStyle("A{$baris}:C{$baris}")->getFont()->setBold(true);
        foreach ($laporan['ringkasan'] as $s) {
            $baris++;
            $ws->fromArray([[$s['label'], $s['nilai'] ?? '-', $s['keterangan'] ?? '']], null, 'A'.$baris);
        }
        foreach ($laporan['catatan'] as $n) {
            $baris++;
            $ws->setCellValue('A'.($baris + 1), 'Catatan: '.$n);
            $baris++;
        }
        $ws->getStyle('A1:A2')->getFont()->setBold(true);
        foreach (['A', 'B', 'C'] as $col) {
            $ws->getColumnDimension($col)->setAutoSize(true);
        }

        $dipakai = ['Ringkasan'];
        foreach ($laporan['tabel'] as $t) {
            $nama = mb_substr(preg_replace('/[\\\\\/\?\*\[\]:]/u', ' ', $t['judul']), 0, 28);
            $asli = $nama;
            for ($i = 2; in_array($nama, $dipakai, true); $i++) {
                $nama = mb_substr($asli, 0, 26).' '.$i;
            }
            $dipakai[] = $nama;
            $sheet = $wb->createSheet();
            $sheet->setTitle($nama);
            $sheet->setCellValue('A1', $t['judul']);
            $sheet->getStyle('A1')->getFont()->setBold(true);
            $sheet->fromArray([array_column($t['kolom'], 'label')], null, 'A3');
            $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($t['kolom']));
            $sheet->getStyle("A3:{$lastCol}3")->getFont()->setBold(true);
            $r = 3;
            foreach ($t['baris'] as $row) {
                $r++;
                $sheet->fromArray([array_map(fn ($kol) => $this->nilaiSel($kol, $row[$kol['key']] ?? null), $t['kolom'])], null, 'A'.$r);
            }
            foreach ($t['kolom'] as $i => $kol) {
                $sheet->getColumnDimensionByColumn($i + 1)->setAutoSize(true);
                if ($kol['tipe'] === 'persen' && $r > 3) {
                    $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
                    $sheet->getStyle("{$col}4:{$col}{$r}")->getNumberFormat()->setFormatCode('0"%"');
                }
            }
        }
        $wb->setActiveSheetIndex(0);

        ob_start();
        (new Xlsx($wb))->save('php://output');

        return (string) ob_get_clean();
    }
}

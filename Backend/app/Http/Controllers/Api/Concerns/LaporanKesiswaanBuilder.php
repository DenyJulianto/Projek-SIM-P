<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Absensi;
use App\Models\CatatanSiswa;
use App\Models\Ekskul;
use App\Models\EkskulAnggota;
use App\Models\EkskulPenilaian;
use App\Models\EkskulPresensi;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MutasiSiswa;
use App\Models\Pelanggaran;
use App\Models\PpdbJalur;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use App\Models\Prestasi;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

/** Penyusun isi laporan kesiswaan. Semua laporan memakai bentuk seragam {ringkasan, catatan, tabel}. */
trait LaporanKesiswaanBuilder
{
    /** Kolom yang dapat dipilih/diurutkan pada tabel utama ("data") tiap laporan. */
    public const KOLOM = [
        'siswa' => [
            ['nis', 'NIS'], ['nisn', 'NISN'], ['nama', 'Nama Siswa'], ['jenis_kelamin', 'Jenis Kelamin'], ['ttl', 'Tempat/Tanggal Lahir'], ['kelas', 'Kelas'], ['rombel', 'Rombel'],
            ['alamat', 'Alamat'], ['orang_tua', 'Nama Orang Tua/Wali'], ['kontak', 'Nomor Kontak'], ['status', 'Status Siswa'], ['tahun_masuk', 'Tahun Masuk'],
        ],
        'kelas' => [
            ['tingkat', 'Tingkat'], ['jenjang', 'Jenjang'], ['rombel', 'Rombel'], ['wali', 'Wali Kelas'], ['ruang', 'Ruang'], ['kapasitas', 'Kapasitas'], ['jumlah', 'Jumlah Siswa'],
            ['laki', 'Laki-laki'], ['perempuan', 'Perempuan'], ['sisa', 'Sisa Kapasitas'], ['terisi', 'Terisi'], ['status', 'Status Kelas'],
        ],
        'mutasi' => [
            ['tanggal_tampil', 'Tanggal'], ['nama', 'Nama Siswa'], ['nis', 'NIS'], ['nisn', 'NISN'], ['kelas', 'Kelas'], ['jenis_label', 'Jenis Mutasi'], ['asal', 'Asal Sekolah/Kelas'],
            ['tujuan', 'Tujuan Sekolah/Kelas'], ['alasan', 'Alasan'], ['status', 'Status'], ['keterangan', 'Keterangan'], ['sumber', 'Sumber Data'],
        ],
    ];

    private const TIPE_KOLOM = ['nisn' => 'teks', 'kapasitas' => 'angka', 'jumlah' => 'angka', 'laki' => 'angka', 'perempuan' => 'angka', 'sisa' => 'angka', 'terisi' => 'persen'];

    private const STATUS_SISWA = ['aktif' => 'Aktif', 'lulus' => 'Lulus', 'pindah' => 'Pindah', 'keluar' => 'Keluar'];

    private const JENIS_MUTASI = ['masuk' => 'Siswa Masuk', 'keluar' => 'Siswa Keluar', 'pindah_sekolah' => 'Pindah Sekolah', 'pindah_kelas' => 'Pindah Kelas/Rombel'];

    private const BULAN = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];

    // ----------------------------------------------------------------- konteks

    protected function ctx(Request $request): array
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'], 'semester' => ['nullable', 'in:ganjil,genap'],
            'dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'jenjang' => ['nullable', 'string', 'max:20'], 'tingkat' => ['nullable', 'string', 'max:20'], 'kelas_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'string', 'max:30'], 'search' => ['nullable', 'string', 'max:100'],
            'kolom' => ['nullable', 'string', 'max:300'], 'urut' => ['nullable', 'string', 'max:30'], 'arah' => ['nullable', 'in:asc,desc'],
            'jalur_id' => ['nullable', 'integer'], 'jenis_mutasi' => ['nullable', 'in:masuk,keluar,pindah_sekolah,pindah_kelas'], 'siswa_id' => ['nullable', 'integer'],
            'ambang' => ['nullable', 'integer', 'between:1,100'], 'rekap' => ['nullable', 'in:harian,bulanan,semester,siswa,kelas'],
            'tanggal_laporan' => ['nullable', 'date'], 'logo' => ['nullable', 'boolean'], 'ttd' => ['nullable', 'boolean'],
        ]);
        $ta = TahunAjaran::findOrFail($in['tahun_ajaran_id']);
        $semester = $in['semester'] ?? null;
        $sem = $semester ? Semester::where('tahun_ajaran_id', $ta->id)->whereRaw('lower(nama) = ?', [$semester])->first() : null;

        $kelas = Kelas::where(fn ($q) => $q->where('tahun_ajaran', $ta->nama)->orWhere('tahun_ajaran_id', $ta->id))
            ->when(! empty($in['jenjang']), fn ($q) => $q->where('jenjang', $in['jenjang']))->when(! empty($in['tingkat']), fn ($q) => $q->where('tingkat', $in['tingkat']))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->whereKey($in['kelas_id']))->orderBy('nama_kelas')->get()->keyBy('id');

        return $in + [
            'ta' => $ta, 'semester_pilih' => $semester, 'kelas' => $kelas,
            'filter_kelas' => ! empty($in['jenjang']) || ! empty($in['tingkat']) || ! empty($in['kelas_id']),
            'dari' => $in['dari'] ?? substr((string) ($sem->tanggal_mulai ?? $ta->tanggal_mulai), 0, 10),
            'sampai' => $in['sampai'] ?? substr((string) ($sem->tanggal_selesai ?? $ta->tanggal_selesai), 0, 10),
            'periode_bawaan' => empty($in['dari']) && empty($in['sampai']),
        ];
    }

    protected function labelKonteks(array $c): array
    {
        return [
            'tahun_ajaran_id' => $c['ta']->id, 'tahun_ajaran' => $c['ta']->nama, 'semester' => $c['semester_pilih'] ?? 'semua',
            'periode' => Carbon::parse($c['dari'])->format('d/m/Y').' – '.Carbon::parse($c['sampai'])->format('d/m/Y'),
            'jenjang' => $c['jenjang'] ?? null, 'tingkat' => $c['tingkat'] ?? null, 'rombel' => ! empty($c['kelas_id']) ? ($c['kelas'][(int) $c['kelas_id']]->nama_kelas ?? null) : null,
            'dibuat' => now()->toDateTimeString(),
        ];
    }

    protected function stat(string $label, mixed $nilai, ?string $ket = null): array
    {
        return ['label' => $label, 'nilai' => $nilai, 'keterangan' => $ket];
    }

    /** @param list<array{0: string, 1: string, 2?: string}> $kolom */
    protected function tabel(string $id, string $judul, array $kolom, iterable $baris, ?string $ket = null): array
    {
        return ['id' => $id, 'judul' => $judul, 'keterangan' => $ket, 'kolom' => array_map(fn ($k) => ['key' => $k[0], 'label' => $k[1], 'tipe' => $k[2] ?? 'teks'], $kolom), 'baris' => collect($baris)->values()->all()];
    }

    protected function persen(int|float $a, int|float $b): ?int
    {
        return $b > 0 ? (int) round($a / $b * 100) : null;
    }

    /** Terapkan pilihan kolom (urutan sesuai pilihan) pada tabel utama "data". */
    protected function pilihKolom(array $tabel, ?string $kolom, string $jenis): array
    {
        $kunci = array_values(array_filter(array_map('trim', explode(',', (string) $kolom))));
        if (! $kunci || ! isset(self::KOLOM[$jenis])) {
            return $tabel;
        }
        foreach ($tabel as $i => $t) {
            if ($t['id'] !== 'data') {
                continue;
            }
            $peta = collect($t['kolom'])->keyBy('key');
            $dipilih = collect($kunci)->filter(fn ($k) => $peta->has($k))->map(fn ($k) => $peta[$k])->values()->all();
            if ($dipilih) {
                $tabel[$i]['kolom'] = $dipilih;
            }
        }

        return $tabel;
    }

    private function kolomTabel(string $jenis): array
    {
        return array_map(fn ($k) => [$k[0], $k[1], self::TIPE_KOLOM[$k[0]] ?? 'teks'], self::KOLOM[$jenis]);
    }

    private function urut(Collection $baris, array $c, array $peta, string $bawaan): Collection
    {
        $kunci = (array) ($peta[$c['urut'] ?? ''] ?? $peta[$bawaan]);
        $turun = ($c['arah'] ?? 'asc') === 'desc';

        return $baris->sort(function ($x, $y) use ($kunci, $turun) {
            foreach ($kunci as $k) {
                $p = $x[$k] ?? '';
                $q = $y[$k] ?? '';
                $cmp = is_numeric($p) && is_numeric($q) ? $p <=> $q : strnatcasecmp((string) $p, (string) $q);
                if ($cmp !== 0) {
                    return $turun ? -$cmp : $cmp;
                }
            }

            return 0;
        })->values();
    }

    // ==================================================================== DATA SISWA

    protected function laporanSiswa(array $c): array
    {
        $kelasIds = $c['kelas']->keys();
        $q = Siswa::with('kelas:id,nama_kelas,tingkat')->whereIn('kelas_id', $kelasIds)
            ->when(! empty($c['status']), fn ($w) => $w->where('status', $c['status']))
            ->when(! empty($c['search']), fn ($w) => $w->where(fn ($x) => $x->where('nama', 'like', '%'.$c['search'].'%')->orWhere('nis', 'like', '%'.$c['search'].'%')->orWhere('nisn', 'like', '%'.$c['search'].'%')));
        $siswa = $q->get();
        $ids = $siswa->pluck('id');

        $wali = DB::table('wali_siswa')->join('users', 'users.id', '=', 'wali_siswa.user_id')->whereIn('siswa_id', $ids)->get(['siswa_id', 'hubungan', 'users.name as nama', 'users.phone'])->groupBy('siswa_id');
        $ppdb = PpdbPendaftar::whereIn('siswa_id', $ids)->get()->keyBy('siswa_id');

        $baris = $siswa->map(function (Siswa $s) use ($wali, $ppdb) {
            $w = $wali->get($s->id, collect());
            $p = $ppdb->get($s->id);
            $ortu = $w->isNotEmpty() ? $w->map(fn ($x) => $x->nama.' ('.ucfirst($x->hubungan).')')->implode('; ')
                : ($p ? collect([$p->nama_ayah ? 'Ayah: '.$p->nama_ayah : null, $p->nama_ibu ? 'Ibu: '.$p->nama_ibu : null, $p->nama_wali ? 'Wali: '.$p->nama_wali : null])->filter()->implode('; ') : '');
            $kontak = $w->isNotEmpty() ? $w->pluck('phone')->filter()->unique()->implode('; ') : ($p ? collect([$p->telepon_orang_tua, $p->no_hp])->filter()->unique()->implode('; ') : '');

            return [
                'nis' => $s->nis, 'nisn' => $s->nisn ?: '-', 'nama' => $s->nama, 'jenis_kelamin' => $s->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
                'ttl' => trim(($s->tempat_lahir ?: '-').', '.($s->tanggal_lahir ? Carbon::parse($s->tanggal_lahir)->format('d/m/Y') : '-')), 'kelas' => $s->kelas?->tingkat ?? '-', 'rombel' => $s->kelas?->nama_kelas ?? '-',
                'alamat' => $s->alamat ?: '-', 'orang_tua' => $ortu ?: '-', 'kontak' => $kontak ?: '-', 'status' => self::STATUS_SISWA[$s->status] ?? $s->status, 'tahun_masuk' => $s->tahun_masuk ?: '-',
                'jk_kode' => $s->jenis_kelamin, 'status_kode' => $s->status,
            ];
        });
        $baris = $this->urut($baris, $c, ['nama' => ['nama'], 'nis' => ['nis'], 'rombel' => ['rombel', 'nama'], 'kelas' => ['kelas', 'rombel', 'nama'], 'jenis_kelamin' => ['jenis_kelamin', 'nama'], 'status' => ['status', 'nama']], 'rombel');

        $perRombel = $baris->groupBy('rombel')->map(fn (Collection $g, $r) => ['rombel' => $r, 'jumlah' => $g->count(), 'laki' => $g->where('jk_kode', 'L')->count(), 'perempuan' => $g->where('jk_kode', 'P')->count()])->sortKeys(SORT_NATURAL)->values();

        $catatan = $baris->isEmpty() ? ['Tidak ada siswa yang sesuai filter. Laporan memuat siswa pada rombel tahun ajaran terpilih.'] : ['Nama orang tua/wali dan kontak diambil dari akun wali siswa; bila belum ada, dari data PPDB siswa tersebut.'];

        return [
            'ringkasan' => [
                $this->stat('Jumlah siswa', $baris->count()), $this->stat('Laki-laki', $baris->where('jk_kode', 'L')->count()), $this->stat('Perempuan', $baris->where('jk_kode', 'P')->count()),
                $this->stat('Aktif', $baris->where('status_kode', 'aktif')->count()), $this->stat('Keluar/Pindah', $baris->whereIn('status_kode', ['keluar', 'pindah'])->count()),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('data', 'Data siswa', $this->kolomTabel('siswa'), $baris),
                $this->tabel('rekap_rombel', 'Rekap per rombel', [['rombel', 'Rombel'], ['jumlah', 'Jumlah', 'angka'], ['laki', 'Laki-laki', 'angka'], ['perempuan', 'Perempuan', 'angka']], $perRombel),
            ],
        ];
    }

    // ======================================================================== PPDB

    protected function laporanPpdb(array $c): array
    {
        $periode = PpdbPeriode::where('tahun_ajaran_id', $c['ta']->id)->orderBy('id')->get();
        if ($periode->isEmpty()) {
            return ['ringkasan' => [], 'catatan' => ['Belum ada PPDB pada tahun ajaran ini. Data diambil dari menu PPDB.'], 'tabel' => []];
        }
        $jalur = PpdbJalur::whereIn('ppdb_periode_id', $periode->pluck('id'))->when(! empty($c['jalur_id']), fn ($q) => $q->whereKey($c['jalur_id']))->get()->keyBy('id');
        $semua = PpdbPendaftar::whereIn('ppdb_periode_id', $periode->pluck('id'))->whereIn('ppdb_jalur_id', $jalur->keys())->get();
        $aktif = $semua->where('status_pendaftaran', 'terdaftar');

        $status = $c['status'] ?? null;
        $terpilih = match ($status) {
            'terverifikasi' => $aktif->where('status_verifikasi', 'diverifikasi'), 'belum_diverifikasi' => $aktif->whereIn('status_verifikasi', ['belum', 'perlu_perbaikan']),
            'ditolak' => $aktif->where('status_verifikasi', 'ditolak'), 'lolos' => $aktif->where('status_seleksi', 'lolos'), 'tidak_lolos' => $aktif->where('status_seleksi', 'tidak_lolos'),
            'sudah_daftar_ulang' => $aktif->where('status_daftar_ulang', 'sudah'), 'belum_daftar_ulang' => $aktif->where('status_seleksi', 'lolos')->where('status_daftar_ulang', 'belum'),
            'diterima' => $aktif->where('status_penerimaan', 'diterima'), 'dibatalkan' => $semua->where('status_pendaftaran', 'dibatalkan'), default => $aktif,
        };

        $hitung = fn (Collection $g) => [
            'pendaftar' => $g->count(), 'terverifikasi' => $g->where('status_verifikasi', 'diverifikasi')->count(), 'ditolak' => $g->where('status_verifikasi', 'ditolak')->count(),
            'lolos' => $g->where('status_seleksi', 'lolos')->count(), 'tidak_lolos' => $g->where('status_seleksi', 'tidak_lolos')->count(),
            'daftar_ulang' => $g->where('status_daftar_ulang', 'sudah')->count(), 'diterima' => $g->where('status_penerimaan', 'diterima')->count(),
        ];
        $kolomRekap = [['pendaftar', 'Pendaftar', 'angka'], ['terverifikasi', 'Terverifikasi', 'angka'], ['ditolak', 'Ditolak Verifikasi', 'angka'], ['lolos', 'Lolos', 'angka'], ['tidak_lolos', 'Tidak Lolos', 'angka'], ['daftar_ulang', 'Sudah Daftar Ulang', 'angka'], ['diterima', 'Diterima', 'angka']];

        $perJalur = $jalur->map(fn (PpdbJalur $j) => ['jalur' => $j->nama, 'kuota' => $j->kuota] + $hitung($aktif->where('ppdb_jalur_id', $j->id)))->values();
        $perPeriode = $periode->map(fn (PpdbPeriode $p) => ['periode' => $p->nama, 'jadwal' => Carbon::parse($p->tanggal_mulai)->format('d/m/Y').' – '.Carbon::parse($p->tanggal_selesai)->format('d/m/Y'), 'status' => ucfirst(str_replace('_', ' ', $p->status)), 'kuota' => $p->kuota] + $hitung($aktif->where('ppdb_periode_id', $p->id)))->values();
        $asal = $terpilih->groupBy(fn ($p) => $p->sekolah_asal ?: 'Tidak diisi')->map(fn (Collection $g, $n) => ['sekolah' => $n, 'jumlah' => $g->count(), 'lolos' => $g->where('status_seleksi', 'lolos')->count(), 'diterima' => $g->where('status_penerimaan', 'diterima')->count()])->sortByDesc('jumlah')->values();
        $jk = collect(['L' => 'Laki-laki', 'P' => 'Perempuan'])->map(fn ($l, $k) => ['jk' => $l] + $hitung($terpilih->where('jenis_kelamin', $k)))->values();

        $label = ['belum' => 'Belum diputuskan', 'lolos' => 'Lolos', 'tidak_lolos' => 'Tidak lolos'];
        $hasil = $terpilih->sortBy([['ppdb_jalur_id', 'asc'], ['skor', 'desc']])->map(fn (PpdbPendaftar $p) => [
            'nomor' => $p->nomor_pendaftaran, 'nama' => $p->nama_lengkap, 'jalur' => $jalur[$p->ppdb_jalur_id]->nama ?? '-', 'sekolah' => $p->sekolah_asal ?: '-', 'skor' => $p->skor,
            'verifikasi' => ['belum' => 'Belum', 'diverifikasi' => 'Terverifikasi', 'perlu_perbaikan' => 'Perlu perbaikan', 'ditolak' => 'Ditolak'][$p->status_verifikasi], 'seleksi' => $label[$p->status_seleksi],
        ]);
        $daftarUlang = $terpilih->where('status_seleksi', 'lolos')->map(fn (PpdbPendaftar $p) => [
            'nomor' => $p->nomor_pendaftaran, 'nama' => $p->nama_lengkap, 'jalur' => $jalur[$p->ppdb_jalur_id]->nama ?? '-',
            'status' => ['belum' => 'Belum daftar ulang', 'sudah' => 'Sudah daftar ulang', 'dibatalkan' => 'Dibatalkan'][$p->status_daftar_ulang], 'tanggal' => $p->tanggal_daftar_ulang?->format('d/m/Y') ?? '-',
            'diterima' => $p->status_penerimaan === 'diterima' ? 'Diterima'.($p->nis_terbit ? " (NIS {$p->nis_terbit})" : '') : '-',
        ])->values();

        $r = $hitung($aktif);
        $catatan = ['Data diambil langsung dari menu PPDB; tidak ada input ulang.'];
        if ($status) {
            $catatan[] = 'Daftar dan rekap asal sekolah/jenis kelamin dibatasi pada status “'.str_replace('_', ' ', $status).'”; rekap per jalur dan per periode tetap menampilkan seluruh pendaftar.';
        }

        return [
            'ringkasan' => [
                $this->stat('Jumlah pendaftar', $r['pendaftar'], $semua->where('status_pendaftaran', 'dibatalkan')->count().' dibatalkan'), $this->stat('Terverifikasi', $r['terverifikasi']), $this->stat('Lolos seleksi', $r['lolos']),
                $this->stat('Tidak lolos', $r['tidak_lolos']), $this->stat('Sudah daftar ulang', $r['daftar_ulang']), $this->stat('Peserta diterima', $r['diterima'], 'kuota '.$periode->sum('kuota')),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('per_jalur', 'Rekap pendaftar per jalur', array_merge([['jalur', 'Jalur'], ['kuota', 'Kuota', 'angka']], $kolomRekap), $perJalur),
                $this->tabel('per_periode', 'Rekap per periode PPDB', array_merge([['periode', 'PPDB'], ['jadwal', 'Pendaftaran'], ['status', 'Status'], ['kuota', 'Kuota', 'angka']], $kolomRekap), $perPeriode),
                $this->tabel('asal_sekolah', 'Asal sekolah pendaftar', [['sekolah', 'Asal Sekolah'], ['jumlah', 'Pendaftar', 'angka'], ['lolos', 'Lolos', 'angka'], ['diterima', 'Diterima', 'angka']], $asal),
                $this->tabel('jenis_kelamin', 'Pendaftar menurut jenis kelamin', array_merge([['jk', 'Jenis Kelamin']], $kolomRekap), $jk),
                $this->tabel('hasil_seleksi', 'Rekap hasil seleksi', [['nomor', 'No. Pendaftaran'], ['nama', 'Nama'], ['jalur', 'Jalur'], ['sekolah', 'Asal Sekolah'], ['skor', 'Skor', 'desimal'], ['verifikasi', 'Verifikasi'], ['seleksi', 'Hasil Seleksi']], $hasil),
                $this->tabel('daftar_ulang', 'Rekap daftar ulang & penerimaan (peserta lolos)', [['nomor', 'No. Pendaftaran'], ['nama', 'Nama'], ['jalur', 'Jalur'], ['status', 'Daftar Ulang'], ['tanggal', 'Tanggal'], ['diterima', 'Penerimaan']], $daftarUlang),
            ],
        ];
    }

    // ================================================================= KELAS & ROMBEL

    protected function laporanKelas(array $c): array
    {
        $guru = Guru::pluck('nama', 'id');
        $siswa = Siswa::where('status', 'aktif')->whereIn('kelas_id', $c['kelas']->keys())->get(['id', 'kelas_id', 'jenis_kelamin'])->groupBy('kelas_id');

        $baris = $c['kelas']->map(function (Kelas $k) use ($siswa, $guru) {
            $g = $siswa->get($k->id, collect());
            $jumlah = $g->count();

            return [
                'tingkat' => $k->tingkat ?: '-', 'jenjang' => $k->jenjang ?: '-', 'rombel' => $k->nama_kelas, 'wali' => $k->wali_kelas_id ? ($guru[$k->wali_kelas_id] ?? '-') : '-', 'ruang' => $k->ruang_kelas ?: '-',
                'kapasitas' => $k->kapasitas, 'jumlah' => $jumlah, 'laki' => $g->where('jenis_kelamin', 'L')->count(), 'perempuan' => $g->where('jenis_kelamin', 'P')->count(),
                'sisa' => $k->kapasitas !== null ? $k->kapasitas - $jumlah : null, 'terisi' => $k->kapasitas ? $this->persen($jumlah, $k->kapasitas) : null, 'status' => ucfirst((string) ($k->status ?? 'aktif')),
            ];
        })->values();
        $baris = $this->urut($baris, $c, ['tingkat' => ['tingkat', 'rombel'], 'rombel' => ['rombel'], 'jumlah' => ['jumlah'], 'kapasitas' => ['kapasitas']], 'tingkat');

        $perTingkat = $baris->groupBy('tingkat')->map(fn (Collection $g, $t) => [
            'tingkat' => $t, 'rombel' => $g->count(), 'kapasitas' => $g->whereNotNull('kapasitas')->sum('kapasitas'), 'jumlah' => $g->sum('jumlah'), 'laki' => $g->sum('laki'), 'perempuan' => $g->sum('perempuan'),
            'sisa' => $g->whereNotNull('sisa')->sum('sisa'), 'terisi' => $this->persen($g->whereNotNull('kapasitas')->sum('jumlah'), $g->whereNotNull('kapasitas')->sum('kapasitas')),
        ])->sortKeys(SORT_NATURAL)->values();

        $kapTotal = $baris->whereNotNull('kapasitas')->sum('kapasitas');

        return [
            'ringkasan' => [
                $this->stat('Jumlah rombel', $baris->count()), $this->stat('Jumlah siswa aktif', $baris->sum('jumlah')), $this->stat('Laki-laki', $baris->sum('laki')), $this->stat('Perempuan', $baris->sum('perempuan')),
                $this->stat('Total kapasitas', $kapTotal ?: null, 'rombel yang mengisi kapasitas'), $this->stat('Sisa kapasitas', $baris->whereNotNull('sisa')->sum('sisa')),
                $this->stat('Rombel penuh/melebihi', $baris->filter(fn ($r) => $r['sisa'] !== null && $r['sisa'] <= 0)->count()),
            ],
            'catatan' => ['Data dari menu Kelas & Rombel. Jumlah siswa hanya menghitung siswa berstatus aktif; sisa kapasitas negatif berarti rombel melebihi kapasitas.'],
            'tabel' => [
                $this->tabel('data', 'Daftar rombel', $this->kolomTabel('kelas'), $baris),
                $this->tabel('rekap_tingkat', 'Rekap kapasitas dan jumlah siswa per tingkat', [['tingkat', 'Tingkat'], ['rombel', 'Rombel', 'angka'], ['kapasitas', 'Kapasitas', 'angka'], ['jumlah', 'Siswa', 'angka'], ['laki', 'L', 'angka'], ['perempuan', 'P', 'angka'], ['sisa', 'Sisa Kapasitas', 'angka'], ['terisi', 'Terisi', 'persen']], $perTingkat),
            ],
        ];
    }

    // ======================================================================= MUTASI

    protected function laporanMutasi(array $c): array
    {
        $siswaKelas = Siswa::whereIn('kelas_id', $c['kelas']->keys())->pluck('id')->flip();
        $lolosKelas = fn ($sid) => ! $c['filter_kelas'] || $siswaKelas->has($sid);
        $kelasNama = Kelas::pluck('nama_kelas', 'id');
        $rows = collect();

        // 1) Register mutasi (masuk pindahan, keluar, pindah sekolah).
        $register = MutasiSiswa::with('siswa:id,nama,nis,nisn')->whereBetween('tanggal', [$c['dari'], $c['sampai']])->get();
        foreach ($register as $m) {
            if (! $m->siswa || ! $lolosKelas($m->siswa_id)) {
                continue;
            }
            $rows->push([
                'tanggal' => substr((string) $m->tanggal, 0, 10), 'nama' => $m->siswa->nama, 'nis' => $m->siswa->nis, 'nisn' => $m->siswa->nisn ?: '-', 'kelas' => $kelasNama[$m->kelas_id] ?? '-',
                'jenis' => $m->jenis, 'asal' => $m->asal_sekolah ?: '-', 'tujuan' => $m->tujuan_sekolah ?: '-', 'alasan' => $m->alasan ?: '-', 'status' => $m->status === 'tercatat' ? 'Tercatat' : 'Dibatalkan',
                'keterangan' => $m->status === 'dibatalkan' ? 'Dibatalkan: '.$m->alasan_batal : ($m->keterangan ?: '-'), 'sumber' => 'Register Mutasi', '_mutasi_id' => $m->id, '_siswa_id' => $m->siswa_id, '_nomor_surat' => $m->nomor_surat, '_batal' => $m->status === 'dibatalkan',
            ]);
        }

        // 2) Siswa masuk lewat PPDB (diimpor ke Data Siswa) — dibaca dari menu PPDB.
        $ppdb = PpdbPendaftar::whereNotNull('siswa_id')->whereNotNull('tanggal_import')->whereBetween(DB::raw('date(tanggal_import)'), [$c['dari'], $c['sampai']])->get();
        $siswaPpdb = Siswa::whereIn('id', $ppdb->pluck('siswa_id'))->get()->keyBy('id');
        foreach ($ppdb as $p) {
            $s = $siswaPpdb[$p->siswa_id] ?? null;
            if (! $s || ! $lolosKelas($s->id)) {
                continue;
            }
            $rows->push([
                'tanggal' => $p->tanggal_import->toDateString(), 'nama' => $s->nama, 'nis' => $s->nis, 'nisn' => $s->nisn ?: '-', 'kelas' => $kelasNama[$s->kelas_id] ?? '-', 'jenis' => 'masuk',
                'asal' => $p->sekolah_asal ?: '-', 'tujuan' => tenant()->nama_sekolah ?: '-', 'alasan' => 'Penerimaan peserta didik baru (PPDB)', 'status' => 'Tercatat', 'keterangan' => 'No. pendaftaran '.$p->nomor_pendaftaran, 'sumber' => 'PPDB',
            ]);
        }

        // 3) Pindah rombel — dari riwayat menu Kelas & Rombel.
        $nisMap = Siswa::pluck('id', 'nis');
        $nisInfo = Siswa::get(['nis', 'nama', 'nisn', 'id'])->keyBy('nis');
        $pindah = Activity::where('subject_type', Kelas::class)->where('event', 'siswa_dipindah_keluar')->whereBetween(DB::raw('date(created_at)'), [$c['dari'], $c['sampai']])->get();
        foreach ($pindah as $a) {
            preg_match('/rombel "(.+)"\.$/', (string) $a->description, $m);
            foreach (($a->properties['siswa'] ?? []) as $sw) {
                $s = $nisInfo[$sw['nis']] ?? null;
                if ($s && ! $lolosKelas($s->id)) {
                    continue;
                }
                $rows->push([
                    'tanggal' => $a->created_at->toDateString(), 'nama' => $sw['nama'], 'nis' => $sw['nis'], 'nisn' => $s?->nisn ?: '-', 'kelas' => $kelasNama[$a->subject_id] ?? '-', 'jenis' => 'pindah_kelas',
                    'asal' => 'Rombel '.($kelasNama[$a->subject_id] ?? '-'), 'tujuan' => 'Rombel '.($m[1] ?? '-'), 'alasan' => '-', 'status' => 'Tercatat', 'keterangan' => 'Dari riwayat Kelas & Rombel', 'sumber' => 'Kelas & Rombel',
                ]);
            }
        }
        unset($nisMap);

        $cari = mb_strtolower(trim((string) ($c['search'] ?? '')));
        $rows = $rows
            ->when(! empty($c['jenis_mutasi']), fn ($x) => $x->where('jenis', $c['jenis_mutasi']))
            ->when(! empty($c['status']), fn ($x) => $x->where('status', ucfirst($c['status'])))
            ->when($cari !== '', fn ($x) => $x->filter(fn ($r) => str_contains(mb_strtolower($r['nama'].' '.$r['nis'].' '.$r['nisn'].' '.$r['asal'].' '.$r['tujuan']), $cari)))
            ->map(fn ($r) => $r + ['tanggal_tampil' => Carbon::parse($r['tanggal'])->format('d/m/Y'), 'jenis_label' => self::JENIS_MUTASI[$r['jenis']]]);
        $rows = $this->urut($rows, $c + ['urut' => $c['urut'] ?? 'tanggal', 'arah' => $c['arah'] ?? 'desc'], ['tanggal' => ['tanggal', 'nama'], 'nama' => ['nama'], 'jenis' => ['jenis', 'tanggal']], 'tanggal');

        $aktifRows = $rows->where('status', 'Tercatat');
        $perJenis = collect(self::JENIS_MUTASI)->map(fn ($l, $k) => ['jenis' => $l, 'jumlah' => $aktifRows->where('jenis', $k)->count()])->values();
        $masuk = $aktifRows->where('jenis', 'masuk')->groupBy('asal')->map(fn (Collection $g, $a) => ['asal' => $a, 'jumlah' => $g->count(), 'sumber' => $g->pluck('sumber')->unique()->implode(', ')])->sortByDesc('jumlah')->values();
        $keluar = $aktifRows->whereIn('jenis', ['keluar', 'pindah_sekolah'])->map(fn ($r) => ['jenis' => $r['jenis_label'], 'tujuan' => $r['tujuan'], 'alasan' => $r['alasan']])->groupBy(fn ($r) => $r['jenis'].'|'.$r['tujuan'].'|'.$r['alasan'])->map(fn (Collection $g) => $g->first() + ['jumlah' => $g->count()])->values();
        $perBulan = $aktifRows->groupBy(fn ($r) => substr($r['tanggal'], 0, 7))->sortKeys()->map(fn (Collection $g, $k) => [
            'bulan' => self::BULAN[(int) substr($k, 5, 2)].' '.substr($k, 0, 4), 'masuk' => $g->where('jenis', 'masuk')->count(), 'keluar' => $g->whereIn('jenis', ['keluar', 'pindah_sekolah'])->count(), 'pindah_kelas' => $g->where('jenis', 'pindah_kelas')->count(),
        ])->values();

        $belumTercatat = Siswa::whereIn('status', ['keluar', 'pindah'])->whereNotIn('id', MutasiSiswa::whereIn('jenis', ['keluar', 'pindah_sekolah'])->where('status', 'tercatat')->pluck('siswa_id'))->count();
        $catatan = ['Sumber data: Register Mutasi (dicatat di sini), PPDB (siswa masuk), dan riwayat Kelas & Rombel (pindah rombel) — tidak ada input ganda.'];
        if ($belumTercatat > 0) {
            $catatan[] = "{$belumTercatat} siswa berstatus Keluar/Pindah di Data Siswa belum memiliki catatan mutasi. Catat mutasinya agar muncul di laporan ini beserta tanggal dan alasannya.";
        }

        return [
            'ringkasan' => [
                $this->stat('Siswa masuk', $aktifRows->where('jenis', 'masuk')->count()), $this->stat('Siswa keluar', $aktifRows->where('jenis', 'keluar')->count()),
                $this->stat('Pindah sekolah', $aktifRows->where('jenis', 'pindah_sekolah')->count()), $this->stat('Pindah rombel', $aktifRows->where('jenis', 'pindah_kelas')->count()),
            ],
            'catatan' => $catatan,
            'tabel' => [
                $this->tabel('data', 'Daftar mutasi siswa', $this->kolomTabel('mutasi'), $rows),
                $this->tabel('rekap_jenis', 'Rekap menurut jenis mutasi', [['jenis', 'Jenis Mutasi'], ['jumlah', 'Jumlah', 'angka']], $perJenis),
                $this->tabel('rekap_masuk', 'Rekap siswa masuk menurut asal sekolah', [['asal', 'Asal Sekolah'], ['jumlah', 'Jumlah', 'angka'], ['sumber', 'Sumber']], $masuk),
                $this->tabel('rekap_keluar', 'Rekap siswa keluar/pindah sekolah', [['jenis', 'Jenis'], ['tujuan', 'Tujuan Sekolah'], ['alasan', 'Alasan'], ['jumlah', 'Jumlah', 'angka']], $keluar),
                $this->tabel('rekap_bulan', 'Rekap per bulan', [['bulan', 'Bulan'], ['masuk', 'Masuk', 'angka'], ['keluar', 'Keluar/Pindah Sekolah', 'angka'], ['pindah_kelas', 'Pindah Rombel', 'angka']], $perBulan),
            ],
        ];
    }

    // ===================================================================== KEHADIRAN

    protected function laporanKehadiran(array $c): array
    {
        $ambang = (int) ($c['ambang'] ?? 75);
        $rekap = $c['rekap'] ?? 'siswa';
        $siswa = Siswa::with('kelas:id,nama_kelas')->whereIn('kelas_id', $c['kelas']->keys())->when(! empty($c['search']), fn ($q) => $q->where(fn ($w) => $w->where('nama', 'like', '%'.$c['search'].'%')->orWhere('nis', 'like', '%'.$c['search'].'%')))->get()->keyBy('id');
        $absen = Absensi::whereIn('siswa_id', $siswa->keys())->whereBetween('tanggal', [$c['dari'], $c['sampai']])->get(['siswa_id', 'tanggal', 'status']);

        $h = fn (Collection $g) => ['hadir' => $g->where('status', 'hadir')->count(), 'sakit' => $g->where('status', 'sakit')->count(), 'izin' => $g->where('status', 'izin')->count(), 'alpa' => $g->where('status', 'alpha')->count(), 'total' => $g->count()];
        $kolom = [['hadir', 'Hadir', 'angka'], ['sakit', 'Sakit', 'angka'], ['izin', 'Izin', 'angka'], ['alpa', 'Alpa', 'angka'], ['total', 'Total', 'angka'], ['persen', '% Hadir', 'persen']];
        $baris = fn (Collection $g, array $awal) => $awal + $h($g) + ['persen' => $this->persen($g->where('status', 'hadir')->count(), $g->count())];

        $perSiswa = $siswa->map(fn (Siswa $s) => $baris($absen->where('siswa_id', $s->id), ['nama' => $s->nama, 'nis' => $s->nis, 'rombel' => $s->kelas?->nama_kelas ?? '-']))->sortBy([['rombel', 'asc'], ['nama', 'asc']])->values();
        $rendah = $perSiswa->filter(fn ($r) => $r['persen'] !== null && $r['persen'] < $ambang)->sortBy('persen')->values();

        $tabel = [];
        $tabel['siswa'] = $this->tabel('rekap_siswa', 'Rekap kehadiran per siswa', array_merge([['nama', 'Nama Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel']], $kolom), $perSiswa);
        $tabel['kelas'] = $this->tabel('rekap_kelas', 'Rekap kehadiran per kelas/rombel', array_merge([['rombel', 'Rombel'], ['siswa', 'Siswa', 'angka']], $kolom), $siswa->groupBy(fn ($s) => $s->kelas?->nama_kelas ?? '-')->sortKeys(SORT_NATURAL)->map(fn (Collection $g, $r) => $baris($absen->whereIn('siswa_id', $g->pluck('id')), ['rombel' => $r, 'siswa' => $g->count()]))->values());
        $tabel['harian'] = $this->tabel('rekap_harian', 'Rekap kehadiran harian', array_merge([['tanggal', 'Tanggal']], $kolom), $absen->groupBy(fn ($a) => substr((string) $a->tanggal, 0, 10))->sortKeys()->map(fn (Collection $g, $t) => $baris($g, ['tanggal' => Carbon::parse($t)->format('d/m/Y')]))->values(), 'Hari tanpa catatan absensi tidak ditampilkan.');
        $tabel['bulanan'] = $this->tabel('rekap_bulanan', 'Rekap kehadiran bulanan', array_merge([['bulan', 'Bulan']], $kolom), $absen->groupBy(fn ($a) => substr((string) $a->tanggal, 0, 7))->sortKeys()->map(fn (Collection $g, $k) => $baris($g, ['bulan' => self::BULAN[(int) substr($k, 5, 2)].' '.substr($k, 0, 4)]))->values());
        $sems = Semester::where('tahun_ajaran_id', $c['ta']->id)->orderBy('nama')->get();
        if ($sems->isEmpty()) {
            $sems = collect([(object) ['nama' => 'Tahun Ajaran '.$c['ta']->nama, 'tanggal_mulai' => $c['ta']->tanggal_mulai, 'tanggal_selesai' => $c['ta']->tanggal_selesai]]);
        }
        $tabel['semester'] = $this->tabel('rekap_semester', 'Rekap kehadiran per semester', array_merge([['semester', 'Semester'], ['periode', 'Periode']], $kolom), $sems->map(function ($s) use ($siswa, $baris) {
            $g = Absensi::whereIn('siswa_id', $siswa->keys())->whereBetween('tanggal', [substr((string) $s->tanggal_mulai, 0, 10), substr((string) $s->tanggal_selesai, 0, 10)])->get(['status']);

            return $baris($g, ['semester' => $s->nama, 'periode' => Carbon::parse($s->tanggal_mulai)->format('d/m/Y').' – '.Carbon::parse($s->tanggal_selesai)->format('d/m/Y')]);
        }), 'Periode semester mengikuti data Semester pada Pengaturan Akademik (tidak terpengaruh filter periode).');

        $total = $h($absen);
        $catatan = ['Persentase kehadiran = hadir ÷ seluruh hari yang tercatat pada Kehadiran Siswa.'];
        if ($total['total'] === 0) {
            $catatan[] = 'Belum ada data kehadiran pada periode dan filter ini.';
        }

        return [
            'ringkasan' => [
                $this->stat('Kehadiran', $this->persen($total['hadir'], $total['total']), '%'), $this->stat('Hadir', $total['hadir'], 'catatan'), $this->stat('Sakit', $total['sakit'], 'catatan'), $this->stat('Izin', $total['izin'], 'catatan'), $this->stat('Alpa', $total['alpa'], 'catatan'),
                $this->stat("Kehadiran < {$ambang}%", $rendah->count(), 'siswa'),
            ],
            'catatan' => $catatan,
            'tabel' => [$tabel[$rekap], $this->tabel('rendah', "Deteksi kehadiran rendah (< {$ambang}%)", [['nama', 'Nama Siswa'], ['nis', 'NIS'], ['rombel', 'Rombel'], ['alpa', 'Alpa', 'angka'], ['total', 'Total', 'angka'], ['persen', '% Hadir', 'persen']], $rendah)],
        ];
    }

    // ================================================================= PERKEMBANGAN

    protected function laporanPerkembangan(array $c): array
    {
        if (empty($c['siswa_id'])) {
            return ['ringkasan' => [], 'catatan' => ['Pilih siswa terlebih dahulu.'], 'tabel' => []];
        }
        $s = Siswa::with('kelas:id,nama_kelas,tingkat')->findOrFail($c['siswa_id']);
        $dari = $c['dari'];
        $sampai = $c['sampai'];

        $absen = Absensi::where('siswa_id', $s->id)->whereBetween('tanggal', [$dari, $sampai])->get(['tanggal', 'status']);
        $hadir = $absen->where('status', 'hadir')->count();
        $perBulan = $absen->groupBy(fn ($a) => substr((string) $a->tanggal, 0, 7))->sortKeys()->map(fn (Collection $g, $k) => [
            'bulan' => self::BULAN[(int) substr($k, 5, 2)].' '.substr($k, 0, 4), 'hadir' => $g->where('status', 'hadir')->count(), 'sakit' => $g->where('status', 'sakit')->count(), 'izin' => $g->where('status', 'izin')->count(),
            'alpa' => $g->where('status', 'alpha')->count(), 'total' => $g->count(), 'persen' => $this->persen($g->where('status', 'hadir')->count(), $g->count()),
        ])->values();

        $pelanggaran = Pelanggaran::where('siswa_id', $s->id)->whereBetween('tanggal', [$dari, $sampai])->orderBy('tanggal')->get();
        $prestasi = Prestasi::where('siswa_id', $s->id)->where('status', 'terverifikasi')->whereBetween('tanggal', [$dari, $sampai])->orderBy('tanggal')->get();
        $catatanPembinaan = CatatanSiswa::where('siswa_id', $s->id)->whereBetween('tanggal', [$dari, $sampai])->orderBy('tanggal')->get();
        $guru = Guru::whereIn('id', $catatanPembinaan->pluck('guru_id')->filter())->pluck('nama', 'id');

        // Ekstrakurikuler: keanggotaan, kehadiran, dan nilai dari modul Ekstrakurikuler.
        $anggota = EkskulAnggota::where('siswa_id', $s->id)->get();
        $ekskul = Ekskul::whereIn('id', $anggota->pluck('ekskul_id'))->get()->keyBy('id');
        $nilaiEks = EkskulPenilaian::where('siswa_id', $s->id)->get()->keyBy('ekskul_id');
        $presEks = EkskulPresensi::query()->join('ekskul_kegiatan as k', 'k.id', '=', 'ekskul_presensi.kegiatan_id')->where('ekskul_presensi.siswa_id', $s->id)->where('k.status', '!=', 'dibatalkan')
            ->selectRaw('k.ekskul_id, count(*) as n, sum(case when ekskul_presensi.status = ? then 1 else 0 end) as h', ['hadir'])->groupBy('k.ekskul_id')->get()->keyBy('ekskul_id');
        $taNama = TahunAjaran::pluck('nama', 'id');

        $baris = fn (array $x) => $x;
        $identitas = collect([
            ['aspek' => 'Nama', 'isi' => $s->nama], ['aspek' => 'NIS / NISN', 'isi' => $s->nis.' / '.($s->nisn ?: '-')], ['aspek' => 'Jenis kelamin', 'isi' => $s->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
            ['aspek' => 'Tempat/tanggal lahir', 'isi' => ($s->tempat_lahir ?: '-').', '.($s->tanggal_lahir ? Carbon::parse($s->tanggal_lahir)->format('d/m/Y') : '-')], ['aspek' => 'Kelas / rombel', 'isi' => ($s->kelas?->tingkat ?? '-').' / '.($s->kelas?->nama_kelas ?? '-')],
            ['aspek' => 'Alamat', 'isi' => $s->alamat ?: '-'], ['aspek' => 'Tahun masuk', 'isi' => $s->tahun_masuk ?: '-'], ['aspek' => 'Status', 'isi' => self::STATUS_SISWA[$s->status] ?? $s->status],
        ])->map($baris);

        return [
            'ringkasan' => [
                $this->stat('Kehadiran', $this->persen($hadir, $absen->count()), '%'), $this->stat('Pelanggaran', $pelanggaran->count()), $this->stat('Prestasi', $prestasi->count()),
                $this->stat('Ekstrakurikuler', $anggota->where('status', 'aktif')->count(), 'keanggotaan aktif'), $this->stat('Catatan pembinaan', $catatanPembinaan->count()),
            ],
            'catatan' => ['Profil perkembangan kesiswaan '.$s->nama.' — dihitung dari data Kehadiran, Pelanggaran, Prestasi, Ekstrakurikuler, dan Catatan Siswa (wali kelas). Modul Organisasi Siswa belum tersedia sehingga belum ikut tercantum.'],
            'tabel' => [
                $this->tabel('identitas', 'Identitas siswa', [['aspek', 'Data'], ['isi', 'Keterangan']], $identitas),
                $this->tabel('kehadiran', 'Kehadiran per bulan', [['bulan', 'Bulan'], ['hadir', 'Hadir', 'angka'], ['sakit', 'Sakit', 'angka'], ['izin', 'Izin', 'angka'], ['alpa', 'Alpa', 'angka'], ['total', 'Total', 'angka'], ['persen', '% Hadir', 'persen']], $perBulan),
                $this->tabel('pelanggaran', 'Pelanggaran', [['tanggal', 'Tanggal'], ['tingkat', 'Tingkat'], ['jenis', 'Jenis'], ['keterangan', 'Keterangan'], ['tindakan', 'Tindakan']], $pelanggaran->map(fn ($p) => ['tanggal' => Carbon::parse($p->tanggal)->format('d/m/Y'), 'tingkat' => ucfirst($p->tingkat), 'jenis' => $p->jenis, 'keterangan' => $p->keterangan ?: '-', 'tindakan' => $p->tindakan ?: '-'])),
                $this->tabel('prestasi', 'Prestasi (terverifikasi)', [['tanggal', 'Tanggal'], ['judul', 'Prestasi'], ['tingkat', 'Tingkat'], ['keterangan', 'Keterangan']], $prestasi->map(fn ($p) => ['tanggal' => Carbon::parse($p->tanggal)->format('d/m/Y'), 'judul' => $p->judul, 'tingkat' => ucwords(str_replace('_', '/', $p->tingkat)), 'keterangan' => $p->keterangan ?: '-'])),
                $this->tabel('ekskul', 'Ekstrakurikuler', [['ekskul', 'Ekstrakurikuler'], ['periode', 'Periode'], ['bergabung', 'Bergabung'], ['status', 'Status'], ['hadir', '% Hadir', 'persen'], ['nilai', 'Nilai', 'desimal'], ['predikat', 'Predikat'], ['deskripsi', 'Deskripsi']], $anggota->map(function ($a) use ($ekskul, $nilaiEks, $presEks, $taNama) {
                    $e = $ekskul[$a->ekskul_id];
                    $n = $nilaiEks[$a->ekskul_id] ?? null;
                    $p = $presEks[$a->ekskul_id] ?? null;

                    return ['ekskul' => $e->nama, 'periode' => ($taNama[$e->tahun_ajaran_id] ?? '').' '.ucfirst($e->semester), 'bergabung' => Carbon::parse($a->tanggal_bergabung)->format('d/m/Y'), 'status' => ucfirst($a->status), 'hadir' => $p && $p->n ? (int) round($p->h / $p->n * 100) : null, 'nilai' => $n?->nilai, 'predikat' => $n?->predikat ?? '-', 'deskripsi' => $n?->deskripsi ?? '-'];
                })),
                $this->tabel('organisasi', 'Organisasi siswa', [['keterangan', 'Keterangan']], [['keterangan' => 'Modul Organisasi Siswa belum tersedia; belum ada data yang dapat ditampilkan.']]),
                $this->tabel('pembinaan', 'Catatan pembinaan', [['tanggal', 'Tanggal'], ['kategori', 'Kategori'], ['catatan', 'Catatan'], ['guru', 'Dicatat oleh']], $catatanPembinaan->map(fn ($n) => ['tanggal' => Carbon::parse($n->tanggal)->format('d/m/Y'), 'kategori' => ucfirst($n->kategori), 'catatan' => $n->catatan, 'guru' => $guru[$n->guru_id] ?? '-'])),
            ],
        ];
    }
}

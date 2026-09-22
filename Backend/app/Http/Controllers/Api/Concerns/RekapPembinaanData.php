<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Kelas;
use App\Models\PembinaanTindakLanjut;
use App\Models\Pelanggaran;
use App\Models\Prestasi;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Penyusun data Rekap Pembinaan per siswa. Pelanggaran dan prestasi adalah dua aspek yang berbeda:
 * tidak ada skor gabungan, keduanya hanya dihitung dan ditampilkan terpisah.
 */
trait RekapPembinaanData
{
    protected const LOG_PEMBINAAN = 'pembinaan';

    public const TINGKAT_PELANGGARAN = ['ringan' => 'Ringan', 'sedang' => 'Sedang', 'berat' => 'Berat'];

    public const STATUS_PELANGGARAN = ['aktif' => 'Aktif', 'dalam_pembinaan' => 'Dalam Pembinaan', 'selesai' => 'Selesai'];

    public const TINGKAT_PRESTASI = ['sekolah' => 'Sekolah', 'kecamatan' => 'Kecamatan', 'kabupaten_kota' => 'Kabupaten/Kota', 'provinsi' => 'Provinsi', 'nasional' => 'Nasional', 'internasional' => 'Internasional'];

    public const JENIS_PRESTASI = ['individu' => 'Individu', 'kelompok' => 'Kelompok'];

    public const STATUS_TINDAK_LANJUT = ['direncanakan' => 'Direncanakan', 'berjalan' => 'Berjalan', 'selesai' => 'Selesai', 'dibatalkan' => 'Dibatalkan'];

    public const KATEGORI_BAWAAN = ['Kedisiplinan', 'Ketertiban', 'Kehadiran', 'Seragam & Atribut', 'Sopan Santun', 'Akademik', 'Lainnya'];

    public const BIDANG_BAWAAN = ['Akademik', 'Olahraga', 'Seni & Budaya', 'Keagamaan', 'Teknologi', 'Kepemimpinan', 'Lainnya'];

    public const JENIS_TINDAKAN_BAWAAN = ['Teguran lisan', 'Teguran tertulis', 'Konseling', 'Pemanggilan orang tua', 'Pembinaan khusus', 'Pemantauan', 'Skorsing', 'Lainnya'];

    // ------------------------------------------------------------- hak akses

    /** Id kelas yang boleh dilihat pengguna, atau null bila boleh melihat semua siswa. */
    protected function batasKelas(Request $request): ?array
    {
        $u = $request->user();
        if ($u?->can('rekap-pembinaan.view') || $u?->can('rekap-pembinaan.manage')) {
            return null;
        }
        abort_unless($u?->can('rekap-pembinaan.view-kelas'), 403, 'Anda tidak memiliki akses ke Rekap Pembinaan.');
        $guru = $u->guru;
        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru sehingga kelas binaan tidak dapat ditentukan.');

        return Kelas::where('wali_kelas_id', $guru->id)->pluck('id')->all();
    }

    protected function pastikanSiswa(Request $request, Siswa $siswa): void
    {
        $batas = $this->batasKelas($request);
        abort_if($batas !== null && ! in_array($siswa->kelas_id, $batas, true), 403, 'Siswa ini bukan siswa di kelas binaan Anda.');
    }

    protected function boleh(Request $request, string $izin): bool
    {
        return (bool) $request->user()?->can($izin);
    }

    /** Properti log yang aman ditampilkan: catatan internal hanya untuk petugas pembinaan. */
    protected function propertiLog(mixed $properti, bool $internal): array
    {
        $p = collect($properti)->only(['sebelum', 'sesudah', 'alasan'])->all();
        if (! $internal) {
            foreach (['sebelum', 'sesudah'] as $k) {
                if (is_array($p[$k] ?? null)) {
                    unset($p[$k]['catatan_internal']);
                }
            }
        }

        return $p;
    }

    // ---------------------------------------------------------------- filter

    protected function filter(Request $request): array
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['nullable', 'integer', 'exists:tahun_ajaran,id'], 'semester' => ['nullable', 'in:ganjil,genap'],
            'dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'jenis_data' => ['nullable', 'in:semua,pelanggaran,prestasi,tindak_lanjut'],
            'pel_kategori' => ['nullable', 'string', 'max:60'], 'pel_tingkat' => ['nullable', 'in:ringan,sedang,berat'], 'pel_status' => ['nullable', 'in:aktif,dalam_pembinaan,selesai'], 'pel_search' => ['nullable', 'string', 'max:100'],
            'pre_bidang' => ['nullable', 'string', 'max:60'], 'pre_tingkat' => ['nullable', 'in:'.implode(',', array_keys(self::TINGKAT_PRESTASI))], 'pre_jenis' => ['nullable', 'in:individu,kelompok'], 'pre_search' => ['nullable', 'string', 'max:100'],
            'tl_status' => ['nullable', 'in:direncanakan,berjalan,selesai,dibatalkan'], 'tl_search' => ['nullable', 'string', 'max:100'],
            'bagian' => ['nullable', 'in:semua,pelanggaran,prestasi,tindak_lanjut,timeline'],
            'tanggal_laporan' => ['nullable', 'date'], 'logo' => ['nullable', 'boolean'], 'ttd' => ['nullable', 'boolean'],
        ]);
        $ta = ! empty($in['tahun_ajaran_id']) ? TahunAjaran::find($in['tahun_ajaran_id']) : null;
        $sem = $ta && ! empty($in['semester']) ? Semester::where('tahun_ajaran_id', $ta->id)->whereRaw('lower(nama) = ?', [$in['semester']])->first() : null;
        $dari = $in['dari'] ?? ($ta ? substr((string) ($sem->tanggal_mulai ?? $ta->tanggal_mulai), 0, 10) : null);
        $sampai = $in['sampai'] ?? ($ta ? substr((string) ($sem->tanggal_selesai ?? $ta->tanggal_selesai), 0, 10) : null);

        return $in + ['ta' => $ta, 'dari' => $dari, 'sampai' => $sampai];
    }

    private function dalamPeriode($q, string $kolom, array $f)
    {
        return $q->when($f['dari'] ?? null, fn ($x, $d) => $x->whereDate($kolom, '>=', $d))->when($f['sampai'] ?? null, fn ($x, $d) => $x->whereDate($kolom, '<=', $d));
    }

    // ------------------------------------------------------------------ data

    protected function identitas(Siswa $s): array
    {
        $s->loadMissing('kelas.waliKelas:id,nama', 'user:id,avatar');

        return [
            'id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis, 'nisn' => $s->nisn, 'jenis_kelamin' => $s->jenis_kelamin,
            'kelas' => $s->kelas?->tingkat, 'rombel' => $s->kelas?->nama_kelas, 'tahun_ajaran' => $s->kelas?->tahun_ajaran,
            'wali_kelas' => $s->kelas?->waliKelas?->nama, 'status' => $s->status,
            'foto_url' => $s->user?->avatar ? '/avatar/'.$s->user->avatar : null,
        ];
    }

    /** @return array{semua_pelanggaran: Collection, semua_prestasi: Collection, semua_tl: Collection} baris sudah berbentuk array, terbaru di atas */
    protected function ambilData(Siswa $s, array $f, bool $internal): array
    {
        $pel = fn () => $this->dalamPeriode(Pelanggaran::where('siswa_id', $s->id), 'tanggal', $f);
        $pre = fn () => $this->dalamPeriode(Prestasi::where('siswa_id', $s->id)->where('status', 'terverifikasi'), 'tanggal', $f);
        $tl = fn () => $this->dalamPeriode(PembinaanTindakLanjut::where('siswa_id', $s->id), 'tanggal_pembinaan', $f);

        $pelanggaran = $pel()->orderByDesc('tanggal')->orderByDesc('id')->get();
        $prestasi = $pre()->orderByDesc('tanggal')->orderByDesc('id')->get();
        $tindak = $tl()->orderByDesc('tanggal_pembinaan')->orderByDesc('id')->get();

        $petugas = User::whereIn('id', $pelanggaran->pluck('dicatat_oleh')->merge($prestasi->pluck('dicatat_oleh'))->merge($tindak->pluck('dibuat_oleh'))->filter()->unique())->pluck('name', 'id');
        $jenisPel = $pelanggaran->pluck('jenis', 'id');
        $semuaTl = $tindak->map(fn ($t) => $this->barisTl($t, $petugas, $jenisPel, $internal));
        $jumlahTl = $semuaTl->groupBy('pelanggaran_id')->map->count();

        return [
            'semua_pelanggaran' => $pelanggaran->map(fn ($p) => $this->barisPelanggaran($p, $petugas, $jumlahTl->get($p->id, 0))),
            'semua_prestasi' => $prestasi->map(fn ($p) => $this->barisPrestasi($p, $petugas)),
            'semua_tl' => $semuaTl,
        ];
    }

    private function barisPelanggaran(Pelanggaran $p, Collection $petugas, int $jumlahTl): array
    {
        return [
            'id' => $p->id, 'tanggal' => substr((string) $p->tanggal, 0, 10), 'jenis' => $p->jenis, 'kategori' => $p->kategori, 'tingkat' => $p->tingkat, 'tingkat_label' => self::TINGKAT_PELANGGARAN[$p->tingkat] ?? $p->tingkat,
            'deskripsi' => $p->keterangan, 'poin' => $p->poin, 'tindakan' => $p->tindakan, 'status' => $p->status, 'status_label' => self::STATUS_PELANGGARAN[$p->status] ?? $p->status,
            'petugas' => $petugas->get($p->dicatat_oleh), 'catatan' => $p->catatan, 'jumlah_tindak_lanjut' => $jumlahTl,
        ];
    }

    private function barisPrestasi(Prestasi $p, Collection $petugas): array
    {
        return [
            'id' => $p->id, 'tanggal' => substr((string) $p->tanggal, 0, 10), 'judul' => $p->judul, 'bidang' => $p->bidang, 'tingkat' => $p->tingkat, 'tingkat_label' => self::TINGKAT_PRESTASI[$p->tingkat] ?? $p->tingkat,
            'jenis' => $p->jenis, 'jenis_label' => self::JENIS_PRESTASI[$p->jenis] ?? null, 'penyelenggara' => $p->penyelenggara, 'peringkat' => $p->peringkat, 'keterangan' => $p->keterangan,
            'bukti_url' => $p->file ? '/prestasi-bukti-file/'.preg_replace('#^prestasi-bukti/#', '', (string) $p->file) : null, 'petugas' => $petugas->get($p->dicatat_oleh),
        ];
    }

    protected function barisTl(PembinaanTindakLanjut $t, Collection $petugas, Collection $jenisPel, bool $internal): array
    {
        $jadwal = $t->tanggal_tindak_lanjut ? substr((string) $t->tanggal_tindak_lanjut, 0, 10) : null;

        return [
            'id' => $t->id, 'siswa_id' => $t->siswa_id, 'pelanggaran_id' => $t->pelanggaran_id, 'pelanggaran' => $t->pelanggaran_id ? $jenisPel->get($t->pelanggaran_id) : null,
            'tanggal_pembinaan' => substr((string) $t->tanggal_pembinaan, 0, 10), 'jenis_tindakan' => $t->jenis_tindakan, 'pembina' => $t->pembina, 'catatan' => $t->catatan, 'rekomendasi' => $t->rekomendasi,
            'tanggal_tindak_lanjut' => $jadwal, 'status' => $t->status, 'status_label' => self::STATUS_TINDAK_LANJUT[$t->status] ?? $t->status,
            'terlambat' => $jadwal !== null && in_array($t->status, ['direncanakan', 'berjalan'], true) && $jadwal < now()->toDateString(),
            'catatan_internal' => $internal ? $t->catatan_internal : null, 'ada_catatan_internal' => filled($t->catatan_internal),
            'dicatat_oleh' => $petugas->get($t->dibuat_oleh),
        ];
    }

    /** Terapkan filter per bagian pada baris yang sudah dimuat. */
    protected function saring(array $data, array $f): array
    {
        $cocok = fn (array $r, ?string $kata, array $kolom) => ! $kata || collect($kolom)->contains(fn ($k) => str_contains(mb_strtolower((string) ($r[$k] ?? '')), mb_strtolower($kata)));

        return [
            'pelanggaran' => $data['semua_pelanggaran']->filter(fn ($r) => (empty($f['pel_kategori']) || $r['kategori'] === $f['pel_kategori']) && (empty($f['pel_tingkat']) || $r['tingkat'] === $f['pel_tingkat'])
                && (empty($f['pel_status']) || $r['status'] === $f['pel_status']) && $cocok($r, $f['pel_search'] ?? null, ['jenis', 'kategori', 'deskripsi', 'tindakan', 'catatan', 'petugas']))->values(),
            'prestasi' => $data['semua_prestasi']->filter(fn ($r) => (empty($f['pre_bidang']) || $r['bidang'] === $f['pre_bidang']) && (empty($f['pre_tingkat']) || $r['tingkat'] === $f['pre_tingkat'])
                && (empty($f['pre_jenis']) || $r['jenis'] === $f['pre_jenis']) && $cocok($r, $f['pre_search'] ?? null, ['judul', 'bidang', 'penyelenggara', 'peringkat', 'keterangan']))->values(),
            'tindak_lanjut' => $data['semua_tl']->filter(fn ($r) => (empty($f['tl_status']) || $r['status'] === $f['tl_status']) && $cocok($r, $f['tl_search'] ?? null, ['jenis_tindakan', 'pembina', 'catatan', 'rekomendasi', 'pelanggaran']))->values(),
        ];
    }

    // ------------------------------------------------------ ringkasan & analisis

    protected function ringkasan(array $data): array
    {
        $pel = $data['semua_pelanggaran'];
        $pre = $data['semua_prestasi'];
        $pakaiPoin = $pel->contains(fn ($r) => $r['poin'] !== null);

        return [
            'total_pelanggaran' => $pel->count(), 'total_prestasi' => $pre->count(), 'total_tindak_lanjut' => $data['semua_tl']->where('status', '!=', 'dibatalkan')->count(),
            'pelanggaran_aktif' => $pel->where('status', '!=', 'selesai')->count(),
            'tindak_lanjut_terlambat' => $data['semua_tl']->where('terlambat', true)->count(),
            'prestasi_terbaru' => $pre->first() ? ['judul' => $pre->first()['judul'], 'tanggal' => $pre->first()['tanggal'], 'tingkat' => $pre->first()['tingkat_label']] : null,
            'per_tingkat_pelanggaran' => collect(self::TINGKAT_PELANGGARAN)->map(fn ($l, $k) => ['key' => $k, 'label' => $l, 'jumlah' => $pel->where('tingkat', $k)->count()])->values(),
            'per_kategori_prestasi' => $pre->groupBy(fn ($r) => $r['bidang'] ?: 'Belum dikategorikan')->map(fn ($g, $k) => ['label' => $k, 'jumlah' => $g->count()])->sortByDesc('jumlah')->values(),
            'pakai_poin' => $pakaiPoin, 'total_poin' => $pakaiPoin ? (int) $pel->sum(fn ($r) => (int) $r['poin']) : null,
        ];
    }

    protected function analisis(array $data): array
    {
        $perBulan = function (Collection $baris) {
            if ($baris->isEmpty()) {
                return [];
            }
            $hitung = $baris->groupBy(fn ($r) => substr($r['tanggal'], 0, 7));
            $awal = Carbon::parse($hitung->keys()->min().'-01');
            $akhir = Carbon::parse($hitung->keys()->max().'-01');
            $hasil = [];
            for ($b = $awal->copy(); $b <= $akhir && count($hasil) < 60; $b->addMonth()) {
                $hasil[] = ['bulan' => $b->format('Y-m'), 'label' => self::BULAN[$b->month].' '.$b->year, 'jumlah' => $hitung->get($b->format('Y-m'))?->count() ?? 0];
            }

            return $hasil;
        };
        $kelompok = fn (Collection $baris, string $kunci, string $kosong) => $baris->groupBy(fn ($r) => $r[$kunci] ?: $kosong)->map(fn ($g, $k) => ['label' => $k, 'jumlah' => $g->count()])->sortByDesc('jumlah')->values();

        return [
            'prestasi_per_bulan' => $perBulan($data['semua_prestasi']),
            'prestasi_per_bidang' => $kelompok($data['semua_prestasi'], 'bidang', 'Belum dikategorikan'),
            'prestasi_per_tingkat' => $kelompok($data['semua_prestasi'], 'tingkat_label', '-'),
            'pelanggaran_per_bulan' => $perBulan($data['semua_pelanggaran']),
            'pelanggaran_per_kategori' => $kelompok($data['semua_pelanggaran'], 'kategori', 'Belum dikategorikan'),
        ];
    }

    // -------------------------------------------------------------- timeline

    protected function timeline(array $data, array $f): Collection
    {
        $jenis = $f['jenis_data'] ?? 'semua';
        $tlPerPelanggaran = $data['semua_tl']->whereNotNull('pelanggaran_id')->groupBy('pelanggaran_id');
        $e = collect();
        if (in_array($jenis, ['semua', 'pelanggaran'], true)) {
            foreach ($data['semua_pelanggaran'] as $p) {
                $e->push([
                    'kunci' => 'pel'.$p['id'], 'tipe' => 'pelanggaran', 'tanggal' => $p['tanggal'], 'judul' => $p['jenis'], 'sub' => trim(($p['kategori'] ? $p['kategori'].' · ' : '').'Tingkat '.$p['tingkat_label']),
                    'badge' => $p['status_label'], 'tingkat' => $p['tingkat'], 'bukti_url' => null,
                    'detail' => $this->pasangan([['Deskripsi', $p['deskripsi']], ['Poin', $p['poin']], ['Tindakan', $p['tindakan']], ['Petugas', $p['petugas']], ['Catatan', $p['catatan']]]),
                    'tindak_lanjut' => $tlPerPelanggaran->get($p['id'], collect())->values(),
                ]);
            }
        }
        if (in_array($jenis, ['semua', 'prestasi'], true)) {
            foreach ($data['semua_prestasi'] as $p) {
                $e->push([
                    'kunci' => 'pre'.$p['id'], 'tipe' => 'prestasi', 'tanggal' => $p['tanggal'], 'judul' => $p['judul'], 'sub' => trim(($p['bidang'] ? $p['bidang'].' · ' : '').'Tingkat '.$p['tingkat_label'].($p['peringkat'] ? ' · '.$p['peringkat'] : '')),
                    'badge' => $p['jenis_label'], 'bukti_url' => $p['bukti_url'],
                    'detail' => $this->pasangan([['Penyelenggara', $p['penyelenggara']], ['Peringkat', $p['peringkat']], ['Keterangan', $p['keterangan']], ['Dicatat oleh', $p['petugas']]]), 'tindak_lanjut' => [],
                ]);
            }
        }
        if (in_array($jenis, ['semua', 'tindak_lanjut'], true)) {
            foreach ($data['semua_tl'] as $t) {
                $e->push([
                    'kunci' => 'tl'.$t['id'], 'tipe' => 'tindak_lanjut', 'tanggal' => $t['tanggal_pembinaan'], 'judul' => $t['jenis_tindakan'], 'sub' => 'Pembina: '.$t['pembina'].($t['pelanggaran'] ? ' · terkait "'.$t['pelanggaran'].'"' : ''),
                    'badge' => $t['status_label'], 'bukti_url' => null,
                    'detail' => $this->pasangan([['Catatan', $t['catatan']], ['Rekomendasi', $t['rekomendasi']], ['Tanggal tindak lanjut', $t['tanggal_tindak_lanjut']], ['Catatan internal', $t['catatan_internal']]]), 'tindak_lanjut' => [],
                ]);
            }
        }

        return $e->sortByDesc(fn ($x) => $x['tanggal'].str_pad((string) preg_replace('/\D/', '', $x['kunci']), 8, '0', STR_PAD_LEFT))->values();
    }

    /** Buang pasangan label/isi yang kosong. */
    private function pasangan(array $p): array
    {
        return collect($p)->filter(fn ($x) => filled($x[1]))->map(fn ($x) => ['label' => $x[0], 'isi' => (string) $x[1]])->values()->all();
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PpdbHelpers;
use App\Http\Controllers\Controller;
use App\Models\PpdbJalur;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use App\Models\PpdbPersyaratan;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Pengaturan PPDB (periode, jalur, persyaratan, status) dan dashboard.
 *
 * Nama jalur tidak dikunci di sistem: sekolah membuat sendiri sesuai kebijakan
 * (domisili, afirmasi, prestasi, mutasi, dll.) beserta kuota dan kriteria seleksinya.
 */
class PpdbPeriodeController extends Controller
{
    use PpdbHelpers;

    public function opsi(): JsonResponse
    {
        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'jenjang_sekolah' => tenant()->jenjang ?? null,
            'status' => collect(self::STATUS_PERIODE)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
        ]);
    }

    public function index(): JsonResponse
    {
        return response()->json(
            PpdbPeriode::with('tahunAjaran:id,nama')->withCount(['pendaftar' => fn ($q) => $q->where('status_pendaftaran', 'terdaftar')])
                ->orderByDesc('id')->get()->map(fn (PpdbPeriode $p) => $this->present($p, false))
        );
    }

    public function show(PpdbPeriode $periode): JsonResponse
    {
        return response()->json($this->present($periode->load(['tahunAjaran:id,nama', 'jalur', 'persyaratan'])->loadCount(['pendaftar' => fn ($q) => $q->where('status_pendaftaran', 'terdaftar')])));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validasi($request);
        $periode = PpdbPeriode::create($data + ['status' => 'draft', 'dibuat_oleh' => $request->user()?->id]);
        $this->logPpdb($request, $periode, 'created', "Membuat PPDB \"{$periode->nama}\".", ['sebelum' => null, 'sesudah' => $data]);

        return response()->json($this->present($periode->load(['tahunAjaran:id,nama', 'jalur', 'persyaratan'])), 201);
    }

    public function update(Request $request, PpdbPeriode $periode): JsonResponse
    {
        $this->pastikanPengumumanBelumTerbit($periode, 'mengubah pengaturan');
        $data = $this->validasi($request);
        $lama = $periode->only(array_keys($data));
        $periode->update($data);
        $berubah = array_filter($data, fn ($v, $k) => (string) $lama[$k] !== (string) $v, ARRAY_FILTER_USE_BOTH);
        if ($berubah) {
            $this->logPpdb($request, $periode, 'updated', "Mengubah pengaturan PPDB \"{$periode->nama}\".", ['sebelum' => array_intersect_key($lama, $berubah), 'sesudah' => $berubah]);
        }

        return response()->json($this->present($periode->load(['tahunAjaran:id,nama', 'jalur', 'persyaratan'])));
    }

    public function destroy(Request $request, PpdbPeriode $periode): JsonResponse
    {
        if ($periode->pendaftar()->exists()) {
            throw ValidationException::withMessages(['periode' => 'PPDB yang sudah memiliki pendaftar tidak dapat dihapus. Ubah statusnya menjadi Selesai.']);
        }
        $this->logPpdb($request, $periode, 'deleted', "Menghapus PPDB \"{$periode->nama}\".", ['sebelum' => ['nama' => $periode->nama, 'status' => $periode->status], 'sesudah' => null]);
        $periode->delete();

        return response()->json(['message' => 'PPDB dihapus.']);
    }

    public function status(Request $request, PpdbPeriode $periode): JsonResponse
    {
        $in = $request->validate(['status' => ['required', 'in:draft,dibuka,ditutup,seleksi,daftar_ulang,selesai']]);
        $baru = $in['status'];
        $urutan = array_keys(self::STATUS_PERIODE);

        if ($periode->pengumuman_terbit_at && array_search($baru, $urutan, true) < array_search('pengumuman', $urutan, true)) {
            throw ValidationException::withMessages(['status' => 'Pengumuman sudah terbit; status tidak dapat kembali ke tahap sebelum pengumuman. Batalkan publikasi pengumuman lebih dulu.']);
        }
        if ($baru === 'draft' && $periode->pendaftar()->exists()) {
            throw ValidationException::withMessages(['status' => 'PPDB yang sudah memiliki pendaftar tidak dapat dikembalikan ke Draft.']);
        }
        if ($baru === 'daftar_ulang' && ! $periode->pengumuman_terbit_at) {
            throw ValidationException::withMessages(['status' => 'Daftar ulang baru dapat dibuka setelah hasil seleksi diumumkan.']);
        }
        if ($baru === 'dibuka') {
            $masalah = [];
            if (! $periode->jalur()->where('aktif', true)->exists()) {
                $masalah[] = 'belum ada jalur penerimaan aktif';
            }
            if ($periode->kuota < 1) {
                $masalah[] = 'kuota penerimaan belum diisi';
            }
            if ($masalah) {
                throw ValidationException::withMessages(['status' => 'Pendaftaran belum dapat dibuka: '.implode(', ', $masalah).'.']);
            }
        }

        $lama = $periode->status;
        if ($lama !== $baru) {
            $periode->update(['status' => $baru]);
            $this->logPpdb($request, $periode, 'status', "Status PPDB \"{$periode->nama}\" diubah dari ".self::STATUS_PERIODE[$lama].' menjadi '.self::STATUS_PERIODE[$baru].'.', ['sebelum' => $lama, 'sesudah' => $baru]);
        }

        return response()->json($this->present($periode->load(['tahunAjaran:id,nama', 'jalur', 'persyaratan'])));
    }

    // ------------------------------------------------------------------ jalur

    public function storeJalur(Request $request, PpdbPeriode $periode): JsonResponse
    {
        $this->pastikanPengumumanBelumTerbit($periode, 'mengubah jalur');
        $data = $this->validasiJalur($request, $periode, null);
        $jalur = $periode->jalur()->create($data + ['urutan' => (int) $periode->jalur()->max('urutan') + 1]);
        $this->logPpdb($request, $periode, 'jalur', "Menambahkan jalur \"{$jalur->nama}\" (kuota {$jalur->kuota}).", ['jalur' => $data, 'sebelum' => null, 'sesudah' => $data]);

        return response()->json($jalur, 201);
    }

    public function updateJalur(Request $request, PpdbJalur $jalur): JsonResponse
    {
        $periode = $jalur->periode;
        $this->pastikanPengumumanBelumTerbit($periode, 'mengubah jalur');
        $data = $this->validasiJalur($request, $periode, $jalur);
        $lamaJalur = $jalur->only(array_keys($data));
        $jalur->update($data);

        // Kriteria/bobot berubah → skor pendaftar jalur ini dihitung ulang.
        $jalur->refresh();
        PpdbPendaftar::where('ppdb_jalur_id', $jalur->id)->whereNotNull('nilai_seleksi')->get()
            ->each(fn (PpdbPendaftar $p) => $p->update(['skor' => $this->hitungSkor($jalur, $p->nilai_seleksi)]));

        $this->logPpdb($request, $periode, 'jalur', "Mengubah jalur \"{$jalur->nama}\".", ['sebelum' => $lamaJalur, 'sesudah' => $data]);

        return response()->json($jalur);
    }

    public function destroyJalur(Request $request, PpdbJalur $jalur): JsonResponse
    {
        $periode = $jalur->periode;
        $this->pastikanPengumumanBelumTerbit($periode, 'menghapus jalur');
        if (PpdbPendaftar::where('ppdb_jalur_id', $jalur->id)->exists()) {
            throw ValidationException::withMessages(['jalur' => 'Jalur yang sudah memiliki pendaftar tidak dapat dihapus. Nonaktifkan saja.']);
        }
        $this->logPpdb($request, $periode, 'jalur', "Menghapus jalur \"{$jalur->nama}\".", ['sebelum' => $jalur->only(['nama', 'kuota', 'aktif']), 'sesudah' => null]);
        $jalur->delete();

        return response()->json(['message' => 'Jalur dihapus.']);
    }

    // ------------------------------------------------------------ persyaratan

    public function storePersyaratan(Request $request, PpdbPeriode $periode): JsonResponse
    {
        $data = $this->validasiPersyaratan($request, $periode);
        $p = $periode->persyaratan()->create($data + ['urutan' => (int) $periode->persyaratan()->max('urutan') + 1]);
        $this->logPpdb($request, $periode, 'persyaratan', "Menambahkan persyaratan \"{$p->nama}\".", ['sebelum' => null, 'sesudah' => $data]);

        return response()->json($p, 201);
    }

    public function updatePersyaratan(Request $request, PpdbPersyaratan $persyaratan): JsonResponse
    {
        $periode = PpdbPeriode::findOrFail($persyaratan->ppdb_periode_id);
        $data = $this->validasiPersyaratan($request, $periode);
        $lamaPs = $persyaratan->only(array_keys($data));
        $persyaratan->update($data);
        $this->logPpdb($request, $periode, 'persyaratan', "Mengubah persyaratan \"{$persyaratan->nama}\".", ['sebelum' => $lamaPs, 'sesudah' => $data]);

        return response()->json($persyaratan);
    }

    public function destroyPersyaratan(Request $request, PpdbPersyaratan $persyaratan): JsonResponse
    {
        $periode = PpdbPeriode::findOrFail($persyaratan->ppdb_periode_id);
        $this->logPpdb($request, $periode, 'persyaratan', "Menghapus persyaratan \"{$persyaratan->nama}\".", ['sebelum' => $persyaratan->only(['nama', 'tahap', 'wajib']), 'sesudah' => null]);
        $persyaratan->delete();

        return response()->json(['message' => 'Persyaratan dihapus.']);
    }

    // -------------------------------------------------------------- dashboard

    public function dashboard(Request $request): JsonResponse
    {
        $periode = $request->filled('periode_id')
            ? PpdbPeriode::with(['tahunAjaran:id,nama', 'jalur'])->findOrFail($request->integer('periode_id'))
            : (PpdbPeriode::with(['tahunAjaran:id,nama', 'jalur'])->where('status', '!=', 'selesai')->orderByDesc('id')->first() ?? PpdbPeriode::with(['tahunAjaran:id,nama', 'jalur'])->orderByDesc('id')->first());
        if (! $periode) {
            return response()->json(['periode' => null]);
        }

        $aktif = PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar');
        $semua = (clone $aktif)->get(['id', 'ppdb_jalur_id', 'jenis_kelamin', 'sekolah_asal', 'status_verifikasi', 'status_seleksi', 'status_daftar_ulang', 'status_penerimaan', 'created_at']);
        $n = fn ($c) => $c->count();

        $jumlah = [
            'pendaftar' => $n($semua),
            'dibatalkan' => PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'dibatalkan')->count(),
            'diverifikasi' => $n($semua->where('status_verifikasi', 'diverifikasi')),
            'belum_diverifikasi' => $n($semua->whereIn('status_verifikasi', ['belum', 'perlu_perbaikan'])),
            'ditolak_verifikasi' => $n($semua->where('status_verifikasi', 'ditolak')),
            'lolos' => $n($semua->where('status_seleksi', 'lolos')),
            'tidak_lolos' => $n($semua->where('status_seleksi', 'tidak_lolos')),
            'sudah_daftar_ulang' => $n($semua->where('status_daftar_ulang', 'sudah')),
            'belum_daftar_ulang' => $n($semua->where('status_seleksi', 'lolos')->where('status_daftar_ulang', 'belum')),
            'diterima' => $n($semua->where('status_penerimaan', 'diterima')),
        ];

        // Grafik per hari: maksimal 30 hari terakhir dalam rentang periode pendaftaran (mencakup tanggal data nyata).
        $tgl = $semua->map(fn ($p) => $p->created_at->toDateString());
        $akhir = Carbon::today()->min(Carbon::parse($periode->tanggal_selesai));
        $awal = Carbon::parse($periode->tanggal_mulai);
        if ($tgl->isNotEmpty()) {
            $akhir = $akhir->max(Carbon::parse($tgl->max()));
            $awal = $awal->min(Carbon::parse($tgl->min()));
        }
        $awal = $awal->max($akhir->copy()->subDays(29));
        $perHari = [];
        if ($awal->lte($akhir)) {
            $hitungHari = $tgl->countBy();
            for ($d = $awal->copy(); $d->lte($akhir); $d->addDay()) {
                $perHari[] = ['tanggal' => $d->toDateString(), 'jumlah' => $hitungHari[$d->toDateString()] ?? 0];
            }
        }

        $sekolah = $semua->groupBy(fn ($p) => $p->sekolah_asal ?: 'Tidak diisi')->map->count()->sortDesc();

        $perJalur = $periode->jalur->map(function (PpdbJalur $j) use ($semua) {
            $g = $semua->where('ppdb_jalur_id', $j->id);

            return [
                'id' => $j->id, 'nama' => $j->nama, 'kuota' => $j->kuota, 'aktif' => $j->aktif,
                'pendaftar' => $g->count(), 'lolos' => $g->where('status_seleksi', 'lolos')->count(),
                'sudah_daftar_ulang' => $g->where('status_daftar_ulang', 'sudah')->count(), 'diterima' => $g->where('status_penerimaan', 'diterima')->count(),
            ];
        })->values();

        $terbaru = PpdbPendaftar::with('jalur:id,nama')->where('ppdb_periode_id', $periode->id)->orderByDesc('id')->limit(6)->get()
            ->map(fn (PpdbPendaftar $p) => [
                'id' => $p->id, 'nomor_pendaftaran' => $p->nomor_pendaftaran, 'nama_lengkap' => $p->nama_lengkap, 'jalur' => $p->jalur?->nama,
                'status_pendaftaran' => $p->status_pendaftaran, 'status_verifikasi' => $p->status_verifikasi, 'status_verifikasi_label' => self::LABEL_VERIFIKASI[$p->status_verifikasi],
                'created_at' => $p->created_at,
            ]);

        return response()->json([
            'periode' => $this->present($periode),
            'jumlah' => $jumlah,
            'persen_kuota' => $periode->kuota > 0 ? (int) round($jumlah['diterima'] / $periode->kuota * 100) : null,
            'per_hari' => $perHari,
            'asal_sekolah' => $sekolah->take(8)->map(fn ($v, $k) => ['nama' => $k, 'jumlah' => $v])->values(),
            'asal_sekolah_lainnya' => max(0, $sekolah->count() - 8),
            'jenis_kelamin' => ['L' => $n($semua->where('jenis_kelamin', 'L')), 'P' => $n($semua->where('jenis_kelamin', 'P'))],
            'per_jalur' => $perJalur,
            'progres' => [
                ['label' => 'Pendaftar', 'jumlah' => $jumlah['pendaftar']],
                ['label' => 'Terverifikasi', 'jumlah' => $jumlah['diverifikasi']],
                ['label' => 'Lolos seleksi', 'jumlah' => $jumlah['lolos']],
                ['label' => 'Sudah daftar ulang', 'jumlah' => $jumlah['sudah_daftar_ulang']],
                ['label' => 'Diterima', 'jumlah' => $jumlah['diterima']],
            ],
            'terbaru' => $terbaru,
        ]);
    }

    // ------------------------------------------------------------- pembantu

    private function present(PpdbPeriode $p, bool $rinci = true): array
    {
        $hari = fn ($d) => $d ? substr((string) $d, 0, 10) : null;
        $base = [
            'id' => $p->id, 'tahun_ajaran_id' => $p->tahun_ajaran_id, 'tahun_ajaran' => $p->tahunAjaran?->nama, 'nama' => $p->nama, 'jenjang' => $p->jenjang,
            'tanggal_mulai' => $hari($p->tanggal_mulai), 'tanggal_selesai' => $hari($p->tanggal_selesai), 'kuota' => $p->kuota,
            'jumlah_rombel' => $p->jumlah_rombel, 'kapasitas_rombel' => $p->kapasitas_rombel,
            'jadwal_seleksi' => $hari($p->jadwal_seleksi), 'jadwal_pengumuman' => $hari($p->jadwal_pengumuman),
            'daftar_ulang_mulai' => $hari($p->daftar_ulang_mulai), 'daftar_ulang_selesai' => $hari($p->daftar_ulang_selesai),
            'status' => $p->status, 'status_label' => self::STATUS_PERIODE[$p->status],
            'pengumuman_terbit' => (bool) $p->pengumuman_terbit_at, 'pengumuman_terbit_at' => $p->pengumuman_terbit_at, 'catatan' => $p->catatan,
            'pendaftar_count' => $p->pendaftar_count ?? null,
            'daftar_ulang_terlambat' => $p->daftar_ulang_selesai ? Carbon::today()->gt(Carbon::parse($p->daftar_ulang_selesai)) : false,
        ];
        if (! $rinci) {
            return $base;
        }

        return $base + [
            'jalur' => $p->relationLoaded('jalur') ? $p->jalur->map(fn (PpdbJalur $j) => [
                'id' => $j->id, 'nama' => $j->nama, 'kuota' => $j->kuota, 'deskripsi' => $j->deskripsi, 'kriteria' => $j->kriteria ?? [],
                'nilai_minimal' => $j->nilai_minimal !== null ? (float) $j->nilai_minimal : null, 'aktif' => $j->aktif,
            ])->values() : [],
            'persyaratan' => $p->relationLoaded('persyaratan') ? $p->persyaratan->map(fn (PpdbPersyaratan $r) => [
                'id' => $r->id, 'ppdb_jalur_id' => $r->ppdb_jalur_id, 'tahap' => $r->tahap, 'nama' => $r->nama, 'wajib' => $r->wajib, 'keterangan' => $r->keterangan,
            ])->values() : [],
        ];
    }

    private function validasi(Request $request): array
    {
        $d = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'nama' => ['required', 'string', 'max:255'],
            'jenjang' => ['nullable', 'string', 'max:20'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'kuota' => ['required', 'integer', 'min:1', 'max:100000'],
            'jumlah_rombel' => ['nullable', 'integer', 'min:1', 'max:500'],
            'kapasitas_rombel' => ['nullable', 'integer', 'min:1', 'max:200'],
            'jadwal_seleksi' => ['nullable', 'date'],
            'jadwal_pengumuman' => ['nullable', 'date'],
            'daftar_ulang_mulai' => ['nullable', 'date'],
            'daftar_ulang_selesai' => ['nullable', 'date'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);
        $d['jenjang'] ??= tenant()->jenjang;

        $salah = [];
        if (($d['jumlah_rombel'] ?? null) && ($d['kapasitas_rombel'] ?? null) && $d['kuota'] > $d['jumlah_rombel'] * $d['kapasitas_rombel']) {
            $salah['kuota'] = "Kuota ({$d['kuota']}) melebihi daya tampung ".($d['jumlah_rombel'] * $d['kapasitas_rombel']).' siswa ('.$d['jumlah_rombel'].' rombel × '.$d['kapasitas_rombel'].').';
        }
        // Urutan jadwal: pendaftaran → seleksi → pengumuman → daftar ulang.
        $rantai = [
            'jadwal_seleksi' => 'tanggal_selesai',
            'jadwal_pengumuman' => 'jadwal_seleksi',
            'daftar_ulang_mulai' => 'jadwal_pengumuman',
            'daftar_ulang_selesai' => 'daftar_ulang_mulai',
        ];
        $label = ['tanggal_selesai' => 'akhir pendaftaran', 'jadwal_seleksi' => 'jadwal seleksi', 'jadwal_pengumuman' => 'jadwal pengumuman', 'daftar_ulang_mulai' => 'awal daftar ulang'];
        foreach ($rantai as $field => $sebelum) {
            if (! empty($d[$field])) {
                $acuan = $d[$sebelum] ?? ($sebelum !== 'tanggal_selesai' ? ($d['tanggal_selesai']) : null);
                if ($acuan && Carbon::parse($d[$field])->lt(Carbon::parse($acuan))) {
                    $salah[$field] = 'Tanggal tidak boleh lebih awal dari '.$label[$sebelum]." ({$acuan}).";
                }
            }
        }
        if ($salah) {
            throw ValidationException::withMessages($salah);
        }

        return $d;
    }

    private function validasiJalur(Request $request, PpdbPeriode $periode, ?PpdbJalur $jalur): array
    {
        $d = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'kuota' => ['required', 'integer', 'min:0', 'max:100000'],
            'deskripsi' => ['nullable', 'string', 'max:2000'],
            'kriteria' => ['nullable', 'array', 'max:15'],
            'kriteria.*.nama' => ['required', 'string', 'max:100', 'distinct'],
            'kriteria.*.bobot' => ['required', 'numeric', 'gt:0', 'max:1000'],
            'kriteria.*.maks' => ['nullable', 'numeric', 'gt:0', 'max:100000'],
            'nilai_minimal' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'aktif' => ['nullable', 'boolean'],
        ]);

        if ($periode->jalur()->where('nama', $d['nama'])->when($jalur, fn ($q) => $q->where('id', '!=', $jalur->id))->exists()) {
            throw ValidationException::withMessages(['nama' => 'Nama jalur sudah dipakai pada PPDB ini.']);
        }
        $lain = (int) $periode->jalur()->where('aktif', true)->when($jalur, fn ($q) => $q->where('id', '!=', $jalur->id))->sum('kuota');
        if (($d['aktif'] ?? true) && $lain + $d['kuota'] > $periode->kuota) {
            throw ValidationException::withMessages(['kuota' => "Total kuota jalur ({$lain} + {$d['kuota']}) melebihi kuota penerimaan {$periode->kuota}."]);
        }
        $d['kriteria'] = collect($d['kriteria'] ?? [])->map(fn ($k) => ['nama' => $k['nama'], 'bobot' => (float) $k['bobot'], 'maks' => (float) ($k['maks'] ?? 100)])->values()->all();
        $d['aktif'] = $d['aktif'] ?? true;

        return $d;
    }

    private function validasiPersyaratan(Request $request, PpdbPeriode $periode): array
    {
        $d = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'tahap' => ['required', 'in:pendaftaran,daftar_ulang'],
            'ppdb_jalur_id' => ['nullable', 'integer'],
            'wajib' => ['nullable', 'boolean'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ]);
        if (! empty($d['ppdb_jalur_id']) && ! $periode->jalur()->whereKey($d['ppdb_jalur_id'])->exists()) {
            throw ValidationException::withMessages(['ppdb_jalur_id' => 'Jalur tidak termasuk PPDB ini.']);
        }
        $d['ppdb_jalur_id'] = $d['ppdb_jalur_id'] ?? null;
        $d['wajib'] = $d['wajib'] ?? true;

        return $d;
    }
}

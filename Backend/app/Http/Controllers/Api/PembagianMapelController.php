<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\PembagianMapel;
use App\Models\StrukturKurikulum;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

/**
 * Pembagian mata pelajaran: menugaskan guru pengampu dan alokasi JP/minggu
 * untuk setiap mata pelajaran pada satu rombel, per tahun ajaran & semester.
 *
 * Terintegrasi dengan Struktur Kurikulum: struktur aktif untuk tahun ajaran
 * + tingkat rombel menjadi acuan — mata pelajaran yang tidak ada di struktur
 * ditolak, dan alokasi JP tidak boleh melebihi jp_per_minggu di struktur.
 * Beban guru dihitung dari pembagian yang tidak nonaktif dan hanya menjadi
 * peringatan (bukan penolakan), karena batasnya kebijakan tiap sekolah.
 */
class PembagianMapelController extends Controller
{
    /** Batas wajar total JP/minggu per guru; hanya dipakai untuk peringatan. */
    private const BATAS_JP_GURU = 40;

    private const LOG = 'pembagian-mapel';

    /** @var array<int, array{struktur: ?StrukturKurikulum, jp: array<int, int>}> */
    private array $strukturCache = [];

    public function index(Request $request): JsonResponse
    {
        $paged = PembagianMapel::query()
            ->with(['kelas:id,nama_kelas,tingkat,fase', 'mataPelajaran:id,nama_mapel,kode_mapel', 'guru:id,nama', 'tahunAjaran:id,nama'])
            ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
            ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')->value()))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
            ->when($request->filled('guru_id'), fn ($q) => $q->where('guru_id', $request->integer('guru_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()))
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->string('search')->trim().'%';
                $q->where(fn ($qq) => $qq
                    ->whereHas('kelas', fn ($k) => $k->where('nama_kelas', 'like', $like))
                    ->orWhereHas('mataPelajaran', fn ($m) => $m->where('nama_mapel', 'like', $like)->orWhere('kode_mapel', 'like', $like))
                    ->orWhereHas('guru', fn ($g) => $g->where('nama', 'like', $like)));
            })
            ->orderBy('kelas_id')
            ->orderBy('mata_pelajaran_id')
            ->paginate($request->integer('per_page', 15));

        $paged->getCollection()->transform(fn (PembagianMapel $p) => $this->present($p));

        return response()->json($paged);
    }

    /**
     * Pilihan untuk form: rombel aktif pada tahun ajaran, guru beserta beban
     * JP saat ini, dan — bila rombel dipilih — daftar mapel dari Struktur
     * Kurikulum yang menjadi acuan.
     */
    public function opsi(Request $request): JsonResponse
    {
        $tahunAjaranId = $request->integer('tahun_ajaran_id') ?: null;
        $semester = $request->filled('semester') ? $request->string('semester')->value() : null;

        $beban = $tahunAjaranId && $semester
            ? PembagianMapel::where('tahun_ajaran_id', $tahunAjaranId)->where('semester', $semester)->where('status', '!=', 'nonaktif')
                ->selectRaw('guru_id, sum(alokasi_jp) as total')->groupBy('guru_id')->pluck('total', 'guru_id')
            : collect();

        $struktur = null;
        if ($request->filled('kelas_id') && ($kelas = Kelas::find($request->integer('kelas_id')))) {
            $info = $this->strukturUntuk($kelas);
            if ($info['struktur']) {
                $struktur = [
                    'id' => $info['struktur']->id,
                    'kurikulum' => $info['struktur']->kurikulum,
                    'tingkat' => $info['struktur']->tingkat,
                    'fase' => $info['struktur']->fase,
                    'mapel' => $info['struktur']->mapel
                        ->whereNotNull('mata_pelajaran_id')
                        ->map(fn ($m) => [
                            'mata_pelajaran_id' => $m->mata_pelajaran_id,
                            'nama' => $m->mataPelajaran?->nama_mapel,
                            'jp_per_minggu' => $m->jp_per_minggu,
                        ])->values(),
                ];
            }
        }

        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'rombel' => Kelas::where('status', 'aktif')
                ->when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
                ->orderBy('tingkat')->orderBy('nama_kelas')
                ->get(['id', 'nama_kelas', 'tingkat', 'fase', 'tahun_ajaran_id']),
            'mata_pelajaran' => MataPelajaran::where('status', 'aktif')->orderBy('nama_mapel')->get(['id', 'nama_mapel', 'kode_mapel', 'alokasi_jp_default']),
            'guru' => Guru::orderBy('nama')->get(['id', 'nama'])->map(fn (Guru $g) => [
                'id' => $g->id,
                'nama' => $g->nama,
                'beban_jp' => (int) ($beban[$g->id] ?? 0),
            ]),
            'struktur' => $struktur,
            'batas_jp_guru' => self::BATAS_JP_GURU,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePembagian($request);
        $this->assertKonteks($data);

        $pembagian = PembagianMapel::create($data + ['dibuat_oleh' => $request->user()?->id]);
        $this->muat($pembagian);

        $this->log($request, $pembagian, 'created', "Menambahkan pembagian {$this->label($pembagian)}.", ['new' => $this->snapshot($pembagian)]);

        return response()->json($this->present($pembagian, true), 201);
    }

    public function show(PembagianMapel $pembagianMapel): JsonResponse
    {
        $this->muat($pembagianMapel);

        return response()->json($this->present($pembagianMapel, true));
    }

    public function update(Request $request, PembagianMapel $pembagianMapel): JsonResponse
    {
        $data = $this->validatePembagian($request);
        $this->assertKonteks($data, $pembagianMapel);

        $this->muat($pembagianMapel);
        $old = $this->snapshot($pembagianMapel);

        $pembagianMapel->update($data);
        $this->muat($pembagianMapel->refresh());
        $new = $this->snapshot($pembagianMapel);

        if ($old !== $new) {
            $this->log($request, $pembagianMapel, 'updated', "Memperbarui pembagian {$this->label($pembagianMapel)}.", ['old' => $old, 'new' => $new]);
        }

        return response()->json($this->present($pembagianMapel, true));
    }

    /** Ubah status satu atau banyak pembagian sekaligus. */
    public function updateStatus(Request $request): JsonResponse
    {
        $input = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'exists:pembagian_mapel,id'],
            'status' => ['required', 'in:draft,aktif,nonaktif'],
        ]);

        $jumlah = 0;
        DB::transaction(function () use ($input, $request, &$jumlah) {
            foreach (PembagianMapel::with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama', 'tahunAjaran:id,nama'])->whereIn('id', $input['ids'])->get() as $p) {
                if ($p->status === $input['status']) {
                    continue;
                }
                $lama = $p->status;
                $p->update(['status' => $input['status']]);
                $jumlah++;
                $this->log($request, $p, 'updated', "Mengubah status pembagian {$this->label($p)} dari {$lama} menjadi {$input['status']}.", [
                    'old' => ['status' => $lama],
                    'new' => ['status' => $input['status']],
                ]);
            }
        });

        return response()->json(['message' => "{$jumlah} pembagian diubah menjadi {$input['status']}.", 'diubah' => $jumlah]);
    }

    public function destroy(Request $request, PembagianMapel $pembagianMapel): JsonResponse
    {
        $this->muat($pembagianMapel);
        $this->log($request, $pembagianMapel, 'deleted', "Menghapus pembagian {$this->label($pembagianMapel)}.", ['old' => $this->snapshot($pembagianMapel)]);
        $pembagianMapel->delete();

        return response()->json(['message' => 'Pembagian berhasil dihapus.']);
    }

    /** Beban mengajar per guru (total JP/minggu) beserta rinciannya. */
    public function beban(Request $request): JsonResponse
    {
        $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'batas_jp' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $batas = $request->integer('batas_jp') ?: self::BATAS_JP_GURU;

        $rows = PembagianMapel::query()
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id'))
            ->where('semester', $request->string('semester')->value())
            ->where('status', '!=', 'nonaktif')
            ->get()
            ->groupBy('guru_id');

        $guru = Guru::orderBy('nama')->get(['id', 'nama'])->map(function (Guru $g) use ($rows, $batas) {
            $items = $rows->get($g->id, collect());
            $total = (int) $items->sum('alokasi_jp');

            return [
                'guru_id' => $g->id,
                'nama' => $g->nama,
                'total_jp' => $total,
                'jumlah_rombel' => $items->pluck('kelas_id')->unique()->count(),
                'jumlah_mapel' => $items->pluck('mata_pelajaran_id')->unique()->count(),
                'melebihi_batas' => $total > $batas,
                'rincian' => $items->map(fn (PembagianMapel $p) => [
                    'id' => $p->id,
                    'rombel' => $p->kelas?->nama_kelas,
                    'mata_pelajaran' => $p->mataPelajaran?->nama_mapel,
                    'alokasi_jp' => $p->alokasi_jp,
                    'status' => $p->status,
                ])->values(),
            ];
        })->sortByDesc('total_jp')->values();

        return response()->json(['batas_jp' => $batas, 'guru' => $guru]);
    }

    /**
     * Progres pembagian per rombel terhadap Struktur Kurikulum: berapa mata
     * pelajaran struktur yang sudah dibagikan/diaktifkan dan mana yang belum
     * atau JP-nya kurang.
     */
    public function monitoring(Request $request): JsonResponse
    {
        $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
        ]);
        $tahunAjaranId = $request->integer('tahun_ajaran_id');

        $pembagian = PembagianMapel::query()
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('semester', $request->string('semester')->value())
            ->where('status', '!=', 'nonaktif')
            ->get()
            ->groupBy('kelas_id');

        $rombel = Kelas::where('tahun_ajaran_id', $tahunAjaranId)->where('status', 'aktif')
            ->orderBy('tingkat')->orderBy('nama_kelas')->get()
            ->map(function (Kelas $kelas) use ($pembagian) {
                $rows = $pembagian->get($kelas->id, collect())->keyBy('mata_pelajaran_id');
                $info = $this->strukturUntuk($kelas);

                if (! $info['struktur']) {
                    return [
                        'kelas_id' => $kelas->id,
                        'nama_kelas' => $kelas->nama_kelas,
                        'tingkat' => $kelas->tingkat,
                        'struktur' => null,
                        'jumlah_dibagi' => $rows->count(),
                    ];
                }

                $mapelStruktur = $info['struktur']->mapel->whereNotNull('mata_pelajaran_id');
                $belum = [];
                $kurang = [];
                $terbagi = 0;
                $aktif = 0;
                foreach ($mapelStruktur as $m) {
                    $row = $rows->get($m->mata_pelajaran_id);
                    if (! $row) {
                        $belum[] = $m->mataPelajaran?->nama_mapel;

                        continue;
                    }
                    $terbagi++;
                    if ($row->status === 'aktif') {
                        $aktif++;
                    }
                    if ($row->alokasi_jp < $m->jp_per_minggu) {
                        $kurang[] = "{$m->mataPelajaran?->nama_mapel} ({$row->alokasi_jp}/{$m->jp_per_minggu} JP)";
                    }
                }
                $total = $mapelStruktur->count();

                return [
                    'kelas_id' => $kelas->id,
                    'nama_kelas' => $kelas->nama_kelas,
                    'tingkat' => $kelas->tingkat,
                    'struktur' => ['id' => $info['struktur']->id, 'kurikulum' => $info['struktur']->kurikulum],
                    'total_mapel' => $total,
                    'jumlah_dibagi' => $terbagi,
                    'jumlah_aktif' => $aktif,
                    'jp_struktur' => (int) $mapelStruktur->sum('jp_per_minggu'),
                    'jp_dibagi' => (int) $rows->sum('alokasi_jp'),
                    'persen_dibagi' => $total > 0 ? (int) round($terbagi / $total * 100) : 0,
                    'persen_aktif' => $total > 0 ? (int) round($aktif / $total * 100) : 0,
                    'belum_dibagi' => $belum,
                    'jp_kurang' => $kurang,
                ];
            })->values();

        $denganStruktur = $rombel->whereNotNull('struktur');

        return response()->json([
            'ringkasan' => [
                'jumlah_rombel' => $rombel->count(),
                'tanpa_struktur' => $rombel->count() - $denganStruktur->count(),
                'lengkap' => $denganStruktur->filter(fn ($r) => $r['total_mapel'] > 0 && $r['jumlah_dibagi'] === $r['total_mapel'])->count(),
            ],
            'rombel' => $rombel,
        ]);
    }

    /**
     * Salin pembagian dari satu tahun ajaran/semester ke yang lain. Antar
     * tahun ajaran, rombel dicocokkan lewat nama kelas. Hasil salinan
     * berstatus draft; baris yang sudah ada atau tidak punya rombel padanan
     * dilewati dan dilaporkan.
     */
    public function duplikasi(Request $request): JsonResponse
    {
        $input = $request->validate([
            'sumber_tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'sumber_semester' => ['required', 'in:ganjil,genap'],
            'tujuan_tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'tujuan_semester' => ['required', 'in:ganjil,genap'],
        ]);

        if ((int) $input['sumber_tahun_ajaran_id'] === (int) $input['tujuan_tahun_ajaran_id'] && $input['sumber_semester'] === $input['tujuan_semester']) {
            throw ValidationException::withMessages(['tujuan_semester' => 'Sumber dan tujuan tidak boleh sama.']);
        }

        $sumber = PembagianMapel::with('kelas:id,nama_kelas')
            ->where('tahun_ajaran_id', $input['sumber_tahun_ajaran_id'])
            ->where('semester', $input['sumber_semester'])
            ->where('status', '!=', 'nonaktif')
            ->get();
        if ($sumber->isEmpty()) {
            throw ValidationException::withMessages(['sumber_tahun_ajaran_id' => 'Tidak ada pembagian pada sumber tersebut.']);
        }

        $mengikutiTahun = (int) $input['sumber_tahun_ajaran_id'] !== (int) $input['tujuan_tahun_ajaran_id'];
        $kelasTujuan = Kelas::where('tahun_ajaran_id', $input['tujuan_tahun_ajaran_id'])->where('status', 'aktif')->get()->keyBy('nama_kelas');

        $dibuat = 0;
        $sudahAda = 0;
        $errors = [];

        DB::transaction(function () use ($sumber, $input, $mengikutiTahun, $kelasTujuan, $request, &$dibuat, &$sudahAda, &$errors) {
            foreach ($sumber as $p) {
                $kelasId = $p->kelas_id;
                if ($mengikutiTahun) {
                    $kelasId = $kelasTujuan->get($p->kelas?->nama_kelas)?->id;
                    if (! $kelasId) {
                        $errors[$p->kelas?->nama_kelas] = "Rombel \"{$p->kelas?->nama_kelas}\" tidak ada (atau nonaktif) di tahun ajaran tujuan, pembagiannya dilewati.";

                        continue;
                    }
                }

                $kunci = [
                    'tahun_ajaran_id' => $input['tujuan_tahun_ajaran_id'],
                    'semester' => $input['tujuan_semester'],
                    'kelas_id' => $kelasId,
                    'mata_pelajaran_id' => $p->mata_pelajaran_id,
                ];
                if (PembagianMapel::where($kunci)->exists()) {
                    $sudahAda++;

                    continue;
                }

                PembagianMapel::create($kunci + [
                    'guru_id' => $p->guru_id,
                    'alokasi_jp' => $p->alokasi_jp,
                    'status' => 'draft',
                    'dibuat_oleh' => $request->user()?->id,
                ]);
                $dibuat++;
            }
        });

        activity(self::LOG)
            ->causedBy($request->user())
            ->event('duplicated')
            ->withProperties($input + ['dibuat' => $dibuat, 'sudah_ada' => $sudahAda])
            ->log("Menduplikasi pembagian mata pelajaran: {$dibuat} baris dibuat, {$sudahAda} sudah ada.");

        return response()->json([
            'message' => "{$dibuat} pembagian disalin sebagai draft.",
            'dibuat' => $dibuat,
            'sudah_ada' => $sudahAda,
            'errors' => array_values($errors),
        ]);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $riwayat = Activity::where('log_name', self::LOG)
            ->when($request->filled('pembagian_id'), fn ($q) => $q->where('subject_id', $request->integer('pembagian_id')))
            ->with('causer:id,name')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (Activity $a) => [
                'id' => $a->id,
                'event' => $a->event,
                'description' => $a->description,
                'causer' => $a->causer?->name,
                'properties' => $a->properties,
                'created_at' => $a->created_at,
            ]);

        return response()->json($riwayat);
    }

    private function validatePembagian(Request $request): array
    {
        return $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'kelas_id' => ['required', 'integer', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'integer', 'exists:mata_pelajaran,id'],
            'guru_id' => ['required', 'integer', 'exists:guru,id'],
            'alokasi_jp' => ['required', 'integer', 'min:1', 'max:40'],
            'status' => ['required', 'in:draft,aktif,nonaktif'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    /**
     * Validasi yang butuh konteks: rombel harus aktif dan milik tahun ajaran
     * yang dipilih, mapel aktif, kombinasi unik, serta selaras dengan Struktur
     * Kurikulum bila struktur aktif untuk rombel tersebut ada.
     */
    private function assertKonteks(array $data, ?PembagianMapel $existing = null): void
    {
        $kelas = Kelas::findOrFail($data['kelas_id']);
        if ((int) $kelas->tahun_ajaran_id !== (int) $data['tahun_ajaran_id']) {
            throw ValidationException::withMessages(['kelas_id' => "Rombel {$kelas->nama_kelas} bukan bagian dari tahun ajaran yang dipilih."]);
        }
        if ($kelas->status !== 'aktif' && (! $existing || (int) $existing->kelas_id !== $kelas->id)) {
            throw ValidationException::withMessages(['kelas_id' => "Rombel {$kelas->nama_kelas} nonaktif."]);
        }

        $mapel = MataPelajaran::findOrFail($data['mata_pelajaran_id']);
        if ($mapel->status === 'nonaktif' && (! $existing || (int) $existing->mata_pelajaran_id !== $mapel->id)) {
            throw ValidationException::withMessages(['mata_pelajaran_id' => "Mata pelajaran {$mapel->nama_mapel} nonaktif."]);
        }

        $duplikat = PembagianMapel::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('semester', $data['semester'])
            ->where('kelas_id', $data['kelas_id'])
            ->where('mata_pelajaran_id', $data['mata_pelajaran_id'])
            ->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))
            ->exists();
        if ($duplikat) {
            throw ValidationException::withMessages([
                'mata_pelajaran_id' => "{$mapel->nama_mapel} sudah dibagikan pada rombel {$kelas->nama_kelas} untuk semester {$data['semester']}.",
            ]);
        }

        $info = $this->strukturUntuk($kelas);
        if ($info['struktur']) {
            if (! array_key_exists($mapel->id, $info['jp'])) {
                throw ValidationException::withMessages([
                    'mata_pelajaran_id' => "{$mapel->nama_mapel} tidak ada di Struktur Kurikulum {$info['struktur']->kurikulum} tingkat {$info['struktur']->tingkat}.",
                ]);
            }
            if ($data['alokasi_jp'] > $info['jp'][$mapel->id]) {
                throw ValidationException::withMessages([
                    'alokasi_jp' => "Alokasi {$data['alokasi_jp']} JP melebihi ketentuan Struktur Kurikulum ({$info['jp'][$mapel->id]} JP/minggu) untuk {$mapel->nama_mapel}.",
                ]);
            }
        }
    }

    /**
     * Struktur Kurikulum aktif untuk rombel: tahun ajaran + tingkat sama,
     * memprioritaskan fase yang sama.
     *
     * @return array{struktur: ?StrukturKurikulum, jp: array<int, int>}
     */
    private function strukturUntuk(Kelas $kelas): array
    {
        if (isset($this->strukturCache[$kelas->id])) {
            return $this->strukturCache[$kelas->id];
        }

        $struktur = null;
        if ($kelas->tahun_ajaran_id && $kelas->tingkat) {
            $struktur = StrukturKurikulum::with('mapel.mataPelajaran:id,nama_mapel')
                ->where('tahun_ajaran_id', $kelas->tahun_ajaran_id)
                ->where('tingkat', $kelas->tingkat)
                ->where('is_aktif', true)
                ->get()
                ->sortByDesc(fn (StrukturKurikulum $s) => $kelas->fase && $s->fase === $kelas->fase ? 1 : 0)
                ->first();
        }

        $jp = [];
        foreach ($struktur?->mapel ?? [] as $m) {
            if ($m->mata_pelajaran_id) {
                $jp[$m->mata_pelajaran_id] = ($jp[$m->mata_pelajaran_id] ?? 0) + $m->jp_per_minggu;
            }
        }

        return $this->strukturCache[$kelas->id] = ['struktur' => $struktur, 'jp' => $jp];
    }

    private function present(PembagianMapel $p, bool $denganPeringatan = false): array
    {
        $this->muat($p);
        $info = $p->kelas ? $this->strukturUntuk($p->kelas) : ['struktur' => null, 'jp' => []];
        $jpStruktur = $info['jp'][$p->mata_pelajaran_id] ?? null;

        $data = [...$p->toArray(), 'jp_struktur' => $jpStruktur, 'ada_struktur' => $info['struktur'] !== null];

        if ($denganPeringatan) {
            $total = (int) PembagianMapel::where('tahun_ajaran_id', $p->tahun_ajaran_id)
                ->where('semester', $p->semester)->where('guru_id', $p->guru_id)->where('status', '!=', 'nonaktif')->sum('alokasi_jp');
            $data['beban_guru'] = ['total_jp' => $total, 'batas_jp' => self::BATAS_JP_GURU];
            $data['peringatan'] = $total > self::BATAS_JP_GURU
                ? ["Beban mengajar {$p->guru?->nama} kini {$total} JP/minggu, melebihi batas ".self::BATAS_JP_GURU.' JP.']
                : [];
        }

        return $data;
    }

    private function muat(PembagianMapel $p): void
    {
        $p->loadMissing(['kelas:id,nama_kelas,tingkat,fase,tahun_ajaran_id,status', 'mataPelajaran:id,nama_mapel,kode_mapel', 'guru:id,nama', 'tahunAjaran:id,nama']);
    }

    private function snapshot(PembagianMapel $p): array
    {
        $this->muat($p);

        return [
            'tahun_ajaran' => $p->tahunAjaran?->nama,
            'semester' => $p->semester,
            'rombel' => $p->kelas?->nama_kelas,
            'mata_pelajaran' => $p->mataPelajaran?->nama_mapel,
            'guru' => $p->guru?->nama,
            'alokasi_jp' => $p->alokasi_jp,
            'status' => $p->status,
            'catatan' => $p->catatan,
        ];
    }

    private function label(PembagianMapel $p): string
    {
        $this->muat($p);

        return "{$p->mataPelajaran?->nama_mapel} — {$p->kelas?->nama_kelas} ({$p->tahunAjaran?->nama} {$p->semester})";
    }

    private function log(Request $request, PembagianMapel $p, string $event, string $deskripsi, array $properties): void
    {
        activity(self::LOG)
            ->performedOn($p)
            ->causedBy($request->user())
            ->event($event)
            ->withProperties($properties)
            ->log($deskripsi);
    }
}

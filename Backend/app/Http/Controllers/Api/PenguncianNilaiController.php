<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PenguncianNilai;
use App\Models\VerifikasiNilai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

/**
 * Penguncian nilai per tahun ajaran × semester × rombel × mata pelajaran.
 * Selama terkunci, NilaiController menolak (423) tambah/ubah/hapus nilai yang
 * termasuk cakupan itu — kunci berlaku untuk semua peran, termasuk admin.
 *
 * Mengunci butuh hak nilai.lock, wajib konfirmasi, dan dicek kelengkapannya
 * (bawaan: harus lengkap; yang belum lengkap hanya boleh dikunci bila
 * pengguna secara eksplisit melanjutkan). Membuka kunci wajib memakai catatan.
 * Setiap kunci/buka tercatat di riwayat. Kelengkapan memakai perhitungan
 * yang sama dengan Monitoring Nilai.
 */
class PenguncianNilaiController extends Controller
{
    private const LOG = 'penguncian-nilai';

    public function __construct(private readonly MonitoringNilaiController $monitoring) {}

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'status_kunci' => ['nullable', 'in:terkunci,tidak_terkunci'],
        ]);

        $hasil = $this->monitoring->bangun($this->requestMonitoring($request));
        $kunci = PenguncianNilai::with(['pengunci:id,name', 'pembuka:id,name'])
            ->where('tahun_ajaran_id', $in['tahun_ajaran_id'])->where('semester', $in['semester'])->get()
            ->keyBy(fn ($k) => "{$k->kelas_id}|{$k->mata_pelajaran_id}");

        $rows = $hasil['rows']->map(fn (array $r) => $this->gabung($this->bersih($r), $kunci->get("{$r['kelas']['id']}|{$r['mata_pelajaran']['id']}")))
            ->when(! empty($in['status_kunci']), fn ($c) => $c->filter(fn ($r) => $r['status_kunci'] === $in['status_kunci']))
            ->values();

        return response()->json([
            'konteks' => $hasil['konteks'],
            'bisa_mengunci' => (bool) $request->user()?->can('nilai.lock'),
            'ringkasan' => [
                'jumlah_baris' => $rows->count(),
                'terkunci' => $rows->where('status_kunci', 'terkunci')->count(),
                'tidak_terkunci' => $rows->where('status_kunci', 'tidak_terkunci')->count(),
                'siap_dikunci' => $rows->where('status_kunci', 'tidak_terkunci')->where('status', 'lengkap')->count(),
            ],
            'rows' => $rows,
        ]);
    }

    /** Cek kelengkapan satu rombel × mapel sebelum penguncian. */
    public function cek(Request $request): JsonResponse
    {
        $row = $this->barisTunggal($request, true);
        $kunci = $this->cariKunci($request);

        return response()->json([
            'baris' => $this->gabung($this->bersih($row), $kunci),
            'siswa' => $row['_siswa'],
            'dapat_dikunci' => $row['jumlah_nilai'] > 0 && $kunci?->status !== 'terkunci',
            'lengkap' => $row['status'] === 'lengkap',
        ]);
    }

    public function kunci(Request $request): JsonResponse
    {
        $data = $request->validate([
            'konfirmasi' => ['accepted'],
            'lanjutkan_tidak_lengkap' => ['boolean'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);
        $row = $this->barisTunggal($request);
        $this->pastikanBisaDikunci($row, (bool) ($data['lanjutkan_tidak_lengkap'] ?? false));

        $kunci = $this->terapkanKunci($request, $row, $data['catatan'] ?? null, (bool) ($data['lanjutkan_tidak_lengkap'] ?? false));

        return response()->json($this->gabung($this->bersih($row), $kunci->load(['pengunci:id,name', 'pembuka:id,name'])));
    }

    /** Kunci beberapa rombel × mapel sekaligus; hanya yang kelengkapannya 100% yang dikunci. */
    public function kunciMassal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'konfirmasi' => ['accepted'],
            'catatan' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.kelas_id' => ['required', 'integer'],
            'items.*.mata_pelajaran_id' => ['required', 'integer'],
        ]);

        $hasil = $this->monitoring->bangun(Request::create('/', 'GET', [
            'tahun_ajaran_id' => $data['tahun_ajaran_id'],
            'semester' => $data['semester'],
            'jenis_wajib' => (string) $request->input('jenis_wajib', ''),
        ]));
        $rows = $hasil['rows']->keyBy(fn ($r) => "{$r['kelas']['id']}|{$r['mata_pelajaran']['id']}");

        $dikunci = 0;
        $dilewati = [];
        foreach ($data['items'] as $item) {
            $row = $rows->get("{$item['kelas_id']}|{$item['mata_pelajaran_id']}");
            if (! $row) {
                $dilewati[] = 'Rombel/mata pelajaran tidak ditemukan pada periode ini.';

                continue;
            }
            $row += ['_konteks' => $hasil['konteks']];
            $nama = "{$row['kelas']['nama_kelas']} — {$row['mata_pelajaran']['nama_mapel']}";
            try {
                $this->pastikanBisaDikunci($row, false);
            } catch (ValidationException $e) {
                $dilewati[] = "{$nama}: ".collect($e->errors())->flatten()->first();

                continue;
            }
            $this->terapkanKunci($request, $row, $data['catatan'] ?? null, false);
            $dikunci++;
        }

        return response()->json(['message' => "{$dikunci} nilai dikunci.", 'dikunci' => $dikunci, 'dilewati' => $dilewati]);
    }

    public function bukaKunci(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'kelas_id' => ['required', 'integer', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'integer', 'exists:mata_pelajaran,id'],
            'catatan_buka' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        $kunci = PenguncianNilai::with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'tahunAjaran:id,nama'])
            ->where(collect($data)->only(['tahun_ajaran_id', 'semester', 'kelas_id', 'mata_pelajaran_id'])->all())->first();
        if (! $kunci || $kunci->status !== 'terkunci') {
            throw ValidationException::withMessages(['status' => 'Nilai ini tidak sedang terkunci.']);
        }

        $kunci->update([
            'status' => 'terbuka',
            'dibuka_oleh' => $request->user()?->id,
            'tanggal_buka' => now(),
            'catatan_buka' => $data['catatan_buka'],
        ]);

        activity(self::LOG)->performedOn($kunci)->causedBy($request->user())->event('unlocked')
            ->withProperties($this->properti($kunci) + ['catatan' => $data['catatan_buka']])
            ->log("Membuka kunci nilai {$this->nama($kunci)}.");

        // Persetujuan verifikasi tidak berlaku lagi bila nilai bisa berubah kembali.
        $verifikasi = VerifikasiNilai::where(collect($data)->only(['tahun_ajaran_id', 'semester', 'kelas_id', 'mata_pelajaran_id'])->all())->where('status', 'disetujui')->first();
        if ($verifikasi) {
            $verifikasi->update(['status' => 'kedaluwarsa']);
            activity('verifikasi-nilai')->performedOn($verifikasi)->causedBy($request->user())->event('kedaluwarsa')
                ->withProperties($this->properti($kunci) + ['catatan' => $data['catatan_buka'], 'status_sebelumnya' => 'disetujui'])
                ->log("Persetujuan verifikasi nilai {$this->nama($kunci)} kedaluwarsa karena kunci dibuka.");
        }

        return response()->json(['message' => 'Kunci nilai dibuka. Guru dapat mengubah nilai kembali.']);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $ids = null;
        if ($request->filled(['tahun_ajaran_id', 'semester']) || $request->filled('kelas_id') || $request->filled('mata_pelajaran_id')) {
            $ids = PenguncianNilai::query()
                ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
                ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')->value()))
                ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
                ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
                ->pluck('id');
        }

        return response()->json(
            Activity::where('log_name', self::LOG)->where('subject_type', PenguncianNilai::class)
                ->when($ids !== null, fn ($q) => $q->whereIn('subject_id', $ids))
                ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(100)->get()
                ->map(fn (Activity $a) => [
                    'id' => $a->id,
                    'event' => $a->event,
                    'description' => $a->description,
                    'causer' => $a->causer?->name,
                    'properties' => $a->properties,
                    'created_at' => $a->created_at,
                ])
        );
    }

    /** Request untuk MonitoringNilaiController: hanya parameter yang dikenalnya. */
    private function requestMonitoring(Request $request): Request
    {
        return Request::create('/', 'GET', $request->only(['tahun_ajaran_id', 'semester', 'jenis_wajib', 'kelas_id', 'mata_pelajaran_id', 'guru_id', 'search']) + [
            'status' => $request->input('status_kelengkapan'),
        ]);
    }

    private function barisTunggal(Request $request, bool $denganSiswa = false): array
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'kelas_id' => ['required', 'integer', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'integer', 'exists:mata_pelajaran,id'],
        ]);
        $hasil = $this->monitoring->bangun(Request::create('/', 'GET', $in + ['jenis_wajib' => (string) $request->input('jenis_wajib', '')]), $denganSiswa);
        $row = $hasil['rows']->first(fn ($r) => $r['kelas']['id'] === (int) $in['kelas_id'] && $r['mata_pelajaran']['id'] === (int) $in['mata_pelajaran_id']);
        if (! $row) {
            throw ValidationException::withMessages(['kelas_id' => 'Rombel tidak termasuk tahun ajaran ini atau belum memiliki data untuk mata pelajaran tersebut.']);
        }

        return $row + ['_konteks' => $hasil['konteks']];
    }

    private function cariKunci(Request $request): ?PenguncianNilai
    {
        return PenguncianNilai::with(['pengunci:id,name', 'pembuka:id,name'])->where([
            'tahun_ajaran_id' => $request->integer('tahun_ajaran_id'),
            'semester' => $request->string('semester')->value(),
            'kelas_id' => $request->integer('kelas_id'),
            'mata_pelajaran_id' => $request->integer('mata_pelajaran_id'),
        ])->first();
    }

    private function pastikanBisaDikunci(array $row, bool $lanjutkanTidakLengkap): void
    {
        $kunci = PenguncianNilai::where([
            'tahun_ajaran_id' => $row['_konteks']['tahun_ajaran_id'] ?? null,
            'semester' => $row['_konteks']['semester'] ?? null,
            'kelas_id' => $row['kelas']['id'],
            'mata_pelajaran_id' => $row['mata_pelajaran']['id'],
        ])->first();
        if ($kunci?->status === 'terkunci') {
            throw ValidationException::withMessages(['status' => 'Nilai ini sudah terkunci.']);
        }
        if ($row['jumlah_nilai'] === 0) {
            throw ValidationException::withMessages(['status' => 'Belum ada nilai yang bisa dikunci.']);
        }
        if ($row['status'] !== 'lengkap' && ! $lanjutkanTidakLengkap) {
            throw ValidationException::withMessages([
                'status' => "Nilai belum lengkap ({$row['persen']}%, {$row['nilai_belum']} komponen belum terisi). Lengkapi terlebih dahulu atau lanjutkan penguncian secara eksplisit.",
            ]);
        }
    }

    private function terapkanKunci(Request $request, array $row, ?string $catatan, bool $tidakLengkap): PenguncianNilai
    {
        $konteks = $row['_konteks'];
        $kunci = PenguncianNilai::updateOrCreate(
            ['tahun_ajaran_id' => $konteks['tahun_ajaran_id'], 'semester' => $konteks['semester'], 'kelas_id' => $row['kelas']['id'], 'mata_pelajaran_id' => $row['mata_pelajaran']['id']],
            [
                'status' => 'terkunci',
                'persen_saat_kunci' => $row['persen'],
                'jumlah_nilai_saat_kunci' => $row['jumlah_nilai'],
                'catatan_kunci' => $catatan,
                'dikunci_oleh' => $request->user()?->id,
                'tanggal_kunci' => now(),
                'dibuka_oleh' => null,
                'tanggal_buka' => null,
                'catatan_buka' => null,
            ]
        );
        $kunci->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'tahunAjaran:id,nama']);

        activity(self::LOG)->performedOn($kunci)->causedBy($request->user())->event('locked')
            ->withProperties($this->properti($kunci) + ['catatan' => $catatan, 'tidak_lengkap' => $tidakLengkap])
            ->log("Mengunci nilai {$this->nama($kunci)} (kelengkapan {$kunci->persen_saat_kunci}%).");

        return $kunci;
    }

    private function gabung(array $row, ?PenguncianNilai $k): array
    {
        $terkunci = $k?->status === 'terkunci';

        return $row + [
            'status_kunci' => $terkunci ? 'terkunci' : 'tidak_terkunci',
            'penguncian_id' => $k?->id,
            'tanggal_kunci' => $terkunci ? $k->tanggal_kunci : null,
            'pengunci' => $terkunci ? $k->pengunci?->name : null,
            'catatan_kunci' => $terkunci ? $k->catatan_kunci : null,
            'persen_saat_kunci' => $terkunci ? $k->persen_saat_kunci : null,
            'pernah_dibuka' => $k?->tanggal_buka !== null,
            'tanggal_buka' => $k?->tanggal_buka,
            'pembuka' => $k?->pembuka?->name,
            'catatan_buka' => $k?->catatan_buka,
        ];
    }

    private function bersih(array $row): array
    {
        return array_filter($row, fn ($key) => ! str_starts_with((string) $key, '_'), ARRAY_FILTER_USE_KEY);
    }

    private function properti(PenguncianNilai $k): array
    {
        return [
            'tahun_ajaran' => $k->tahunAjaran?->nama,
            'semester' => $k->semester,
            'rombel' => $k->kelas?->nama_kelas,
            'mata_pelajaran' => $k->mataPelajaran?->nama_mapel,
            'persen' => $k->persen_saat_kunci,
        ];
    }

    private function nama(PenguncianNilai $k): string
    {
        return "{$k->mataPelajaran?->nama_mapel} — {$k->kelas?->nama_kelas} ({$k->tahunAjaran?->nama} {$k->semester})";
    }
}

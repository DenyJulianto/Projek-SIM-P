<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\Nilai;
use App\Models\PenerbitanRapor;
use App\Models\Rapor;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\VerifikasiNilai;
use App\Settings\RaporTemplateSettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;

/**
 * Penerbitan rapor per siswa × tahun ajaran × semester.
 *
 * Alur: generate (draft, isi rapor dibekukan) → ajukan pengesahan → disahkan
 * (memakai tabel rapor/pengesahan yang sudah ada, oleh pengguna rapor.approve)
 * → terbitkan (nomor rapor + tanggal terbit) → dapat dicabut. Siswa/orang tua
 * hanya bisa mengunduh rapor yang sudah diterbitkan (lihat RaporController).
 *
 * Syarat terbit: nilai seluruh mata pelajaran rombel lengkap dan disetujui di
 * Verifikasi Nilai, rapor sudah disahkan, ada wali kelas, NIS terisi, dan
 * penandatangan rapor terisi di pengaturan template. Syarat generate lebih
 * ringan: siswa aktif berrombel dan sudah punya nilai.
 */
class PenerbitanRaporController extends Controller
{
    private const STATUS_LABEL = [
        'belum' => 'Belum Digenerate',
        'draft' => 'Draft',
        'diajukan' => 'Menunggu Pengesahan',
        'disahkan' => 'Disahkan',
        'ditolak' => 'Ditolak',
        'diterbitkan' => 'Diterbitkan',
        'dicabut' => 'Dicabut',
    ];

    private const STATUS_NILAI_LABEL = ['lengkap' => 'Lengkap', 'sebagian' => 'Sebagian', 'belum' => 'Belum Ada', 'tanpa_mapel' => 'Tanpa Mata Pelajaran'];

    private const STATUS_VERIF_LABEL = ['terverifikasi' => 'Terverifikasi', 'sebagian' => 'Sebagian', 'belum' => 'Belum', 'tanpa_mapel' => 'Tanpa Mata Pelajaran'];

    private const LOG = 'penerbitan-rapor';

    public function __construct(private readonly MonitoringNilaiController $monitoring) {}

    public function opsi(): JsonResponse
    {
        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'kelas' => Kelas::with('waliKelas:id,nama')->orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tahun_ajaran', 'wali_kelas_id'])
                ->map(fn (Kelas $k) => ['id' => $k->id, 'nama_kelas' => $k->nama_kelas, 'tahun_ajaran' => $k->tahun_ajaran, 'wali_kelas' => $k->waliKelas?->nama]),
            'status_rapor' => collect(self::STATUS_LABEL)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $in = $request->validate([
            'kelas_id' => ['nullable', 'integer'],
            'status_rapor' => ['nullable', 'in:'.implode(',', array_keys(self::STATUS_LABEL))],
            'status_nilai' => ['nullable', 'in:lengkap,sebagian,belum,tanpa_mapel'],
            'status_verifikasi' => ['nullable', 'in:terverifikasi,sebagian,belum,tanpa_mapel'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $kelas = $this->kelasPeriode($ta)->when(! empty($in['kelas_id']), fn ($c) => $c->where('id', (int) $in['kelas_id']));
        $siswa = Siswa::with('kelas:id,nama_kelas,wali_kelas_id')->whereIn('kelas_id', $kelas->pluck('id'))->where('status', 'aktif')
            ->when(! empty($in['search']), function ($q) use ($in) {
                $like = '%'.trim($in['search']).'%';
                $q->where(fn ($qq) => $qq->where('nama', 'like', $like)->orWhere('nis', 'like', $like));
            })->orderBy('nama')->get(['id', 'nama', 'nis', 'kelas_id']);

        $analisis = $this->analisis($ta, $semester, ! empty($in['kelas_id']) ? (int) $in['kelas_id'] : null);
        $wali = $kelas->keyBy('id');
        $penerbitan = PenerbitanRapor::where('tahun_ajaran_id', $ta->id)->where('semester', $semester)->whereIn('siswa_id', $siswa->pluck('id'))->get(['id', 'siswa_id', 'status', 'nomor_rapor', 'tanggal_terbit', 'tanggal_generate'])->keyBy('siswa_id');
        $rapor = $this->raporPeriode($ta, $semester, $siswa->pluck('id'));

        $rows = $siswa->map(function (Siswa $s) use ($analisis, $wali, $penerbitan, $rapor) {
            $st = $this->statusSiswa($s->id, $analisis[$s->kelas_id] ?? null);
            $p = $penerbitan->get($s->id);
            $r = $rapor->get($s->id);
            $status = $this->statusRapor($p, $r);

            return [
                'siswa' => ['id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis],
                'kelas' => ['id' => $s->kelas_id, 'nama_kelas' => $s->kelas?->nama_kelas],
                'wali_kelas' => $wali->get($s->kelas_id)?->waliKelas?->nama,
                ...$st,
                'pengesahan_status' => $r?->status,
                'penerbitan_id' => $p?->id,
                'status_rapor' => $status,
                'status_rapor_label' => self::STATUS_LABEL[$status],
                'nomor_rapor' => $p?->nomor_rapor,
                'tanggal_terbit' => $p?->tanggal_terbit ? substr((string) $p->tanggal_terbit, 0, 10) : null,
                'tanggal_generate' => $p?->tanggal_generate,
            ];
        })
            ->when(! empty($in['status_rapor']), fn ($c) => $c->filter(fn ($r) => $r['status_rapor'] === $in['status_rapor']))
            ->when(! empty($in['status_nilai']), fn ($c) => $c->filter(fn ($r) => $r['status_nilai'] === $in['status_nilai']))
            ->when(! empty($in['status_verifikasi']), fn ($c) => $c->filter(fn ($r) => $r['status_verifikasi'] === $in['status_verifikasi']))
            ->values();

        $user = $request->user();

        return response()->json([
            'konteks' => ['tahun_ajaran_id' => $ta->id, 'tahun_ajaran' => $ta->nama, 'semester' => $semester],
            'hak' => ['menerbitkan' => (bool) $user?->can('rapor.publish'), 'mengesahkan' => (bool) $user?->can('rapor.approve')],
            'ringkasan' => [
                'jumlah_siswa' => $rows->count(),
                'belum_digenerate' => $rows->where('status_rapor', 'belum')->count(),
                'draft' => $rows->whereIn('status_rapor', ['draft', 'diajukan', 'disahkan', 'ditolak'])->count(),
                'diterbitkan' => $rows->where('status_rapor', 'diterbitkan')->count(),
            ],
            'rows' => $rows,
        ]);
    }

    /** Preview isi rapor + validasi kelengkapan data untuk satu siswa. */
    public function preview(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $siswa = $this->siswaPeriode($request, $ta);
        $p = PenerbitanRapor::where(['siswa_id' => $siswa->id, 'tahun_ajaran_id' => $ta->id, 'semester' => $semester])->first();
        $rapor = $this->raporPeriode($ta, $semester, collect([$siswa->id]))->get($siswa->id);
        $analisis = $this->analisis($ta, $semester, (int) $siswa->kelas_id);

        return response()->json([
            'konten' => $this->kontenTampil($p, $siswa, $ta, $semester, $rapor),
            'validasi' => $this->validasi($siswa, $ta, $semester, $rapor, $analisis[$siswa->kelas_id] ?? null),
            'status_rapor' => $this->statusRapor($p, $rapor),
            'status_rapor_label' => self::STATUS_LABEL[$this->statusRapor($p, $rapor)],
            'penerbitan_id' => $p?->id,
            'pengesahan' => $rapor ? ['status' => $rapor->status, 'catatan' => $rapor->catatan, 'tanggal' => $rapor->tanggal_keputusan] : null,
        ]);
    }

    public function generate(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $siswaList = $this->daftarSiswa($request, $ta);
        $analisis = $this->analisis($ta, $semester, $request->filled('kelas_id') ? $request->integer('kelas_id') : null);
        $rapor = $this->raporPeriode($ta, $semester, $siswaList->pluck('id'));

        $dibuat = 0;
        $dilewati = [];
        foreach ($siswaList as $s) {
            $lama = PenerbitanRapor::where(['siswa_id' => $s->id, 'tahun_ajaran_id' => $ta->id, 'semester' => $semester])->first();
            if ($lama?->status === 'diterbitkan') {
                $dilewati[] = "{$s->nama}: sudah diterbitkan (cabut terlebih dahulu bila perlu digenerate ulang).";

                continue;
            }
            $masalah = collect($this->validasi($s, $ta, $semester, $rapor->get($s->id), $analisis[$s->kelas_id] ?? null))->firstWhere('blokir_generate', true);
            if ($masalah) {
                $dilewati[] = "{$s->nama}: {$masalah['pesan']}";

                continue;
            }

            $p = PenerbitanRapor::updateOrCreate(
                ['siswa_id' => $s->id, 'tahun_ajaran_id' => $ta->id, 'semester' => $semester],
                [
                    'kelas_id' => $s->kelas_id,
                    'status' => 'draft',
                    'konten' => $this->susunKonten($s, $ta, $semester, $rapor->get($s->id)),
                    'tanggal_generate' => now(),
                    'digenerate_oleh' => $request->user()?->id,
                    'tanggal_dicabut' => null,
                    'dicabut_oleh' => null,
                    'alasan_cabut' => null,
                ]
            );
            $this->log($request, $p, 'generated', "Generate rapor {$s->nama} ({$ta->nama} {$semester}).", $ta, $semester);
            $dibuat++;
        }

        return response()->json(['message' => "{$dibuat} rapor digenerate sebagai draft.", 'dibuat' => $dibuat, 'dilewati' => $dilewati]);
    }

    /** Ajukan rapor draft untuk pengesahan Kepala Sekolah (tabel rapor yang sudah ada). */
    public function ajukan(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $siswaList = $this->daftarSiswa($request, $ta);

        $diajukan = 0;
        $dilewati = [];
        foreach ($siswaList as $s) {
            $p = PenerbitanRapor::where(['siswa_id' => $s->id, 'tahun_ajaran_id' => $ta->id, 'semester' => $semester])->first();
            $rapor = $this->raporPeriode($ta, $semester, collect([$s->id]))->get($s->id);
            if (! $p || $p->status === 'diterbitkan') {
                $dilewati[] = "{$s->nama}: ".($p ? 'sudah diterbitkan.' : 'belum digenerate.');

                continue;
            }
            if ($rapor?->status === 'disahkan') {
                $dilewati[] = "{$s->nama}: sudah disahkan.";

                continue;
            }

            $rapor ??= new Rapor(['siswa_id' => $s->id, 'semester' => ucfirst($semester), 'tahun_ajaran' => $ta->nama]);
            $rapor->fill(['status' => 'diajukan', 'diajukan_oleh' => $request->user()?->id, 'disahkan_oleh' => null, 'catatan' => null, 'tanggal_keputusan' => null])->save();
            $this->log($request, $p, 'submitted', "Mengajukan pengesahan rapor {$s->nama} ({$ta->nama} {$semester}).", $ta, $semester);
            $diajukan++;
        }

        return response()->json(['message' => "{$diajukan} rapor diajukan untuk pengesahan.", 'diajukan' => $diajukan, 'dilewati' => $dilewati]);
    }

    /** Sahkan atau tolak rapor yang diajukan (hak rapor.approve). */
    public function pengesahan(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $in = $request->validate([
            'aksi' => ['required', 'in:sahkan,tolak'],
            'catatan' => ['required_if:aksi,tolak', 'nullable', 'string', 'max:2000'],
        ]);
        $siswaList = $this->daftarSiswa($request, $ta);
        $rapor = $this->raporPeriode($ta, $semester, $siswaList->pluck('id'));

        $diproses = 0;
        $dilewati = [];
        foreach ($siswaList as $s) {
            $r = $rapor->get($s->id);
            if (! $r || $r->status !== 'diajukan') {
                $dilewati[] = "{$s->nama}: tidak sedang menunggu pengesahan.";

                continue;
            }
            $r->update([
                'status' => $in['aksi'] === 'sahkan' ? 'disahkan' : 'ditolak',
                'disahkan_oleh' => $request->user()?->id,
                'catatan' => $in['catatan'] ?? null,
                'tanggal_keputusan' => now(),
            ]);
            $p = PenerbitanRapor::where(['siswa_id' => $s->id, 'tahun_ajaran_id' => $ta->id, 'semester' => $semester])->first();
            if ($p) {
                $catatan = ! empty($in['catatan']) ? " Catatan: {$in['catatan']}" : '';
                $this->log($request, $p, $in['aksi'] === 'sahkan' ? 'approved' : 'rejected', ($in['aksi'] === 'sahkan' ? 'Mengesahkan' : 'Menolak')." rapor {$s->nama} ({$ta->nama} {$semester}).{$catatan}", $ta, $semester);
            }
            $diproses++;
        }

        return response()->json(['message' => "{$diproses} rapor ".($in['aksi'] === 'sahkan' ? 'disahkan' : 'ditolak').'.', 'diproses' => $diproses, 'dilewati' => $dilewati]);
    }

    public function terbitkan(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $in = $request->validate(['tanggal_terbit' => ['required', 'date_format:Y-m-d']]);
        $siswaList = $this->daftarSiswa($request, $ta);
        $analisis = $this->analisis($ta, $semester, $request->filled('kelas_id') ? $request->integer('kelas_id') : null);
        $rapor = $this->raporPeriode($ta, $semester, $siswaList->pluck('id'));

        $terbit = 0;
        $dilewati = [];
        foreach ($siswaList as $s) {
            $p = PenerbitanRapor::where(['siswa_id' => $s->id, 'tahun_ajaran_id' => $ta->id, 'semester' => $semester])->first();
            if (! $p) {
                $dilewati[] = "{$s->nama}: belum digenerate.";

                continue;
            }
            if ($p->status === 'diterbitkan') {
                $dilewati[] = "{$s->nama}: sudah diterbitkan.";

                continue;
            }
            $masalah = collect($this->validasi($s, $ta, $semester, $rapor->get($s->id), $analisis[$s->kelas_id] ?? null))->where('blokir_terbit', true);
            if ($masalah->isNotEmpty()) {
                $dilewati[] = "{$s->nama}: ".$masalah->pluck('pesan')->implode(' ');

                continue;
            }

            $nomor = $p->nomor_rapor ?? $this->nomorBerikut($ta, $semester);
            $konten = $this->susunKonten($s, $ta, $semester, $rapor->get($s->id));
            $p->update([
                'status' => 'diterbitkan',
                'nomor_rapor' => $nomor,
                'tanggal_terbit' => $in['tanggal_terbit'],
                'konten' => $konten,
                'kelas_id' => $s->kelas_id,
                'diterbitkan_oleh' => $request->user()?->id,
            ]);
            $this->log($request, $p, 'published', "Menerbitkan rapor {$s->nama} ({$ta->nama} {$semester}) nomor {$nomor}.", $ta, $semester);
            $terbit++;
        }

        return response()->json(['message' => "{$terbit} rapor diterbitkan.", 'diterbitkan' => $terbit, 'dilewati' => $dilewati]);
    }

    public function cabut(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $in = $request->validate([
            'siswa_id' => ['required', 'integer', 'exists:siswa,id'],
            'alasan' => ['required', 'string', 'min:5', 'max:2000'],
        ]);
        $p = PenerbitanRapor::with('siswa:id,nama')->where(['siswa_id' => $in['siswa_id'], 'tahun_ajaran_id' => $ta->id, 'semester' => $semester])->first();
        if (! $p || $p->status !== 'diterbitkan') {
            throw ValidationException::withMessages(['siswa_id' => 'Rapor ini tidak sedang berstatus diterbitkan.']);
        }

        $p->update(['status' => 'dicabut', 'tanggal_dicabut' => now(), 'dicabut_oleh' => $request->user()?->id, 'alasan_cabut' => $in['alasan']]);
        $this->log($request, $p, 'revoked', "Mencabut penerbitan rapor {$p->siswa?->nama} ({$ta->nama} {$semester}). Alasan: {$in['alasan']}", $ta, $semester);

        return response()->json(['message' => 'Penerbitan rapor dicabut. Siswa/orang tua tidak dapat lagi mengunduhnya.']);
    }

    /** PDF satu siswa; draft diberi banner "belum diterbitkan". */
    public function pdf(Request $request): Response
    {
        [$ta, $semester] = $this->konteks($request);
        $siswa = $this->siswaPeriode($request, $ta);
        $p = PenerbitanRapor::where(['siswa_id' => $siswa->id, 'tahun_ajaran_id' => $ta->id, 'semester' => $semester])->first();
        $rapor = $this->raporPeriode($ta, $semester, collect([$siswa->id]))->get($siswa->id);
        $konten = $this->kontenTampil($p, $siswa, $ta, $semester, $rapor);

        return Pdf::loadView('rapor.penerbitan', ['items' => [$konten]])->setPaper('a4')
            ->download('rapor-'.($siswa->nis ?: $siswa->id).'-'.$semester.'-'.str_replace('/', '-', $ta->nama).'.pdf');
    }

    /** PDF seluruh rapor (yang sudah digenerate) dalam satu rombel, satu halaman per siswa. */
    public function pdfKelas(Request $request): Response
    {
        $items = $this->itemKelas($request);
        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['kelas_id' => 'Belum ada rapor yang digenerate untuk rombel ini.']);
        }
        [$ta, $semester] = $this->konteks($request);
        $kelas = Kelas::findOrFail($request->integer('kelas_id'));

        return Pdf::loadView('rapor.penerbitan', ['items' => $items->all()])->setPaper('a4')
            ->download('rapor-kelas-'.preg_replace('/[^A-Za-z0-9_-]+/', '-', $kelas->nama_kelas).'-'.$semester.'-'.str_replace('/', '-', $ta->nama).'.pdf');
    }

    /** Data seluruh rapor rombel untuk cetak massal di browser. */
    public function cetakKelas(Request $request): JsonResponse
    {
        return response()->json($this->itemKelas($request)->values());
    }

    public function riwayat(Request $request): JsonResponse
    {
        [$ta, $semester] = $this->konteks($request);
        $ids = PenerbitanRapor::where('tahun_ajaran_id', $ta->id)->where('semester', $semester)
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->filled('siswa_id'), fn ($q) => $q->where('siswa_id', $request->integer('siswa_id')))->pluck('id');

        return response()->json(
            Activity::where('log_name', self::LOG)->where('subject_type', PenerbitanRapor::class)->whereIn('subject_id', $ids)
                ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(150)->get()
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

    /** @return array{0: TahunAjaran, 1: string} */
    private function konteks(Request $request): array
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
        ]);

        return [TahunAjaran::findOrFail($in['tahun_ajaran_id']), $in['semester']];
    }

    /** Rombel pada tahun ajaran (dicocokkan lewat nama atau tahun_ajaran_id). */
    private function kelasPeriode(TahunAjaran $ta): Collection
    {
        return Kelas::with('waliKelas:id,nama,nip')->where(fn ($q) => $q->where('tahun_ajaran', $ta->nama)->orWhere('tahun_ajaran_id', $ta->id))->get();
    }

    private function siswaPeriode(Request $request, TahunAjaran $ta): Siswa
    {
        $request->validate(['siswa_id' => ['required', 'integer', 'exists:siswa,id']]);
        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat,fase,wali_kelas_id')->findOrFail($request->integer('siswa_id'));
        if (! $siswa->kelas_id || ! $this->kelasPeriode($ta)->contains('id', $siswa->kelas_id)) {
            throw ValidationException::withMessages(['siswa_id' => 'Siswa tidak berada di rombel pada tahun ajaran ini.']);
        }

        return $siswa;
    }

    /** Siswa aktif dari siswa_ids atau seluruh rombel (kelas_id), dibatasi pada rombel tahun ajaran. */
    private function daftarSiswa(Request $request, TahunAjaran $ta): Collection
    {
        $request->validate([
            'siswa_ids' => ['nullable', 'array', 'max:500'],
            'siswa_ids.*' => ['integer'],
            'kelas_id' => ['nullable', 'integer'],
        ]);
        if (! $request->filled('siswa_ids') && ! $request->filled('kelas_id')) {
            throw ValidationException::withMessages(['siswa_ids' => 'Pilih siswa atau rombel.']);
        }
        $kelasIds = $this->kelasPeriode($ta)->pluck('id');

        return Siswa::with('kelas:id,nama_kelas,tingkat,fase,wali_kelas_id')->where('status', 'aktif')->whereIn('kelas_id', $kelasIds)
            ->when($request->filled('siswa_ids'), fn ($q) => $q->whereIn('id', $request->input('siswa_ids')))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->orderBy('nama')->get();
    }

    /** @return \Illuminate\Support\Collection<int, Rapor> keyed by siswa_id */
    private function raporPeriode(TahunAjaran $ta, string $semester, Collection $siswaIds): Collection
    {
        return Rapor::whereIn('siswa_id', $siswaIds)->where('tahun_ajaran', $ta->nama)->whereRaw('lower(semester) = ?', [$semester])->get()->keyBy('siswa_id');
    }

    /**
     * Ringkasan nilai & verifikasi per rombel dari data Monitoring Nilai.
     *
     * @return array<int, array{rows: Collection, total: int, terverifikasi: int}>
     */
    private function analisis(TahunAjaran $ta, string $semester, ?int $kelasId): array
    {
        $hasil = $this->monitoring->bangun(Request::create('/', 'GET', ['tahun_ajaran_id' => $ta->id, 'semester' => $semester, 'jenis_wajib' => ''] + ($kelasId ? ['kelas_id' => $kelasId] : [])), true);
        $disetujui = VerifikasiNilai::where('tahun_ajaran_id', $ta->id)->where('semester', $semester)->where('status', 'disetujui')->get()
            ->map(fn ($v) => "{$v->kelas_id}|{$v->mata_pelajaran_id}")->flip();

        return $hasil['rows']->groupBy(fn ($r) => $r['kelas']['id'])->map(fn (Collection $rows) => [
            'rows' => $rows,
            'total' => $rows->count(),
            'terverifikasi' => $rows->filter(fn ($r) => $disetujui->has("{$r['kelas']['id']}|{$r['mata_pelajaran']['id']}"))->count(),
        ])->all();
    }

    private function statusSiswa(int $siswaId, ?array $a): array
    {
        $total = $a['total'] ?? 0;
        $lengkap = $a ? $a['rows']->filter(fn ($r) => collect($r['_siswa'])->firstWhere('id', $siswaId) && ! collect($r['_siswa'])->firstWhere('id', $siswaId)['kosong'])->count() : 0;
        $terverifikasi = $a['terverifikasi'] ?? 0;
        $punyaNilai = $a && $a['rows']->contains(fn ($r) => collect($r['_siswa'])->firstWhere('id', $siswaId)['rata_rata'] ?? null);
        $nilai = $total === 0 ? 'tanpa_mapel' : ($lengkap === $total ? 'lengkap' : ($lengkap === 0 && ! $punyaNilai ? 'belum' : 'sebagian'));
        $verif = $total === 0 ? 'tanpa_mapel' : ($terverifikasi === $total ? 'terverifikasi' : ($terverifikasi === 0 ? 'belum' : 'sebagian'));

        return [
            'status_nilai' => $nilai,
            'status_nilai_label' => self::STATUS_NILAI_LABEL[$nilai],
            'mapel_total' => $total,
            'mapel_lengkap' => $lengkap,
            'status_verifikasi' => $verif,
            'status_verifikasi_label' => self::STATUS_VERIF_LABEL[$verif],
            'mapel_terverifikasi' => $terverifikasi,
        ];
    }

    private function statusRapor(?PenerbitanRapor $p, ?Rapor $r): string
    {
        if ($p?->status === 'diterbitkan') {
            return 'diterbitkan';
        }
        if ($p?->status === 'dicabut') {
            return 'dicabut';
        }
        if ($p && $r) {
            return $r->status;
        }

        return $p ? 'draft' : 'belum';
    }

    /**
     * Validasi kelengkapan data rapor.
     *
     * @return list<array{kode: string, pesan: string, blokir_generate: bool, blokir_terbit: bool}>
     */
    private function validasi(Siswa $siswa, TahunAjaran $ta, string $semester, ?Rapor $rapor, ?array $analisis): array
    {
        $st = $this->statusSiswa($siswa->id, $analisis);
        $template = app(RaporTemplateSettings::class);
        $ada = fn (string $kode, string $pesan, bool $gen, bool $terbit) => ['kode' => $kode, 'pesan' => $pesan, 'blokir_generate' => $gen, 'blokir_terbit' => $terbit];
        $temuan = [];

        $jumlahNilai = Nilai::where('siswa_id', $siswa->id)->where('tahun_ajaran', $ta->nama)->whereRaw('lower(semester) = ?', [$semester])->count();
        if ($jumlahNilai === 0) {
            $temuan[] = $ada('tanpa_nilai', 'Siswa belum memiliki nilai pada semester ini.', true, true);
        }
        if ($st['status_nilai'] !== 'lengkap' && $jumlahNilai > 0) {
            $temuan[] = $ada('nilai_tidak_lengkap', "Nilai belum lengkap ({$st['mapel_lengkap']} dari {$st['mapel_total']} mata pelajaran lengkap).", false, true);
        }
        if ($st['status_verifikasi'] !== 'terverifikasi') {
            $temuan[] = $ada('verifikasi_belum', "Nilai belum seluruhnya disetujui di Verifikasi Nilai ({$st['mapel_terverifikasi']} dari {$st['mapel_total']} mata pelajaran).", false, true);
        }
        if ($rapor?->status !== 'disahkan') {
            $temuan[] = $ada('belum_disahkan', 'Rapor belum disahkan ('.($rapor ? "status pengesahan: {$rapor->status}" : 'belum diajukan').').', false, true);
        }
        if (! $siswa->kelas?->wali_kelas_id) {
            $temuan[] = $ada('wali_kelas_kosong', 'Rombel belum memiliki wali kelas.', false, true);
        }
        if (! $siswa->nis) {
            $temuan[] = $ada('nis_kosong', 'NIS siswa belum diisi.', false, true);
        }
        if (! $template->nama_penandatangan) {
            $temuan[] = $ada('penandatangan_kosong', 'Nama penandatangan rapor belum diatur di pengaturan template rapor.', false, true);
        }
        if (! $rapor?->catatan_wali_kelas) {
            $temuan[] = $ada('catatan_wali_kosong', 'Catatan wali kelas belum diisi (peringatan, tidak memblokir).', false, false);
        }

        return $temuan;
    }

    /** Isi rapor dari data saat ini (belum dibekukan). */
    private function susunKonten(Siswa $siswa, TahunAjaran $ta, string $semester, ?Rapor $rapor): array
    {
        $siswa->loadMissing('kelas:id,nama_kelas,tingkat,fase,wali_kelas_id');
        $wali = $siswa->kelas?->wali_kelas_id ? Guru::find($siswa->kelas->wali_kelas_id, ['id', 'nama', 'nip']) : null;

        $nilai = Nilai::with('mataPelajaran:id,nama_mapel')->where('siswa_id', $siswa->id)->where('tahun_ajaran', $ta->nama)->whereRaw('lower(semester) = ?', [$semester])->get()
            ->groupBy('mata_pelajaran_id')
            ->map(function (Collection $items) {
                $rincian = [];
                foreach (['harian', 'tugas', 'uts', 'uas'] as $j) {
                    $v = $items->where('jenis_nilai', $j);
                    $rincian[$j] = $v->isEmpty() ? null : round((float) $v->avg('nilai'), 2);
                }

                return ['mata_pelajaran' => $items->first()->mataPelajaran?->nama_mapel ?? '-', 'rata_rata' => round((float) $items->avg('nilai'), 2), 'rincian' => $rincian];
            })
            ->sortBy('mata_pelajaran')->values();

        $sem = Semester::where('tahun_ajaran_id', $ta->id)->where('nama', ucfirst($semester))->first();
        $absensi = Absensi::where('siswa_id', $siswa->id)
            ->when($sem, fn ($q) => $q->whereBetween('tanggal', [$sem->tanggal_mulai->toDateString(), $sem->tanggal_selesai->toDateString()]))
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        $template = app(RaporTemplateSettings::class);
        $sekolah = tenant();

        return [
            'semester' => $semester,
            'tahun_ajaran' => $ta->nama,
            'siswa' => ['id' => $siswa->id, 'nama' => $siswa->nama, 'nis' => $siswa->nis, 'nisn' => $siswa->nisn],
            'kelas' => $siswa->kelas ? ['id' => $siswa->kelas->id, 'nama_kelas' => $siswa->kelas->nama_kelas] : null,
            'wali_kelas' => $wali ? ['nama' => $wali->nama, 'nip' => $wali->nip] : null,
            'nilai' => $nilai->all(),
            'rata_rata_umum' => $nilai->isEmpty() ? null : round((float) $nilai->avg('rata_rata'), 2),
            'absensi' => ['hadir' => (int) ($absensi['hadir'] ?? 0), 'izin' => (int) ($absensi['izin'] ?? 0), 'sakit' => (int) ($absensi['sakit'] ?? 0), 'alpha' => (int) ($absensi['alpha'] ?? 0)],
            'catatan_wali_kelas' => $rapor?->catatan_wali_kelas,
            'sekolah' => ['nama' => $sekolah->nama_sekolah, 'logo' => $sekolah->logo, 'alamat' => $sekolah->alamat],
            'template' => ['header_text' => $template->header_text, 'tampilkan_logo' => $template->tampilkan_logo, 'catatan_kaki' => $template->catatan_kaki],
            'penandatangan' => ['nama' => $template->nama_penandatangan, 'jabatan' => $template->jabatan_penandatangan],
            'nomor_rapor' => null,
            'tanggal_terbit' => null,
        ];
    }

    /** Konten untuk tampil/cetak: snapshot bila sudah digenerate, kalau belum dihitung langsung (draft). */
    private function kontenTampil(?PenerbitanRapor $p, Siswa $siswa, TahunAjaran $ta, string $semester, ?Rapor $rapor): array
    {
        $konten = $p?->konten ?? $this->susunKonten($siswa, $ta, $semester, $rapor);
        $konten['nomor_rapor'] = $p?->nomor_rapor;
        $konten['tanggal_terbit'] = $p?->tanggal_terbit ? substr((string) $p->tanggal_terbit, 0, 10) : null;
        $konten['_draft'] = $p?->status !== 'diterbitkan';
        $konten['_status'] = $p?->status ?? 'belum';

        return $konten;
    }

    /** @return Collection<int, array> rapor yang sudah digenerate untuk satu rombel */
    private function itemKelas(Request $request): Collection
    {
        [$ta, $semester] = $this->konteks($request);
        $request->validate(['kelas_id' => ['required', 'integer', 'exists:kelas,id'], 'hanya_terbit' => ['nullable', 'boolean']]);
        $rows = PenerbitanRapor::with('siswa:id,nama,nis,nisn,kelas_id')->where('tahun_ajaran_id', $ta->id)->where('semester', $semester)
            ->where('kelas_id', $request->integer('kelas_id'))->whereNotNull('konten')
            ->when($request->boolean('hanya_terbit'), fn ($q) => $q->where('status', 'diterbitkan'))
            ->where('status', '!=', 'dicabut')->get()->sortBy(fn ($p) => $p->siswa?->nama)->values();

        return $rows->map(function (PenerbitanRapor $p) {
            $k = $p->konten;
            $k['nomor_rapor'] = $p->nomor_rapor;
            $k['tanggal_terbit'] = $p->tanggal_terbit ? substr((string) $p->tanggal_terbit, 0, 10) : null;
            $k['_draft'] = $p->status !== 'diterbitkan';
            $k['_status'] = $p->status;

            return $k;
        });
    }

    private function nomorBerikut(TahunAjaran $ta, string $semester): string
    {
        $seq = PenerbitanRapor::where('tahun_ajaran_id', $ta->id)->where('semester', $semester)->whereNotNull('nomor_rapor')->count() + 1;
        do {
            $nomor = sprintf('RPR/%s/%s/%04d', str_replace('/', '-', $ta->nama), $semester === 'ganjil' ? '1' : '2', $seq++);
        } while (PenerbitanRapor::where('nomor_rapor', $nomor)->exists());

        return $nomor;
    }

    private function log(Request $request, PenerbitanRapor $p, string $event, string $deskripsi, TahunAjaran $ta, string $semester): void
    {
        activity(self::LOG)->performedOn($p)->causedBy($request->user())->event($event)
            ->withProperties(['tahun_ajaran' => $ta->nama, 'semester' => $semester, 'siswa_id' => $p->siswa_id, 'nomor_rapor' => $p->nomor_rapor])
            ->log($deskripsi);
    }
}

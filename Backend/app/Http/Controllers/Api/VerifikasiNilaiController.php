<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\KkmKktp;
use App\Models\Nilai;
use App\Models\PenguncianNilai;
use App\Models\VerifikasiNilai;
use App\Notifications\VerifikasiNilaiNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Verifikasi nilai yang sudah dikunci sebelum dinyatakan layak masuk rapor.
 *
 * Setiap rombel × mata pelajaran × semester diperiksa otomatis (kelengkapan,
 * nilai kosong, nilai di luar rentang 0–100, konsistensi) lalu diputuskan
 * secara manual: setujui, tolak, atau ajukan perbaikan. Keputusan selain
 * "setujui" WAJIB disertai catatan yang jelas; menyetujui nilai yang punya
 * temuan juga wajib bercatatan, dan nilai di luar rentang tidak dapat
 * disetujui. Hasil pemeriksaan direkam saat keputusan diambil (dihitung ulang
 * di server, bukan dari klien).
 *
 * Tolak/ajukan perbaikan membuka kunci nilai secara otomatis (bawaan) agar
 * guru bisa memperbaiki; persetujuan gugur (kedaluwarsa) bila kunci nilai
 * dibuka lewat menu Penguncian. Belum ada pemblokiran otomatis di rapor.
 */
class VerifikasiNilaiController extends Controller
{
    /** Selisih rata-rata (harian/tugas vs UTS/UAS) yang dianggap lonjakan mencurigakan. */
    private const AMBANG_LONJAKAN = 40;

    /** Minimal jumlah siswa agar nilai yang seragam dianggap janggal. */
    private const MIN_SISWA_SERAGAM = 5;

    private const JENIS_LABEL = ['harian' => 'Harian', 'tugas' => 'Tugas', 'uts' => 'UTS', 'uas' => 'UAS'];

    private const STATUS_LABEL = [
        'belum' => 'Belum Diverifikasi',
        'disetujui' => 'Disetujui',
        'ditolak' => 'Ditolak',
        'perlu_perbaikan' => 'Perlu Perbaikan',
        'kedaluwarsa' => 'Kedaluwarsa',
    ];

    private const LOG = 'verifikasi-nilai';

    public function __construct(private readonly MonitoringNilaiController $monitoring) {}

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'status_verifikasi' => ['nullable', 'in:belum,disetujui,ditolak,perlu_perbaikan,kedaluwarsa'],
            'status_kunci' => ['nullable', 'in:terkunci,tidak_terkunci'],
        ]);

        $data = $this->baris($request, $in);
        $rows = $data['rows'];
        $filtered = $rows
            ->when(! empty($in['status_verifikasi']), fn ($c) => $c->filter(fn ($r) => $r['status_verifikasi'] === $in['status_verifikasi']))
            ->when(! empty($in['status_kunci']), fn ($c) => $c->filter(fn ($r) => $r['status_kunci'] === $in['status_kunci']))
            ->values();

        return response()->json([
            'konteks' => $data['konteks'],
            'bisa_memverifikasi' => (bool) $request->user()?->can('nilai.verify'),
            'ringkasan' => [
                'jumlah_baris' => $filtered->count(),
                'siap_diverifikasi' => $filtered->where('status_kunci', 'terkunci')->where('status_verifikasi', 'belum')->count(),
                'disetujui' => $filtered->where('status_verifikasi', 'disetujui')->count(),
                'perlu_tindakan' => $filtered->whereIn('status_verifikasi', ['ditolak', 'perlu_perbaikan', 'kedaluwarsa'])->count(),
                'belum_dikunci' => $filtered->where('status_kunci', 'tidak_terkunci')->count(),
            ],
            'rows' => $filtered,
        ]);
    }

    /** Pemeriksaan otomatis + detail nilai per siswa untuk satu rombel × mapel. */
    public function periksa(Request $request): JsonResponse
    {
        $data = $this->pemeriksaan($request);

        return response()->json([
            'baris' => $data['baris'],
            'pemeriksaan' => $data['pemeriksaan'],
            'siswa' => $data['siswa'],
            'verifikasi' => $data['verifikasi'],
        ]);
    }

    public function keputusan(Request $request): JsonResponse
    {
        $in = $request->validate([
            'aksi' => ['required', 'in:setujui,tolak,perbaikan'],
            'catatan' => ['nullable', 'string', 'max:2000'],
            'buka_kunci' => ['boolean'],
        ]);
        $catatan = trim((string) ($in['catatan'] ?? ''));

        $data = $this->pemeriksaan($request);
        $baris = $data['baris'];
        $pem = $data['pemeriksaan'];
        $kunci = $data['kunci'];

        if ($baris['status_kunci'] !== 'terkunci') {
            throw ValidationException::withMessages(['status' => 'Hanya nilai yang sudah dikunci yang dapat diverifikasi. Kunci nilai terlebih dahulu di menu Penguncian Nilai.']);
        }

        if ($in['aksi'] === 'setujui') {
            if ($pem['jumlah_kesalahan'] > 0) {
                throw ValidationException::withMessages(['aksi' => 'Nilai memiliki kesalahan (mis. di luar rentang 0–100) dan tidak dapat disetujui. Ajukan perbaikan.']);
            }
            if ($pem['perlu_catatan_setuju'] && mb_strlen($catatan) < 5) {
                throw ValidationException::withMessages(['catatan' => 'Nilai memiliki temuan (belum lengkap atau perlu dicek). Tuliskan catatan (min. 5 karakter) mengapa tetap layak disetujui.']);
            }
        } elseif (mb_strlen($catatan) < 10) {
            throw ValidationException::withMessages(['catatan' => 'Catatan wajib (min. 10 karakter) dan harus menjelaskan alasan penolakan atau apa yang perlu diperbaiki.']);
        }

        $status = ['setujui' => 'disetujui', 'tolak' => 'ditolak', 'perbaikan' => 'perlu_perbaikan'][$in['aksi']];
        $bukaKunci = $in['aksi'] !== 'setujui' && (bool) ($in['buka_kunci'] ?? true);
        if ($bukaKunci && ! $request->user()?->can('nilai.lock')) {
            throw ValidationException::withMessages(['buka_kunci' => 'Akun Anda tidak berhak membuka kunci nilai. Hapus centang "buka kunci" atau minta pengguna berhak nilai.lock membukanya.']);
        }

        $lama = $data['verifikasi']['status'] ?? 'belum';
        $verifikasi = VerifikasiNilai::updateOrCreate(
            ['tahun_ajaran_id' => $baris['tahun_ajaran_id'], 'semester' => $baris['semester'], 'kelas_id' => $baris['kelas']['id'], 'mata_pelajaran_id' => $baris['mata_pelajaran']['id']],
            [
                'status' => $status,
                'verifikator_id' => $request->user()?->id,
                'tanggal_verifikasi' => now(),
                'catatan' => $catatan !== '' ? $catatan : null,
                'hasil_pemeriksaan' => $this->ringkasPemeriksaan($pem),
            ]
        );
        $verifikasi->load(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'tahunAjaran:id,nama']);

        activity(self::LOG)->performedOn($verifikasi)->causedBy($request->user())->event($status)
            ->withProperties([
                'tahun_ajaran' => $verifikasi->tahunAjaran?->nama,
                'semester' => $verifikasi->semester,
                'rombel' => $verifikasi->kelas?->nama_kelas,
                'mata_pelajaran' => $verifikasi->mataPelajaran?->nama_mapel,
                'status_sebelumnya' => $lama,
                'catatan' => $verifikasi->catatan,
                'pemeriksaan' => $this->ringkasPemeriksaan($pem),
                'kunci_dibuka' => $bukaKunci,
            ])
            ->log(ucfirst(self::STATUS_LABEL[$status]).": verifikasi nilai {$this->nama($verifikasi)}.");

        if ($bukaKunci && $kunci) {
            $kunci->update(['status' => 'terbuka', 'dibuka_oleh' => $request->user()?->id, 'tanggal_buka' => now(), 'catatan_buka' => "Verifikasi ({$status}): {$catatan}"]);
            activity('penguncian-nilai')->performedOn($kunci)->causedBy($request->user())->event('unlocked')
                ->withProperties(['tahun_ajaran' => $verifikasi->tahunAjaran?->nama, 'semester' => $verifikasi->semester, 'rombel' => $verifikasi->kelas?->nama_kelas, 'mata_pelajaran' => $verifikasi->mataPelajaran?->nama_mapel, 'persen' => $kunci->persen_saat_kunci, 'catatan' => "Verifikasi ({$status}): {$catatan}"])
                ->log("Membuka kunci nilai {$this->nama($verifikasi)} karena hasil verifikasi.");
        }

        $tanpaAkun = $this->beritahu($verifikasi, $data['guru_ids'], $status, $catatan, $bukaKunci);

        return response()->json([
            'message' => 'Verifikasi tersimpan: '.self::STATUS_LABEL[$status].'.',
            'status' => $status,
            'peringatan' => $tanpaAkun ? ['Notifikasi tidak terkirim karena belum punya akun pengguna: '.implode(', ', $tanpaAkun).'.'] : [],
        ]);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $ids = null;
        if ($request->filled(['tahun_ajaran_id', 'semester']) || $request->filled('kelas_id') || $request->filled('mata_pelajaran_id')) {
            $ids = VerifikasiNilai::query()
                ->when($request->filled('tahun_ajaran_id'), fn ($q) => $q->where('tahun_ajaran_id', $request->integer('tahun_ajaran_id')))
                ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')->value()))
                ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
                ->when($request->filled('mata_pelajaran_id'), fn ($q) => $q->where('mata_pelajaran_id', $request->integer('mata_pelajaran_id')))
                ->pluck('id');
        }

        return response()->json(
            Activity::where('log_name', self::LOG)->where('subject_type', VerifikasiNilai::class)
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

    public function export(Request $request): StreamedResponse
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'status_verifikasi' => ['nullable', 'in:belum,disetujui,ditolak,perlu_perbaikan,kedaluwarsa'],
            'status_kunci' => ['nullable', 'in:terkunci,tidak_terkunci'],
        ]);
        $rows = $this->baris($request, $in)['rows']
            ->when(! empty($in['status_verifikasi']), fn ($c) => $c->filter(fn ($r) => $r['status_verifikasi'] === $in['status_verifikasi']))
            ->when(! empty($in['status_kunci']), fn ($c) => $c->filter(fn ($r) => $r['status_kunci'] === $in['status_kunci']))
            ->values();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Verifikasi');
        $sheet->fromArray(['Tahun Ajaran', 'Semester', 'Rombel', 'Mata Pelajaran', 'Guru Pengampu', 'Status Penguncian', 'Status Verifikasi', 'Verifikator', 'Tanggal Verifikasi', 'Catatan', 'Temuan Kesalahan', 'Temuan Peringatan'], null, 'A1');
        $sheet->getStyle('A1:L1')->getFont()->setBold(true);
        $sheet->fromArray($rows->map(fn ($r) => [
            $r['tahun_ajaran'], ucfirst($r['semester']), $r['kelas']['nama_kelas'], $r['mata_pelajaran']['nama_mapel'], collect($r['guru'])->pluck('nama')->implode(', '),
            $r['status_kunci'] === 'terkunci' ? 'Terkunci' : 'Tidak Terkunci', $r['status_verifikasi_label'], $r['verifikator'], $r['tanggal_verifikasi'], $r['catatan'],
            $r['hasil_pemeriksaan']['jumlah_kesalahan'] ?? null, $r['hasil_pemeriksaan']['jumlah_peringatan'] ?? null,
        ])->all(), null, 'A2');
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'verifikasi-nilai-'.now()->format('Y-m-d').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Baris daftar: rombel × mapel dari monitoring, digabung status kunci dan verifikasi.
     *
     * @return array{konteks: array, rows: Collection<int, array>}
     */
    private function baris(Request $request, array $in): array
    {
        $hasil = $this->monitoring->bangun(Request::create('/', 'GET', $request->only(['tahun_ajaran_id', 'semester', 'kelas_id', 'mata_pelajaran_id', 'guru_id', 'search']) + ['jenis_wajib' => '']));

        $kunci = PenguncianNilai::where('tahun_ajaran_id', $in['tahun_ajaran_id'])->where('semester', $in['semester'])->get()
            ->keyBy(fn ($k) => "{$k->kelas_id}|{$k->mata_pelajaran_id}");
        $verifikasi = VerifikasiNilai::with('verifikator:id,name')->where('tahun_ajaran_id', $in['tahun_ajaran_id'])->where('semester', $in['semester'])->get()
            ->keyBy(fn ($v) => "{$v->kelas_id}|{$v->mata_pelajaran_id}");

        $rows = $hasil['rows']->map(function (array $r) use ($kunci, $verifikasi, $hasil) {
            $key = "{$r['kelas']['id']}|{$r['mata_pelajaran']['id']}";
            $k = $kunci->get($key);
            $v = $verifikasi->get($key);
            $terkunci = $k?->status === 'terkunci';
            $status = $v?->status ?? 'belum';

            return [
                'tahun_ajaran_id' => $hasil['konteks']['tahun_ajaran_id'],
                'tahun_ajaran' => $hasil['konteks']['tahun_ajaran'],
                'semester' => $hasil['konteks']['semester'],
                'kelas' => $r['kelas'],
                'mata_pelajaran' => $r['mata_pelajaran'],
                'guru' => $r['guru'],
                'jumlah_siswa' => $r['jumlah_siswa'],
                'persen' => $r['persen'],
                'status_kelengkapan' => $r['status'],
                'status_kelengkapan_label' => $r['status_label'],
                'status_kunci' => $terkunci ? 'terkunci' : 'tidak_terkunci',
                'tanggal_kunci' => $terkunci ? $k->tanggal_kunci : null,
                'status_verifikasi' => $status,
                'status_verifikasi_label' => self::STATUS_LABEL[$status],
                'verifikator' => $v?->verifikator?->name,
                'tanggal_verifikasi' => $v?->tanggal_verifikasi,
                'catatan' => $v?->catatan,
                'hasil_pemeriksaan' => $v?->hasil_pemeriksaan,
                // Sudah diperbaiki dan dikunci ulang setelah keputusan sebelumnya.
                'siap_diverifikasi_ulang' => $terkunci && $v && in_array($v->status, ['ditolak', 'perlu_perbaikan', 'kedaluwarsa'], true)
                    && $k->tanggal_kunci && $v->tanggal_verifikasi && $k->tanggal_kunci > $v->tanggal_verifikasi,
            ];
        })->values();

        return ['konteks' => $hasil['konteks'], 'rows' => $rows];
    }

    /** Pemeriksaan otomatis lengkap untuk satu rombel × mapel. */
    private function pemeriksaan(Request $request): array
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'kelas_id' => ['required', 'integer', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'integer', 'exists:mata_pelajaran,id'],
        ]);

        $hasil = $this->monitoring->bangun(Request::create('/', 'GET', $in + ['jenis_wajib' => '']), true);
        $row = $hasil['rows']->first(fn ($r) => $r['kelas']['id'] === (int) $in['kelas_id'] && $r['mata_pelajaran']['id'] === (int) $in['mata_pelajaran_id']);
        if (! $row) {
            throw ValidationException::withMessages(['kelas_id' => 'Rombel tidak termasuk tahun ajaran ini atau belum memiliki data untuk mata pelajaran tersebut.']);
        }
        $konteks = $hasil['konteks'];

        $kunci = PenguncianNilai::where(['tahun_ajaran_id' => $in['tahun_ajaran_id'], 'semester' => $in['semester'], 'kelas_id' => $in['kelas_id'], 'mata_pelajaran_id' => $in['mata_pelajaran_id']])->first();
        $verifikasi = VerifikasiNilai::with('verifikator:id,name')->where(['tahun_ajaran_id' => $in['tahun_ajaran_id'], 'semester' => $in['semester'], 'kelas_id' => $in['kelas_id'], 'mata_pelajaran_id' => $in['mata_pelajaran_id']])->first();

        $siswaIds = collect($row['_siswa'])->pluck('id');
        $nilai = Nilai::where('tahun_ajaran', $konteks['tahun_ajaran'])->whereRaw('lower(semester) = ?', [$in['semester']])
            ->where('mata_pelajaran_id', $in['mata_pelajaran_id'])->whereIn('siswa_id', $siswaIds)->get(['id', 'siswa_id', 'guru_id', 'jenis_nilai', 'nilai']);

        $kelasModel = Kelas::find($in['kelas_id']);
        $kkm = KkmKktp::where('tahun_ajaran_id', $in['tahun_ajaran_id'])->where('mata_pelajaran_id', $in['mata_pelajaran_id'])
            ->where('semester', $in['semester'])->where('status', 'aktif')->whereNotNull('nilai_batas')
            ->where(fn ($q) => $q->where('tingkat', $kelasModel?->tingkat)->orWhereNull('tingkat'))
            ->orderByRaw('case when tingkat is null then 1 else 0 end')->first();

        $siswa = collect($row['_siswa']);
        $namaSiswa = $siswa->pluck('nama', 'id');
        $perSiswa = $nilai->groupBy('siswa_id');

        // 1) Nilai kosong
        $kosong = $siswa->filter(fn ($s) => $s['kosong'])->map(fn ($s) => ['id' => $s['id'], 'nama' => $s['nama'], 'komponen' => array_map(fn ($j) => self::JENIS_LABEL[$j], $s['kosong'])])->values();

        // 2) Di luar batas 0–100
        $luarBatas = $nilai->filter(fn ($n) => (float) $n->nilai < 0 || (float) $n->nilai > 100)
            ->map(fn ($n) => ['siswa' => $namaSiswa[$n->siswa_id] ?? '-', 'komponen' => self::JENIS_LABEL[$n->jenis_nilai], 'nilai' => (float) $n->nilai])->values();

        // 3) Konsistensi
        $temuan = collect();
        $duplikat = [];
        foreach ($perSiswa as $sid => $items) {
            foreach (['uts', 'uas'] as $j) {
                if ($items->where('jenis_nilai', $j)->count() > 1) {
                    $duplikat[] = ($namaSiswa[$sid] ?? '-').' ('.self::JENIS_LABEL[$j].')';
                }
            }
        }
        if ($duplikat) {
            $temuan->push(['kode' => 'duplikat', 'pesan' => 'Nilai UTS/UAS lebih dari satu entri untuk siswa yang sama.', 'siswa' => $duplikat]);
        }

        $lonjakan = [];
        foreach ($perSiswa as $sid => $items) {
            $harian = $items->whereIn('jenis_nilai', ['harian', 'tugas']);
            $ujian = $items->whereIn('jenis_nilai', ['uts', 'uas']);
            if ($harian->isNotEmpty() && $ujian->isNotEmpty() && abs((float) $harian->avg('nilai') - (float) $ujian->avg('nilai')) >= self::AMBANG_LONJAKAN) {
                $lonjakan[] = ($namaSiswa[$sid] ?? '-').sprintf(' (harian/tugas %.0f vs UTS/UAS %.0f)', $harian->avg('nilai'), $ujian->avg('nilai'));
            }
        }
        if ($lonjakan) {
            $temuan->push(['kode' => 'lonjakan', 'pesan' => 'Selisih rata-rata harian/tugas dan UTS/UAS ≥ '.self::AMBANG_LONJAKAN.' poin; perlu dicek kebenarannya.', 'siswa' => $lonjakan]);
        }

        foreach (['harian', 'tugas', 'uts', 'uas'] as $j) {
            $vals = $nilai->where('jenis_nilai', $j)->pluck('nilai')->map(fn ($v) => (float) $v);
            if ($vals->count() >= self::MIN_SISWA_SERAGAM && $vals->unique()->count() === 1) {
                $temuan->push(['kode' => 'seragam', 'pesan' => 'Seluruh nilai '.self::JENIS_LABEL[$j]." bernilai sama ({$vals->first()}) untuk {$vals->count()} entri; periksa kemungkinan salah input massal.", 'siswa' => []]);
            }
        }

        $guruPengampu = collect($row['guru'])->pluck('id');
        if ($row['sumber_guru'] !== 'nilai') {
            $asing = $nilai->pluck('guru_id')->unique()->diff($guruPengampu);
            if ($asing->isNotEmpty()) {
                $nama = Guru::whereIn('id', $asing)->pluck('nama')->implode(', ');
                $temuan->push(['kode' => 'penginput_berbeda', 'pesan' => "Sebagian nilai diinput oleh guru yang bukan pengampu tercatat: {$nama}.", 'siswa' => []]);
            }
        }

        // Informasi: rata-rata siswa di bawah KKM (tidak memblokir).
        $bawahKkm = collect();
        if ($kkm) {
            $bawahKkm = $siswa->filter(fn ($s) => $s['rata_rata'] !== null && $s['rata_rata'] < $kkm->nilai_batas)
                ->map(fn ($s) => ['nama' => $s['nama'], 'rata_rata' => $s['rata_rata']])->values();
        }

        $kesalahan = $luarBatas->count();
        $peringatan = ($kosong->isNotEmpty() ? 1 : 0) + $temuan->count();

        $pemeriksaan = [
            'kelengkapan' => ['status' => $row['status'], 'status_label' => $row['status_label'], 'persen' => $row['persen'], 'nilai_diinput' => $row['nilai_diinput'], 'nilai_belum' => $row['nilai_belum'], 'total_seharusnya' => $row['total_seharusnya']],
            'nilai_kosong' => ['jumlah_siswa' => $kosong->count(), 'daftar' => $kosong],
            'di_luar_batas' => ['jumlah' => $luarBatas->count(), 'daftar' => $luarBatas, 'rentang' => '0–100'],
            'konsistensi' => ['jumlah' => $temuan->count(), 'temuan' => $temuan, 'ambang_lonjakan' => self::AMBANG_LONJAKAN],
            'di_bawah_kkm' => $kkm ? ['kkm' => (float) $kkm->nilai_batas, 'jumlah' => $bawahKkm->count(), 'daftar' => $bawahKkm] : null,
            'jumlah_kesalahan' => $kesalahan,
            'jumlah_peringatan' => $peringatan,
            'perlu_catatan_setuju' => $peringatan > 0 || $row['status'] !== 'lengkap',
            'dapat_disetujui' => $kesalahan === 0,
        ];

        $baris = [
            'tahun_ajaran_id' => $konteks['tahun_ajaran_id'],
            'tahun_ajaran' => $konteks['tahun_ajaran'],
            'semester' => $konteks['semester'],
            'kelas' => $row['kelas'],
            'mata_pelajaran' => $row['mata_pelajaran'],
            'guru' => $row['guru'],
            'jumlah_siswa' => $row['jumlah_siswa'],
            'status_kunci' => $kunci?->status === 'terkunci' ? 'terkunci' : 'tidak_terkunci',
            'tanggal_kunci' => $kunci?->status === 'terkunci' ? $kunci->tanggal_kunci : null,
        ];

        $detailSiswa = $siswa->map(function ($s) use ($perSiswa) {
            $items = $perSiswa->get($s['id'], collect());

            return [
                'id' => $s['id'],
                'nis' => $s['nis'],
                'nama' => $s['nama'],
                'nilai' => collect(self::JENIS_LABEL)->map(fn ($label, $j) => $items->where('jenis_nilai', $j)->pluck('nilai')->map(fn ($v) => (float) $v)->values())->all(),
                'kosong' => $s['kosong'],
                'rata_rata' => $s['rata_rata'],
            ];
        })->values();

        return [
            'baris' => $baris,
            'pemeriksaan' => $pemeriksaan,
            'siswa' => $detailSiswa,
            'kunci' => $kunci,
            'guru_ids' => $guruPengampu->merge($nilai->pluck('guru_id'))->unique()->values()->all(),
            'verifikasi' => $verifikasi ? [
                'status' => $verifikasi->status,
                'status_label' => self::STATUS_LABEL[$verifikasi->status],
                'verifikator' => $verifikasi->verifikator?->name,
                'tanggal_verifikasi' => $verifikasi->tanggal_verifikasi,
                'catatan' => $verifikasi->catatan,
            ] : null,
        ];
    }

    private function ringkasPemeriksaan(array $pem): array
    {
        return [
            'persen' => $pem['kelengkapan']['persen'],
            'siswa_nilai_kosong' => $pem['nilai_kosong']['jumlah_siswa'],
            'di_luar_batas' => $pem['di_luar_batas']['jumlah'],
            'temuan_konsistensi' => $pem['konsistensi']['jumlah'],
            'di_bawah_kkm' => $pem['di_bawah_kkm']['jumlah'] ?? null,
            'jumlah_kesalahan' => $pem['jumlah_kesalahan'],
            'jumlah_peringatan' => $pem['jumlah_peringatan'],
        ];
    }

    /**
     * Beri tahu guru terkait hasil verifikasi lewat notifikasi database.
     *
     * @param list<int> $guruIds
     * @return list<string> nama guru tanpa akun
     */
    private function beritahu(VerifikasiNilai $v, array $guruIds, string $status, string $catatan, bool $kunciDibuka): array
    {
        $hasil = [
            'disetujui' => 'Nilai diverifikasi dan disetujui',
            'ditolak' => 'Nilai ditolak dalam verifikasi',
            'perlu_perbaikan' => 'Nilai perlu diperbaiki',
        ][$status];
        $pesan = "{$this->nama($v)}: {$hasil}."
            .($catatan !== '' ? " Catatan verifikator: {$catatan}" : '')
            .($kunciDibuka ? ' Kunci nilai telah dibuka agar Anda dapat memperbaikinya.' : '');

        $tanpaAkun = [];
        foreach (Guru::with('user')->whereIn('id', $guruIds)->get() as $guru) {
            if ($guru->user) {
                $guru->user->notify(new VerifikasiNilaiNotification("Verifikasi nilai: {$hasil}", $pesan));
            } else {
                $tanpaAkun[] = $guru->nama;
            }
        }

        return $tanpaAkun;
    }

    private function nama(VerifikasiNilai $v): string
    {
        return "{$v->mataPelajaran?->nama_mapel} — {$v->kelas?->nama_kelas} ({$v->tahunAjaran?->nama} {$v->semester})";
    }
}

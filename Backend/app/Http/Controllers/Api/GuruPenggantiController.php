<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\HariEfektif;
use App\Models\JadwalPelajaran;
use App\Models\JamBelajar;
use App\Models\Kelas;
use App\Models\GuruPengganti;
use App\Notifications\GuruPenggantiNotification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Guru pengganti: menugaskan guru lain untuk satu jam pelajaran pada satu
 * tanggal ketika guru pengampu berhalangan. Baris selalu berasal dari jadwal
 * pelajaran reguler guru berhalangan (rombel, mapel, dan jam ikut jadwal).
 *
 * Alur status: menunggu_persetujuan → disetujui | ditolak; disetujui/menunggu
 * → dibatalkan. Ketersediaan guru pengganti dicek terhadap absensi guru,
 * jadwal reguler pada hari itu, dan penggantian lain yang tumpang tindih;
 * bentrok menolak penyimpanan. Guru dinotifikasi lewat notifikasi database.
 */
class GuruPenggantiController extends Controller
{
    private const AKTIF = ['menunggu_persetujuan', 'disetujui'];

    private const STATUS_LABEL = [
        'menunggu_persetujuan' => 'Menunggu Persetujuan',
        'disetujui' => 'Disetujui',
        'ditolak' => 'Ditolak',
        'dibatalkan' => 'Dibatalkan',
    ];

    private const HARI = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];

    private const LOG = 'guru-pengganti';

    /** @var ?\Illuminate\Support\Collection<int, JamBelajar> */
    private $jamBelajar = null;

    public function opsi(): JsonResponse
    {
        return response()->json([
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
            'kelas' => Kelas::orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tahun_ajaran']),
            'status' => collect(self::STATUS_LABEL)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $paged = $this->query($request)->paginate($request->integer('per_page', 15));
        $paged->getCollection()->transform(fn (GuruPengganti $p) => $this->present($p));

        return response()->json($paged);
    }

    /** Jadwal reguler guru pada hari dari tanggal tertentu, dan mana yang sudah punya pengganti. */
    public function jadwalGuru(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guru_id' => ['required', 'integer', 'exists:guru,id'],
            'tanggal' => ['required', 'date_format:Y-m-d'],
        ]);
        $hari = self::HARI[Carbon::parse($data['tanggal'])->dayOfWeekIso];

        $terpakai = GuruPengganti::where('tanggal', $data['tanggal'])->whereIn('status', self::AKTIF)->pluck('id', 'jadwal_id');

        $jadwal = JadwalPelajaran::with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->where('guru_id', $data['guru_id'])->where('hari', $hari)->orderBy('jam_mulai')->get()
            ->map(fn (JadwalPelajaran $j) => [
                'id' => $j->id,
                'hari' => $j->hari,
                'jam_mulai' => substr((string) $j->jam_mulai, 0, 5),
                'jam_selesai' => substr((string) $j->jam_selesai, 0, 5),
                'jam_ke' => $this->labelJamKe($j->jam_mulai, $j->jam_selesai),
                'kelas' => $j->kelas?->nama_kelas,
                'mata_pelajaran' => $j->mataPelajaran?->nama_mapel,
                'sudah_ada_pengganti' => $terpakai->has($j->id),
            ]);

        return response()->json([
            'hari' => $hari,
            'jadwal' => $jadwal,
            'peringatan' => $this->peringatanTanggal($data['tanggal']),
        ]);
    }

    /** Ketersediaan seluruh guru untuk satu rentang jam pada satu tanggal. */
    public function ketersediaan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tanggal' => ['required', 'date_format:Y-m-d'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'guru_berhalangan_id' => ['nullable', 'integer'],
            'exclude_id' => ['nullable', 'integer'],
        ]);

        $guru = Guru::orderBy('nama')->get(['id', 'nama'])
            ->reject(fn (Guru $g) => $g->id === (int) ($data['guru_berhalangan_id'] ?? 0))
            ->map(function (Guru $g) use ($data) {
                $alasan = $this->konflik($g->id, $data['tanggal'], $data['jam_mulai'], $data['jam_selesai'], $data['exclude_id'] ?? null);

                return [
                    'id' => $g->id,
                    'nama' => $g->nama,
                    'tersedia' => $alasan === [],
                    'alasan' => $alasan,
                    'jumlah_pengganti_hari_ini' => GuruPengganti::where('tanggal', $data['tanggal'])->where('guru_pengganti_id', $g->id)->whereIn('status', self::AKTIF)->count(),
                ];
            })
            ->sortByDesc('tersedia')->values();

        return response()->json($guru);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tanggal' => ['required', 'date_format:Y-m-d'],
            'guru_berhalangan_id' => ['required', 'integer', 'exists:guru,id'],
            'alasan' => ['required', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.jadwal_id' => ['required', 'integer', 'exists:jadwal_pelajaran,id'],
            'items.*.guru_pengganti_id' => ['required', 'integer', 'exists:guru,id'],
        ]);
        $hari = self::HARI[Carbon::parse($data['tanggal'])->dayOfWeekIso];

        $dibuat = collect();
        DB::transaction(function () use ($data, $hari, $request, &$dibuat) {
            foreach ($data['items'] as $i => $item) {
                $jadwal = JadwalPelajaran::findOrFail($item['jadwal_id']);
                $pesan = $this->validasiSlot($jadwal, (int) $data['guru_berhalangan_id'], (int) $item['guru_pengganti_id'], $data['tanggal'], $hari, null);
                if ($pesan) {
                    throw ValidationException::withMessages(["items.{$i}.guru_pengganti_id" => $pesan]);
                }

                $dibuat->push(GuruPengganti::create([
                    'tanggal' => $data['tanggal'],
                    'jadwal_id' => $jadwal->id,
                    'kelas_id' => $jadwal->kelas_id,
                    'mata_pelajaran_id' => $jadwal->mata_pelajaran_id,
                    'jam_mulai' => $jadwal->jam_mulai,
                    'jam_selesai' => $jadwal->jam_selesai,
                    'guru_berhalangan_id' => $data['guru_berhalangan_id'],
                    'guru_pengganti_id' => $item['guru_pengganti_id'],
                    'alasan' => $data['alasan'],
                    'catatan' => $data['catatan'] ?? null,
                    'dibuat_oleh' => $request->user()?->id,
                ]));
            }
        });

        $tanpaAkun = [];
        foreach ($dibuat as $p) {
            $this->muat($p);
            $this->log($request, $p, 'created', "Mengajukan penggantian {$this->label($p)}.", ['new' => $this->snapshot($p)]);
            $tanpaAkun = array_merge($tanpaAkun, $this->beritahu(
                $p,
                'Penugasan guru pengganti',
                "Anda ditugaskan menggantikan {$p->guruBerhalangan?->nama} pada {$this->hariTanggal($p)} ({$this->jam($p)}), {$p->mataPelajaran?->nama_mapel} di {$p->kelas?->nama_kelas}. Menunggu persetujuan.",
                [$p->guru_pengganti_id]
            ));
            $tanpaAkun = array_merge($tanpaAkun, $this->beritahu(
                $p,
                'Penggantian jam mengajar Anda',
                "Jam {$p->mataPelajaran?->nama_mapel} di {$p->kelas?->nama_kelas} pada {$this->hariTanggal($p)} ({$this->jam($p)}) akan digantikan oleh {$p->guruPengganti?->nama}.",
                [$p->guru_berhalangan_id]
            ));
        }

        return response()->json([
            'message' => "{$dibuat->count()} penggantian diajukan.",
            'dibuat' => $dibuat->count(),
            'peringatan' => array_values(array_filter([
                ...$this->peringatanTanggal($data['tanggal']),
                $this->peringatanAkun($tanpaAkun),
            ])),
        ], 201);
    }

    public function show(GuruPengganti $guruPengganti): JsonResponse
    {
        $riwayat = Activity::where('log_name', self::LOG)
            ->where('subject_type', GuruPengganti::class)->where('subject_id', $guruPengganti->id)
            ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->get()
            ->map(fn (Activity $a) => $this->presentLog($a));

        return response()->json([...$this->present($guruPengganti), 'riwayat' => $riwayat]);
    }

    /** Ubah guru pengganti, alasan, atau catatan. Tanggal/jadwal tidak diubah — batalkan lalu ajukan ulang. */
    public function update(Request $request, GuruPengganti $guruPengganti): JsonResponse
    {
        if (! in_array($guruPengganti->status, ['menunggu_persetujuan', 'disetujui', 'ditolak'], true)) {
            throw ValidationException::withMessages(['status' => 'Penggantian yang sudah dibatalkan tidak dapat diubah.']);
        }
        $data = $request->validate([
            'guru_pengganti_id' => ['required', 'integer', 'exists:guru,id'],
            'alasan' => ['required', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);

        $tanggal = substr((string) $guruPengganti->tanggal, 0, 10);
        $berubahPengganti = (int) $data['guru_pengganti_id'] !== (int) $guruPengganti->guru_pengganti_id;

        if ($berubahPengganti) {
            $jadwal = $guruPengganti->jadwal_id ? JadwalPelajaran::find($guruPengganti->jadwal_id) : null;
            $pesan = $this->validasiPengganti($guruPengganti, (int) $data['guru_pengganti_id'], $tanggal, $guruPengganti->id, $jadwal?->id);
            if ($pesan) {
                throw ValidationException::withMessages(['guru_pengganti_id' => $pesan]);
            }
        }

        $this->muat($guruPengganti);
        $old = $this->snapshot($guruPengganti);
        $penggantiLama = $guruPengganti->guru_pengganti_id;

        $ubah = $data;
        if ($berubahPengganti) {
            // Pengganti baru harus disetujui ulang.
            $ubah += ['status' => 'menunggu_persetujuan', 'diputuskan_oleh' => null, 'tanggal_keputusan' => null, 'catatan_keputusan' => null];
        }
        $guruPengganti->update($ubah);
        $this->muat($guruPengganti->refresh());
        $new = $this->snapshot($guruPengganti);

        $tanpaAkun = [];
        if ($old !== $new) {
            $this->log($request, $guruPengganti, 'updated', "Memperbarui penggantian {$this->label($guruPengganti)}.", ['old' => $old, 'new' => $new]);
            if ($berubahPengganti) {
                $tanpaAkun = array_merge(
                    $this->beritahu($guruPengganti, 'Penugasan guru pengganti', "Anda ditugaskan menggantikan {$guruPengganti->guruBerhalangan?->nama} pada {$this->hariTanggal($guruPengganti)} ({$this->jam($guruPengganti)}), {$guruPengganti->mataPelajaran?->nama_mapel} di {$guruPengganti->kelas?->nama_kelas}. Menunggu persetujuan.", [$guruPengganti->guru_pengganti_id]),
                    $this->beritahu($guruPengganti, 'Penugasan pengganti dialihkan', "Penugasan Anda sebagai pengganti pada {$this->hariTanggal($guruPengganti)} ({$this->jam($guruPengganti)}) dialihkan ke guru lain.", [$penggantiLama]),
                    $this->beritahu($guruPengganti, 'Guru pengganti diubah', "Guru pengganti untuk jam Anda pada {$this->hariTanggal($guruPengganti)} kini {$guruPengganti->guruPengganti?->nama}.", [$guruPengganti->guru_berhalangan_id]),
                );
            }
        }

        return response()->json([...$this->present($guruPengganti), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))]);
    }

    /** Setujui atau tolak penggantian yang menunggu persetujuan. */
    public function keputusan(Request $request, GuruPengganti $guruPengganti): JsonResponse
    {
        $data = $request->validate([
            'aksi' => ['required', 'in:setujui,tolak'],
            'catatan_keputusan' => ['required_if:aksi,tolak', 'nullable', 'string', 'max:2000'],
        ]);
        if ($guruPengganti->status !== 'menunggu_persetujuan') {
            throw ValidationException::withMessages(['status' => 'Hanya penggantian yang menunggu persetujuan yang dapat diputuskan.']);
        }

        $setujui = $data['aksi'] === 'setujui';
        if ($setujui) {
            // Kondisi bisa berubah sejak diajukan; cek ulang bentrok sebelum menyetujui.
            $pesan = $this->validasiPengganti($guruPengganti, (int) $guruPengganti->guru_pengganti_id, substr((string) $guruPengganti->tanggal, 0, 10), $guruPengganti->id, $guruPengganti->jadwal_id);
            if ($pesan) {
                throw ValidationException::withMessages(['guru_pengganti_id' => "Tidak dapat disetujui: {$pesan}"]);
            }
        }

        $this->muat($guruPengganti);
        $old = $this->snapshot($guruPengganti);
        $guruPengganti->update([
            'status' => $setujui ? 'disetujui' : 'ditolak',
            'catatan_keputusan' => $data['catatan_keputusan'] ?? null,
            'diputuskan_oleh' => $request->user()?->id,
            'tanggal_keputusan' => now(),
        ]);
        $this->muat($guruPengganti->refresh());
        $this->log($request, $guruPengganti, $setujui ? 'approved' : 'rejected', ($setujui ? 'Menyetujui' : 'Menolak')." penggantian {$this->label($guruPengganti)}.", [
            'old' => ['status' => $old['status']],
            'new' => ['status' => $this->snapshot($guruPengganti)['status'], 'catatan_keputusan' => $guruPengganti->catatan_keputusan],
        ]);

        $hasil = $setujui ? 'disetujui' : 'ditolak';
        $tanpaAkun = $this->beritahu(
            $guruPengganti,
            $setujui ? 'Penggantian disetujui' : 'Penggantian ditolak',
            "Penggantian {$guruPengganti->mataPelajaran?->nama_mapel} di {$guruPengganti->kelas?->nama_kelas} pada {$this->hariTanggal($guruPengganti)} ({$this->jam($guruPengganti)}) {$hasil}."
                .(! $setujui && $guruPengganti->catatan_keputusan ? " Alasan: {$guruPengganti->catatan_keputusan}" : ''),
            [$guruPengganti->guru_pengganti_id, $guruPengganti->guru_berhalangan_id]
        );

        return response()->json([...$this->present($guruPengganti), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))]);
    }

    public function batalkan(Request $request, GuruPengganti $guruPengganti): JsonResponse
    {
        $data = $request->validate(['catatan_keputusan' => ['nullable', 'string', 'max:2000']]);
        if (! in_array($guruPengganti->status, self::AKTIF, true)) {
            throw ValidationException::withMessages(['status' => 'Hanya penggantian yang menunggu persetujuan atau sudah disetujui yang dapat dibatalkan.']);
        }

        $this->muat($guruPengganti);
        $lama = $guruPengganti->status;
        $guruPengganti->update([
            'status' => 'dibatalkan',
            'catatan_keputusan' => $data['catatan_keputusan'] ?? null,
            'diputuskan_oleh' => $request->user()?->id,
            'tanggal_keputusan' => now(),
        ]);
        $this->log($request, $guruPengganti, 'cancelled', "Membatalkan penggantian {$this->label($guruPengganti)}.", [
            'old' => ['status' => $lama],
            'new' => ['status' => 'dibatalkan', 'catatan_keputusan' => $guruPengganti->catatan_keputusan],
        ]);

        $tanpaAkun = $this->beritahu(
            $guruPengganti,
            'Penggantian dibatalkan',
            "Penggantian {$guruPengganti->mataPelajaran?->nama_mapel} di {$guruPengganti->kelas?->nama_kelas} pada {$this->hariTanggal($guruPengganti)} ({$this->jam($guruPengganti)}) dibatalkan."
                .($guruPengganti->catatan_keputusan ? " Alasan: {$guruPengganti->catatan_keputusan}" : ''),
            [$guruPengganti->guru_pengganti_id, $guruPengganti->guru_berhalangan_id]
        );

        return response()->json([...$this->present($guruPengganti), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))]);
    }

    public function riwayat(Request $request): JsonResponse
    {
        return response()->json(
            Activity::where('log_name', self::LOG)->with('causer:id,name')
                ->orderByDesc('created_at')->orderByDesc('id')->limit(100)->get()
                ->map(fn (Activity $a) => $this->presentLog($a))
        );
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->get()->map(fn (GuruPengganti $p) => $this->present($p));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Guru Pengganti');
        $sheet->fromArray(['Tanggal', 'Hari', 'Jam', 'Jam Pelajaran', 'Rombel', 'Mata Pelajaran', 'Guru Berhalangan', 'Guru Pengganti', 'Alasan', 'Status', 'Catatan', 'Catatan Keputusan'], null, 'A1');
        $sheet->getStyle('A1:L1')->getFont()->setBold(true);
        $sheet->fromArray($rows->map(fn ($r) => [
            $r['tanggal'], $r['hari'], "{$r['jam_mulai']}-{$r['jam_selesai']}", $r['jam_ke'], $r['kelas']['nama_kelas'] ?? '',
            $r['mata_pelajaran']['nama_mapel'] ?? '', $r['guru_berhalangan']['nama'] ?? '', $r['guru_pengganti']['nama'] ?? '',
            $r['alasan'], $r['status_label'], $r['catatan'], $r['catatan_keputusan'],
        ])->all(), null, 'A2');
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'guru-pengganti-'.now()->format('Y-m-d').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function query(Request $request): Builder
    {
        return GuruPengganti::query()
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruBerhalangan:id,nama', 'guruPengganti:id,nama', 'diputuskanOleh:id,name'])
            ->when($request->filled('tanggal_dari'), fn ($q) => $q->where('tanggal', '>=', $request->string('tanggal_dari')->value()))
            ->when($request->filled('tanggal_sampai'), fn ($q) => $q->where('tanggal', '<=', $request->string('tanggal_sampai')->value()))
            ->when($request->filled('guru_id'), fn ($q) => $q->where(fn ($qq) => $qq
                ->where('guru_berhalangan_id', $request->integer('guru_id'))->orWhere('guru_pengganti_id', $request->integer('guru_id'))))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()))
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->string('search')->trim().'%';
                $q->where(fn ($qq) => $qq->where('alasan', 'like', $like)
                    ->orWhereHas('mataPelajaran', fn ($m) => $m->where('nama_mapel', 'like', $like))
                    ->orWhereHas('guruBerhalangan', fn ($g) => $g->where('nama', 'like', $like))
                    ->orWhereHas('guruPengganti', fn ($g) => $g->where('nama', 'like', $like)));
            })
            ->orderByDesc('tanggal')->orderBy('jam_mulai');
    }

    /** Pesan galat bila slot tidak valid (jadwal bukan milik guru, hari salah, sudah ada pengganti, atau pengganti bentrok). */
    private function validasiSlot(JadwalPelajaran $jadwal, int $berhalanganId, int $penggantiId, string $tanggal, string $hari, ?int $excludeId): ?string
    {
        if ((int) $jadwal->guru_id !== $berhalanganId) {
            return 'Jadwal tersebut bukan milik guru yang berhalangan.';
        }
        if ($jadwal->hari !== $hari) {
            return "Jadwal ini pada hari {$jadwal->hari}, sedangkan tanggal {$tanggal} jatuh pada hari {$hari}.";
        }
        if ($penggantiId === $berhalanganId) {
            return 'Guru pengganti tidak boleh sama dengan guru yang berhalangan.';
        }
        if (GuruPengganti::where('jadwal_id', $jadwal->id)->where('tanggal', $tanggal)->whereIn('status', self::AKTIF)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))->exists()) {
            return 'Jadwal ini sudah memiliki penggantian aktif pada tanggal tersebut.';
        }

        return $this->validasiPengganti(null, $penggantiId, $tanggal, $excludeId, $jadwal->id, $jadwal);
    }

    private function validasiPengganti(?GuruPengganti $p, int $penggantiId, string $tanggal, ?int $excludeId, ?int $jadwalId, ?JadwalPelajaran $jadwal = null): ?string
    {
        $mulai = substr((string) ($jadwal?->jam_mulai ?? $p?->jam_mulai), 0, 5);
        $selesai = substr((string) ($jadwal?->jam_selesai ?? $p?->jam_selesai), 0, 5);
        if ($p && (int) $penggantiId === (int) $p->guru_berhalangan_id) {
            return 'Guru pengganti tidak boleh sama dengan guru yang berhalangan.';
        }
        $alasan = $this->konflik($penggantiId, $tanggal, $mulai, $selesai, $excludeId);
        if ($alasan) {
            $nama = Guru::whereKey($penggantiId)->value('nama');

            return "{$nama} tidak tersedia: ".implode('; ', $alasan).'.';
        }

        return null;
    }

    /**
     * Alasan sebuah guru tidak dapat menggantikan pada tanggal & rentang jam:
     * tidak hadir (absensi guru), mengajar reguler yang tumpang tindih, atau
     * sudah jadi pengganti lain. Jam reguler yang sedang digantikan orang
     * lain pada tanggal itu tidak dihitung bentrok.
     *
     * @return list<string>
     */
    private function konflik(int $guruId, string $tanggal, string $mulai, string $selesai, ?int $excludeId): array
    {
        $alasan = [];

        $absen = AbsensiGuru::where('guru_id', $guruId)->where('tanggal', $tanggal)->whereIn('status', ['izin', 'sakit', 'alpha'])->value('status');
        if ($absen) {
            $alasan[] = "tercatat {$absen} pada tanggal ini";
        }

        $hari = self::HARI[Carbon::parse($tanggal)->dayOfWeekIso];
        $digantikan = GuruPengganti::where('tanggal', $tanggal)->whereIn('status', self::AKTIF)
            ->where('guru_berhalangan_id', $guruId)->whereNotNull('jadwal_id')->pluck('jadwal_id')->all();

        $bentrokJadwal = JadwalPelajaran::with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->where('guru_id', $guruId)->where('hari', $hari)->whereNotIn('id', $digantikan)->get()
            ->filter(fn (JadwalPelajaran $j) => $this->tumpangTindih($mulai, $selesai, substr((string) $j->jam_mulai, 0, 5), substr((string) $j->jam_selesai, 0, 5)));
        foreach ($bentrokJadwal as $j) {
            $alasan[] = "mengajar {$j->mataPelajaran?->nama_mapel} di {$j->kelas?->nama_kelas} ".substr((string) $j->jam_mulai, 0, 5).'–'.substr((string) $j->jam_selesai, 0, 5);
        }

        $bentrokPengganti = GuruPengganti::with(['kelas:id,nama_kelas'])->where('tanggal', $tanggal)->whereIn('status', self::AKTIF)
            ->where('guru_pengganti_id', $guruId)->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))->get()
            ->filter(fn (GuruPengganti $g) => $this->tumpangTindih($mulai, $selesai, substr((string) $g->jam_mulai, 0, 5), substr((string) $g->jam_selesai, 0, 5)));
        foreach ($bentrokPengganti as $g) {
            $alasan[] = "sudah menjadi pengganti di {$g->kelas?->nama_kelas} ".substr((string) $g->jam_mulai, 0, 5).'–'.substr((string) $g->jam_selesai, 0, 5);
        }

        return $alasan;
    }

    private function tumpangTindih(string $mulaiA, string $selesaiA, string $mulaiB, string $selesaiB): bool
    {
        return $mulaiA < $selesaiB && $mulaiB < $selesaiA;
    }

    /** @return list<string> */
    private function peringatanTanggal(string $tanggal): array
    {
        $jenis = HariEfektif::where('tanggal', $tanggal)->where('jenis', '!=', 'efektif')->value('jenis');
        if (! $jenis) {
            return [];
        }
        $label = ['libur' => 'Libur', 'kegiatan_sekolah' => 'Kegiatan Sekolah', 'ujian' => 'Ujian', 'lainnya' => 'Lainnya'][$jenis] ?? $jenis;

        return ["Tanggal {$tanggal} ditandai \"{$label}\" di Hari Efektif; pastikan penggantian memang diperlukan."];
    }

    /** @param list<string> $nama */
    private function peringatanAkun(array $nama): ?string
    {
        $nama = array_values(array_unique($nama));

        return $nama ? 'Notifikasi tidak terkirim karena belum punya akun pengguna: '.implode(', ', $nama).'.' : null;
    }

    /**
     * Kirim notifikasi database ke akun pengguna para guru.
     *
     * @param list<int> $guruIds
     * @return list<string> nama guru yang tidak punya akun
     */
    private function beritahu(GuruPengganti $p, string $judul, string $pesan, array $guruIds): array
    {
        $tanpaAkun = [];
        foreach (Guru::with('user')->whereIn('id', array_unique($guruIds))->get() as $guru) {
            if ($guru->user) {
                $guru->user->notify(new GuruPenggantiNotification($p->id, $judul, $pesan));
            } else {
                $tanpaAkun[] = $guru->nama;
            }
        }

        return $tanpaAkun;
    }

    private function labelJamKe(mixed $mulai, mixed $selesai): ?string
    {
        $this->jamBelajar ??= JamBelajar::orderBy('jam_ke')->get();
        $m = substr((string) $mulai, 0, 5);
        $s = substr((string) $selesai, 0, 5);
        $ke = $this->jamBelajar
            ->filter(fn ($j) => $this->tumpangTindih($m, $s, substr((string) $j->jam_mulai, 0, 5), substr((string) $j->jam_selesai, 0, 5)))
            ->pluck('jam_ke');
        if ($ke->isEmpty()) {
            return null;
        }

        return $ke->count() === 1 || $ke->min() === $ke->max() ? "Jam ke-{$ke->min()}" : "Jam ke-{$ke->min()}–{$ke->max()}";
    }

    private function hariTanggal(GuruPengganti $p): string
    {
        $t = Carbon::parse($p->tanggal);

        return self::HARI[$t->dayOfWeekIso].', '.$t->format('d-m-Y');
    }

    private function jam(GuruPengganti $p): string
    {
        return substr((string) $p->jam_mulai, 0, 5).'–'.substr((string) $p->jam_selesai, 0, 5);
    }

    private function present(GuruPengganti $p): array
    {
        $p->loadMissing(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruBerhalangan:id,nama', 'guruPengganti:id,nama', 'diputuskanOleh:id,name']);
        $tanggal = substr((string) $p->tanggal, 0, 10);

        return [
            'id' => $p->id,
            'tanggal' => $tanggal,
            'hari' => self::HARI[Carbon::parse($tanggal)->dayOfWeekIso],
            'jam_mulai' => substr((string) $p->jam_mulai, 0, 5),
            'jam_selesai' => substr((string) $p->jam_selesai, 0, 5),
            'jam_ke' => $this->labelJamKe($p->jam_mulai, $p->jam_selesai),
            'kelas' => $p->kelas?->only(['id', 'nama_kelas']),
            'mata_pelajaran' => $p->mataPelajaran?->only(['id', 'nama_mapel']),
            'guru_berhalangan' => $p->guruBerhalangan?->only(['id', 'nama']),
            'guru_pengganti' => $p->guruPengganti?->only(['id', 'nama']),
            'alasan' => $p->alasan,
            'status' => $p->status,
            'status_label' => self::STATUS_LABEL[$p->status],
            'catatan' => $p->catatan,
            'catatan_keputusan' => $p->catatan_keputusan,
            'diputuskan_oleh' => $p->diputuskanOleh?->name,
            'tanggal_keputusan' => $p->tanggal_keputusan,
        ];
    }

    private function presentLog(Activity $a): array
    {
        return [
            'id' => $a->id,
            'event' => $a->event,
            'description' => $a->description,
            'causer' => $a->causer?->name,
            'properties' => $a->properties,
            'created_at' => $a->created_at,
        ];
    }

    private function muat(GuruPengganti $p): void
    {
        $p->loadMissing(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruBerhalangan:id,nama', 'guruPengganti:id,nama']);
    }

    private function snapshot(GuruPengganti $p): array
    {
        $this->muat($p);

        return [
            'tanggal' => substr((string) $p->tanggal, 0, 10),
            'jam' => $this->jam($p),
            'rombel' => $p->kelas?->nama_kelas,
            'mata_pelajaran' => $p->mataPelajaran?->nama_mapel,
            'guru_berhalangan' => $p->guruBerhalangan?->nama,
            'guru_pengganti' => $p->guruPengganti?->nama,
            'alasan' => $p->alasan,
            'status' => $p->status,
            'catatan' => $p->catatan,
        ];
    }

    private function label(GuruPengganti $p): string
    {
        $this->muat($p);

        return "{$p->mataPelajaran?->nama_mapel} — {$p->kelas?->nama_kelas} ({$this->hariTanggal($p)}, {$this->jam($p)})";
    }

    private function log(Request $request, GuruPengganti $p, string $event, string $deskripsi, array $properties): void
    {
        activity(self::LOG)->performedOn($p)->causedBy($request->user())->event($event)->withProperties($properties)->log($deskripsi);
    }
}

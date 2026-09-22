<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsensiGuru;
use App\Models\Guru;
use App\Models\GuruPengganti;
use App\Models\JadwalPelajaran;
use App\Models\Kelas;
use App\Models\PerubahanJadwal;
use App\Notifications\PerubahanJadwalNotification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Perubahan jadwal pelajaran yang sudah ditetapkan. Setiap pengajuan merujuk
 * ke satu baris jadwal dan menyimpan jadwal lama (snapshot) serta jadwal baru.
 *
 * - sementara: berlaku untuk satu kemunculan jadwal (tanggal_perubahan) dan
 *   boleh dipindah ke tanggal lain (tanggal_baru); jadwal dasar tidak diubah.
 * - permanen: berlaku mulai tanggal_perubahan; setelah disetujui, tombol
 *   "Terapkan ke Jadwal" mengubah hari/jam/guru di jadwal dasar.
 *
 * Bentrok dicek untuk guru, kelas, dan ruang. Jadwal dasar belum menyimpan
 * ruang, jadi ruang dianggap terpakai oleh rombel yang ruang kelasnya sama
 * pada jam jadwal reguler rombel itu, atau oleh perubahan lain yang aktif.
 * Bentrok menolak penyimpanan/persetujuan.
 */
class PerubahanJadwalController extends Controller
{
    private const AKTIF = ['menunggu_persetujuan', 'disetujui'];

    private const STATUS_LABEL = [
        'menunggu_persetujuan' => 'Menunggu Persetujuan',
        'disetujui' => 'Disetujui',
        'ditolak' => 'Ditolak',
        'dibatalkan' => 'Dibatalkan',
    ];

    private const HARI = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];

    private const LOG = 'perubahan-jadwal';

    public function opsi(): JsonResponse
    {
        return response()->json([
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
            'kelas' => Kelas::orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tahun_ajaran', 'ruang_kelas']),
            'status' => collect(self::STATUS_LABEL)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
        ]);
    }

    /** Daftar jadwal dasar untuk dipilih sebagai objek perubahan. */
    public function jadwal(Request $request): JsonResponse
    {
        $jadwal = JadwalPelajaran::with(['kelas:id,nama_kelas,ruang_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->when($request->filled('guru_id'), fn ($q) => $q->where('guru_id', $request->integer('guru_id')))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->orderByRaw("case hari when 'Senin' then 1 when 'Selasa' then 2 when 'Rabu' then 3 when 'Kamis' then 4 when 'Jumat' then 5 else 6 end")
            ->orderBy('jam_mulai')->limit(300)->get()
            ->map(fn (JadwalPelajaran $j) => [
                'id' => $j->id,
                'hari' => $j->hari,
                'jam_mulai' => $this->jam($j->jam_mulai),
                'jam_selesai' => $this->jam($j->jam_selesai),
                'kelas' => ['id' => $j->kelas_id, 'nama_kelas' => $j->kelas?->nama_kelas],
                'mata_pelajaran' => $j->mataPelajaran?->nama_mapel,
                'guru' => ['id' => $j->guru_id, 'nama' => $j->guru?->nama],
                'ruang' => $j->kelas?->ruang_kelas,
            ]);

        return response()->json($jadwal);
    }

    public function index(Request $request): JsonResponse
    {
        $paged = $this->query($request)->paginate(min($request->integer('per_page', 15), 500));
        $paged->getCollection()->transform(fn (PerubahanJadwal $p) => $this->present($p));

        return response()->json($paged);
    }

    /** Cek bentrok guru/kelas/ruang tanpa menyimpan. */
    public function cekBentrok(Request $request): JsonResponse
    {
        $existing = $request->filled('exclude_id') ? PerubahanJadwal::find($request->integer('exclude_id')) : null;
        [, $target, $jadwal] = $this->susun($request, $existing, false);
        $konflik = $this->konflik($target, $existing?->id, $jadwal->id);

        return response()->json([
            'bentrok' => $konflik !== [],
            'konflik' => $konflik,
            'hari_baru' => $target['hari'],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        [$data, $target, $jadwal] = $this->susun($request, null, true);
        $this->tolakBentrok($target, null, $jadwal->id);

        $p = PerubahanJadwal::create($data + ['dibuat_oleh' => $request->user()?->id])->refresh();
        $this->muat($p);
        $this->log($request, $p, 'created', "Mengajukan perubahan jadwal {$this->label($p)}.", ['new' => $this->snapshot($p)]);

        $tanpaAkun = $this->beritahu(
            $p,
            'Pengajuan perubahan jadwal',
            "Jadwal {$p->mataPelajaran?->nama_mapel} di {$p->kelas?->nama_kelas} diajukan berubah: {$this->ringkasBaru($p)}. Menunggu persetujuan.",
        );

        return response()->json([...$this->present($p), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))], 201);
    }

    public function show(PerubahanJadwal $perubahanJadwal): JsonResponse
    {
        $riwayat = Activity::where('log_name', self::LOG)
            ->where('subject_type', PerubahanJadwal::class)->where('subject_id', $perubahanJadwal->id)
            ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->get()
            ->map(fn (Activity $a) => $this->presentLog($a));

        return response()->json([...$this->present($perubahanJadwal), 'riwayat' => $riwayat]);
    }

    public function update(Request $request, PerubahanJadwal $perubahanJadwal): JsonResponse
    {
        $this->pastikanBisaDiubah($perubahanJadwal);
        [$data, $target, $jadwal] = $this->susun($request, $perubahanJadwal, true);
        $this->tolakBentrok($target, $perubahanJadwal->id, $jadwal->id);

        $this->muat($perubahanJadwal);
        $old = $this->snapshot($perubahanJadwal);

        // Perubahan isi pada pengajuan yang sudah disetujui/ditolak harus diajukan ulang.
        $reset = $perubahanJadwal->status === 'menunggu_persetujuan'
            ? []
            : ['status' => 'menunggu_persetujuan', 'diputuskan_oleh' => null, 'tanggal_keputusan' => null, 'catatan_keputusan' => null];
        unset($data['jadwal_id'], $data['kelas_id'], $data['mata_pelajaran_id'], $data['hari_lama'], $data['jam_mulai_lama'], $data['jam_selesai_lama'], $data['guru_lama_id']);
        $perubahanJadwal->update($data + $reset);
        $this->muat($perubahanJadwal->refresh());
        $new = $this->snapshot($perubahanJadwal);

        $tanpaAkun = [];
        if ($old !== $new) {
            $this->log($request, $perubahanJadwal, 'updated', "Memperbarui perubahan jadwal {$this->label($perubahanJadwal)}.", ['old' => $old, 'new' => $new]);
            $tanpaAkun = $this->beritahu(
                $perubahanJadwal,
                'Pengajuan perubahan jadwal diperbarui',
                "Jadwal {$perubahanJadwal->mataPelajaran?->nama_mapel} di {$perubahanJadwal->kelas?->nama_kelas} kini diajukan: {$this->ringkasBaru($perubahanJadwal)}. Menunggu persetujuan.",
            );
        }

        return response()->json([...$this->present($perubahanJadwal), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))]);
    }

    public function keputusan(Request $request, PerubahanJadwal $perubahanJadwal): JsonResponse
    {
        $data = $request->validate([
            'aksi' => ['required', 'in:setujui,tolak'],
            'catatan_keputusan' => ['required_if:aksi,tolak', 'nullable', 'string', 'max:2000'],
        ]);
        if ($perubahanJadwal->status !== 'menunggu_persetujuan') {
            throw ValidationException::withMessages(['status' => 'Hanya pengajuan yang menunggu persetujuan yang dapat diputuskan.']);
        }

        $setujui = $data['aksi'] === 'setujui';
        if ($setujui) {
            // Kondisi bisa berubah sejak diajukan; cek ulang bentrok sebelum menyetujui.
            $this->tolakBentrok($this->targetDari($perubahanJadwal), $perubahanJadwal->id, $perubahanJadwal->jadwal_id, 'Tidak dapat disetujui. ');
        }

        $this->muat($perubahanJadwal);
        $lama = $perubahanJadwal->status;
        $perubahanJadwal->update([
            'status' => $setujui ? 'disetujui' : 'ditolak',
            'catatan_keputusan' => $data['catatan_keputusan'] ?? null,
            'diputuskan_oleh' => $request->user()?->id,
            'tanggal_keputusan' => now(),
        ]);
        $this->log($request, $perubahanJadwal, $setujui ? 'approved' : 'rejected', ($setujui ? 'Menyetujui' : 'Menolak')." perubahan jadwal {$this->label($perubahanJadwal)}.", [
            'old' => ['status' => $lama],
            'new' => ['status' => $perubahanJadwal->status, 'catatan_keputusan' => $perubahanJadwal->catatan_keputusan],
        ]);

        $tanpaAkun = $this->beritahu(
            $perubahanJadwal,
            $setujui ? 'Perubahan jadwal disetujui' : 'Perubahan jadwal ditolak',
            "Perubahan jadwal {$perubahanJadwal->mataPelajaran?->nama_mapel} di {$perubahanJadwal->kelas?->nama_kelas} ({$this->ringkasBaru($perubahanJadwal)}) ".($setujui ? 'disetujui' : 'ditolak').'.'
                .(! $setujui && $perubahanJadwal->catatan_keputusan ? " Alasan: {$perubahanJadwal->catatan_keputusan}" : ''),
        );

        return response()->json([...$this->present($perubahanJadwal->refresh()), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))]);
    }

    public function batalkan(Request $request, PerubahanJadwal $perubahanJadwal): JsonResponse
    {
        $data = $request->validate(['catatan_keputusan' => ['nullable', 'string', 'max:2000']]);
        if (! in_array($perubahanJadwal->status, self::AKTIF, true) || $perubahanJadwal->diterapkan_at) {
            throw ValidationException::withMessages(['status' => 'Hanya pengajuan aktif yang belum diterapkan ke jadwal yang dapat dibatalkan.']);
        }

        $lama = $perubahanJadwal->status;
        $perubahanJadwal->update([
            'status' => 'dibatalkan',
            'catatan_keputusan' => $data['catatan_keputusan'] ?? null,
            'diputuskan_oleh' => $request->user()?->id,
            'tanggal_keputusan' => now(),
        ]);
        $this->muat($perubahanJadwal);
        $this->log($request, $perubahanJadwal, 'cancelled', "Membatalkan perubahan jadwal {$this->label($perubahanJadwal)}.", [
            'old' => ['status' => $lama],
            'new' => ['status' => 'dibatalkan', 'catatan_keputusan' => $perubahanJadwal->catatan_keputusan],
        ]);

        $tanpaAkun = $this->beritahu(
            $perubahanJadwal,
            'Perubahan jadwal dibatalkan',
            "Perubahan jadwal {$perubahanJadwal->mataPelajaran?->nama_mapel} di {$perubahanJadwal->kelas?->nama_kelas} dibatalkan; jadwal tetap seperti semula."
                .($perubahanJadwal->catatan_keputusan ? " Alasan: {$perubahanJadwal->catatan_keputusan}" : ''),
        );

        return response()->json([...$this->present($perubahanJadwal), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))]);
    }

    /** Terapkan perubahan permanen yang sudah disetujui ke jadwal dasar (hari, jam, guru). */
    public function terapkan(Request $request, PerubahanJadwal $perubahanJadwal): JsonResponse
    {
        if ($perubahanJadwal->jenis !== 'permanen' || $perubahanJadwal->status !== 'disetujui' || $perubahanJadwal->diterapkan_at) {
            throw ValidationException::withMessages(['status' => 'Hanya perubahan permanen yang sudah disetujui dan belum diterapkan yang dapat diterapkan ke jadwal.']);
        }
        $jadwal = $perubahanJadwal->jadwal;
        if (! $jadwal) {
            throw ValidationException::withMessages(['jadwal' => 'Jadwal dasar sudah dihapus.']);
        }
        if ($jadwal->hari !== $perubahanJadwal->hari_lama
            || $this->jam($jadwal->jam_mulai) !== $this->jam($perubahanJadwal->jam_mulai_lama)
            || $this->jam($jadwal->jam_selesai) !== $this->jam($perubahanJadwal->jam_selesai_lama)
            || (int) $jadwal->guru_id !== (int) $perubahanJadwal->guru_lama_id) {
            throw ValidationException::withMessages(['jadwal' => 'Jadwal dasar sudah berubah sejak pengajuan dibuat. Batalkan dan ajukan ulang.']);
        }
        $this->tolakBentrok($this->targetDari($perubahanJadwal), $perubahanJadwal->id, $jadwal->id, 'Tidak dapat diterapkan. ');

        $jadwal->update([
            'hari' => $perubahanJadwal->hari_baru,
            'jam_mulai' => $perubahanJadwal->jam_mulai_baru,
            'jam_selesai' => $perubahanJadwal->jam_selesai_baru,
            'guru_id' => $perubahanJadwal->guru_baru_id,
        ]);
        $perubahanJadwal->update(['diterapkan_at' => now()]);
        $this->muat($perubahanJadwal);
        $this->log($request, $perubahanJadwal, 'applied', "Menerapkan perubahan jadwal {$this->label($perubahanJadwal)} ke jadwal dasar.", [
            'old' => ['hari' => $perubahanJadwal->hari_lama, 'jam' => $this->rentang($perubahanJadwal->jam_mulai_lama, $perubahanJadwal->jam_selesai_lama), 'guru' => $perubahanJadwal->guruLama?->nama],
            'new' => ['hari' => $perubahanJadwal->hari_baru, 'jam' => $this->rentang($perubahanJadwal->jam_mulai_baru, $perubahanJadwal->jam_selesai_baru), 'guru' => $perubahanJadwal->guruBaru?->nama],
        ]);

        $tanpaAkun = $this->beritahu(
            $perubahanJadwal,
            'Jadwal dasar diperbarui',
            "Jadwal {$perubahanJadwal->mataPelajaran?->nama_mapel} di {$perubahanJadwal->kelas?->nama_kelas} kini {$this->ringkasBaru($perubahanJadwal)}.",
        );

        return response()->json([...$this->present($perubahanJadwal->refresh()), 'peringatan' => array_values(array_filter([$this->peringatanAkun($tanpaAkun)]))]);
    }

    public function riwayat(): JsonResponse
    {
        return response()->json(
            Activity::where('log_name', self::LOG)->with('causer:id,name')
                ->orderByDesc('created_at')->orderByDesc('id')->limit(100)->get()
                ->map(fn (Activity $a) => $this->presentLog($a))
        );
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->get()->map(fn (PerubahanJadwal $p) => $this->present($p));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Perubahan Jadwal');
        $sheet->fromArray([
            'Tanggal Perubahan', 'Jenis', 'Tanggal Baru', 'Rombel', 'Mata Pelajaran', 'Guru Lama', 'Guru Baru',
            'Jadwal Lama', 'Jadwal Baru', 'Ruang Lama', 'Ruang Baru', 'Alasan', 'Pengaju', 'Status', 'Catatan', 'Catatan Keputusan',
        ], null, 'A1');
        $sheet->getStyle('A1:P1')->getFont()->setBold(true);
        $sheet->fromArray($rows->map(fn ($r) => [
            $r['tanggal_perubahan'], ucfirst($r['jenis']), $r['tanggal_baru'], $r['kelas']['nama_kelas'] ?? '', $r['mata_pelajaran']['nama_mapel'] ?? '',
            $r['guru_lama']['nama'] ?? '', $r['guru_baru']['nama'] ?? '', $r['jadwal_lama'], $r['jadwal_baru'],
            $r['ruang_lama'], $r['ruang_baru'], $r['alasan'], $r['pengaju'], $r['status_label'], $r['catatan'], $r['catatan_keputusan'],
        ])->all(), null, 'A2');
        foreach (range('A', 'P') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'perubahan-jadwal-'.now()->format('Y-m-d').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function query(Request $request): Builder
    {
        return PerubahanJadwal::query()
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruLama:id,nama', 'guruBaru:id,nama', 'pengaju:id,name', 'diputuskanOleh:id,name'])
            ->when($request->filled('tanggal_dari'), fn ($q) => $q->where('tanggal_perubahan', '>=', $request->string('tanggal_dari')->value()))
            ->when($request->filled('tanggal_sampai'), fn ($q) => $q->where('tanggal_perubahan', '<=', $request->string('tanggal_sampai')->value()))
            ->when($request->filled('guru_id'), fn ($q) => $q->where(fn ($qq) => $qq
                ->where('guru_lama_id', $request->integer('guru_id'))->orWhere('guru_baru_id', $request->integer('guru_id'))))
            ->when($request->filled('kelas_id'), fn ($q) => $q->where('kelas_id', $request->integer('kelas_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()))
            ->when($request->filled('jenis'), fn ($q) => $q->where('jenis', $request->string('jenis')->value()))
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->string('search')->trim().'%';
                $q->where(fn ($qq) => $qq->where('alasan', 'like', $like)
                    ->orWhereHas('mataPelajaran', fn ($m) => $m->where('nama_mapel', 'like', $like))
                    ->orWhereHas('guruLama', fn ($g) => $g->where('nama', 'like', $like))
                    ->orWhereHas('guruBaru', fn ($g) => $g->where('nama', 'like', $like)));
            })
            ->orderByDesc('tanggal_perubahan')->orderBy('jam_mulai_baru');
    }

    /**
     * Validasi input dan susun data simpan + target slot baru.
     *
     * @return array{0: array, 1: array, 2: JadwalPelajaran}
     */
    private function susun(Request $request, ?PerubahanJadwal $existing, bool $lengkap): array
    {
        $in = $request->validate([
            'jadwal_id' => [$existing ? 'nullable' : 'required', 'integer', 'exists:jadwal_pelajaran,id'],
            'jenis' => ['required', 'in:sementara,permanen'],
            'tanggal_perubahan' => ['required', 'date_format:Y-m-d'],
            'tanggal_baru' => ['nullable', 'date_format:Y-m-d'],
            'hari_baru' => ['nullable', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu'],
            'jam_mulai_baru' => ['required', 'date_format:H:i'],
            'jam_selesai_baru' => ['required', 'date_format:H:i', 'after:jam_mulai_baru'],
            'guru_baru_id' => ['nullable', 'integer', 'exists:guru,id'],
            'ruang_lama' => ['nullable', 'string', 'max:100'],
            'ruang_baru' => ['nullable', 'string', 'max:100'],
            'alasan' => [$lengkap ? 'required' : 'nullable', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);

        $jadwal = $existing ? $existing->jadwal : JadwalPelajaran::with(['kelas:id,nama_kelas,ruang_kelas'])->findOrFail($in['jadwal_id']);
        if (! $jadwal) {
            throw ValidationException::withMessages(['jadwal_id' => 'Jadwal dasar sudah dihapus.']);
        }
        $jadwal->loadMissing('kelas:id,nama_kelas,ruang_kelas');

        $hariLama = $existing?->hari_lama ?? $jadwal->hari;
        $jamMulaiLama = $existing ? $this->jam($existing->jam_mulai_lama) : $this->jam($jadwal->jam_mulai);
        $jamSelesaiLama = $existing ? $this->jam($existing->jam_selesai_lama) : $this->jam($jadwal->jam_selesai);
        $guruLama = $existing?->guru_lama_id ?? $jadwal->guru_id;
        $guruBaru = (int) ($in['guru_baru_id'] ?? $guruLama);
        $ruangLama = $existing ? ($in['ruang_lama'] ?? $existing->ruang_lama) : ($in['ruang_lama'] ?? $jadwal->kelas?->ruang_kelas);
        $ruangBaru = $in['ruang_baru'] ?? null;

        if ($in['jenis'] === 'sementara') {
            $hariAsli = self::HARI[Carbon::parse($in['tanggal_perubahan'])->dayOfWeekIso];
            if ($hariAsli !== $hariLama) {
                throw ValidationException::withMessages(['tanggal_perubahan' => "Jadwal ini berlangsung hari {$hariLama}, sedangkan {$in['tanggal_perubahan']} jatuh pada hari {$hariAsli}."]);
            }
            $tanggalBaru = $in['tanggal_baru'] ?? $in['tanggal_perubahan'];
            $hariBaru = self::HARI[Carbon::parse($tanggalBaru)->dayOfWeekIso];
            if ($hariBaru === 'Minggu') {
                throw ValidationException::withMessages(['tanggal_baru' => 'Tanggal baru jatuh pada hari Minggu.']);
            }
        } else {
            $tanggalBaru = null;
            $hariBaru = $in['hari_baru'] ?? null;
            if (! $hariBaru) {
                throw ValidationException::withMessages(['hari_baru' => 'Hari baru wajib diisi untuk perubahan permanen.']);
            }
        }

        $berbeda = $hariBaru !== $hariLama
            || $in['jam_mulai_baru'] !== $jamMulaiLama || $in['jam_selesai_baru'] !== $jamSelesaiLama
            || $guruBaru !== (int) $guruLama
            || mb_strtolower(trim((string) $ruangBaru)) !== mb_strtolower(trim((string) $ruangLama))
            || ($tanggalBaru !== null && $tanggalBaru !== $in['tanggal_perubahan']);
        if (! $berbeda) {
            throw ValidationException::withMessages(['jam_mulai_baru' => 'Jadwal baru sama dengan jadwal lama. Ubah hari, jam, guru, atau ruang.']);
        }

        if ($lengkap) {
            $ganda = PerubahanJadwal::where('jadwal_id', $jadwal->id)->whereIn('status', self::AKTIF)->whereNull('diterapkan_at')
                ->where('jenis', $in['jenis'])
                ->when($in['jenis'] === 'sementara', fn ($q) => $q->where('tanggal_perubahan', $in['tanggal_perubahan']))
                ->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))->exists();
            if ($ganda) {
                throw ValidationException::withMessages(['jadwal_id' => 'Jadwal ini sudah memiliki pengajuan perubahan '.($in['jenis'] === 'sementara' ? 'pada tanggal tersebut' : 'permanen yang aktif').'.']);
            }
        }

        $data = [
            'jadwal_id' => $jadwal->id,
            'kelas_id' => $jadwal->kelas_id,
            'mata_pelajaran_id' => $jadwal->mata_pelajaran_id,
            'jenis' => $in['jenis'],
            'tanggal_perubahan' => $in['tanggal_perubahan'],
            'tanggal_baru' => $tanggalBaru,
            'hari_lama' => $hariLama,
            'jam_mulai_lama' => $jamMulaiLama,
            'jam_selesai_lama' => $jamSelesaiLama,
            'guru_lama_id' => $guruLama,
            'ruang_lama' => $ruangLama,
            'hari_baru' => $hariBaru,
            'jam_mulai_baru' => $in['jam_mulai_baru'],
            'jam_selesai_baru' => $in['jam_selesai_baru'],
            'guru_baru_id' => $guruBaru,
            'ruang_baru' => $ruangBaru,
            'alasan' => $in['alasan'] ?? $existing?->alasan ?? '',
            'catatan' => $in['catatan'] ?? null,
        ];

        return [$data, [
            'jenis' => $in['jenis'],
            'tanggal' => $tanggalBaru,
            'tanggal_asal' => $in['tanggal_perubahan'],
            'hari' => $hariBaru,
            'mulai' => $in['jam_mulai_baru'],
            'selesai' => $in['jam_selesai_baru'],
            'guru' => $guruBaru,
            'kelas' => (int) $jadwal->kelas_id,
            'ruang' => $ruangBaru,
        ], $jadwal];
    }

    private function targetDari(PerubahanJadwal $p): array
    {
        return [
            'jenis' => $p->jenis,
            'tanggal' => $p->tanggal_baru ? substr((string) $p->tanggal_baru, 0, 10) : null,
            'tanggal_asal' => substr((string) $p->tanggal_perubahan, 0, 10),
            'hari' => $p->hari_baru,
            'mulai' => $this->jam($p->jam_mulai_baru),
            'selesai' => $this->jam($p->jam_selesai_baru),
            'guru' => (int) $p->guru_baru_id,
            'kelas' => (int) $p->kelas_id,
            'ruang' => $p->ruang_baru,
        ];
    }

    private function tolakBentrok(array $target, ?int $excludeId, ?int $jadwalId, string $awalan = ''): void
    {
        $konflik = $this->konflik($target, $excludeId, $jadwalId);
        if ($konflik) {
            throw ValidationException::withMessages([
                'konflik' => $awalan.'Bentrok: '.implode('; ', array_map(fn ($k) => "{$k['jenis']} — {$k['pesan']}", $konflik)).'.',
            ]);
        }
    }

    /**
     * Bentrok guru/kelas/ruang untuk slot baru.
     *
     * @return list<array{jenis: string, pesan: string}>
     */
    private function konflik(array $t, ?int $excludeId, ?int $jadwalId): array
    {
        $hasil = [];
        $ruang = mb_strtolower(trim((string) ($t['ruang'] ?? '')));
        $sementara = $t['jenis'] === 'sementara';

        // Jam reguler yang dipindah keluar pada tanggal itu tidak dianggap menempati slotnya.
        $pindah = $sementara
            ? PerubahanJadwal::whereIn('status', self::AKTIF)->where('jenis', 'sementara')->where('tanggal_perubahan', $t['tanggal'])
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))->pluck('jadwal_id')->all()
            : [];

        $base = JadwalPelajaran::with(['kelas:id,nama_kelas,ruang_kelas', 'mataPelajaran:id,nama_mapel', 'guru:id,nama'])
            ->where('hari', $t['hari'])->when($jadwalId, fn ($q) => $q->where('id', '!=', $jadwalId))
            ->whereNotIn('id', $pindah)->get()
            ->filter(fn (JadwalPelajaran $j) => $this->tumpangTindih($t['mulai'], $t['selesai'], $this->jam($j->jam_mulai), $this->jam($j->jam_selesai)));
        foreach ($base as $j) {
            $jam = $this->rentang($j->jam_mulai, $j->jam_selesai);
            if ((int) $j->guru_id === $t['guru']) {
                $hasil[] = ['jenis' => 'Guru', 'pesan' => "{$j->guru?->nama} mengajar {$j->mataPelajaran?->nama_mapel} di {$j->kelas?->nama_kelas} pada {$j->hari} {$jam}"];
            }
            if ((int) $j->kelas_id === $t['kelas']) {
                $hasil[] = ['jenis' => 'Kelas', 'pesan' => "{$j->kelas?->nama_kelas} sudah memiliki {$j->mataPelajaran?->nama_mapel} pada {$j->hari} {$jam}"];
            }
            if ($ruang !== '' && (int) $j->kelas_id !== $t['kelas'] && mb_strtolower(trim((string) $j->kelas?->ruang_kelas)) === $ruang) {
                $hasil[] = ['jenis' => 'Ruang', 'pesan' => "ruang {$t['ruang']} dipakai {$j->kelas?->nama_kelas} pada {$j->hari} {$jam}"];
            }
        }

        $lain = PerubahanJadwal::with(['kelas:id,nama_kelas', 'guruBaru:id,nama'])->whereIn('status', self::AKTIF)
            ->where('hari_baru', $t['hari'])->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))->get()
            ->filter(fn (PerubahanJadwal $p) => $this->tumpangTindih($t['mulai'], $t['selesai'], $this->jam($p->jam_mulai_baru), $this->jam($p->jam_selesai_baru)))
            ->filter(function (PerubahanJadwal $p) use ($t) {
                $tanggalP = $p->tanggal_baru ? substr((string) $p->tanggal_baru, 0, 10) : null;
                $mulaiP = substr((string) $p->tanggal_perubahan, 0, 10);
                if ($t['jenis'] === 'sementara') {
                    return $p->jenis === 'sementara' ? $tanggalP === $t['tanggal'] : $mulaiP <= $t['tanggal'];
                }

                return $p->jenis === 'permanen' || ($tanggalP !== null && $tanggalP >= $t['tanggal_asal']);
            });
        foreach ($lain as $p) {
            $jam = $this->rentang($p->jam_mulai_baru, $p->jam_selesai_baru);
            $ket = "perubahan lain ({$p->kelas?->nama_kelas}, {$p->hari_baru} {$jam})";
            if ((int) $p->guru_baru_id === $t['guru']) {
                $hasil[] = ['jenis' => 'Guru', 'pesan' => "{$p->guruBaru?->nama} sudah dijadwalkan pada {$ket}"];
            }
            if ((int) $p->kelas_id === $t['kelas']) {
                $hasil[] = ['jenis' => 'Kelas', 'pesan' => "rombel sudah punya jadwal pada {$ket}"];
            }
            if ($ruang !== '' && mb_strtolower(trim((string) $p->ruang_baru)) === $ruang) {
                $hasil[] = ['jenis' => 'Ruang', 'pesan' => "ruang {$t['ruang']} sudah dipakai pada {$ket}"];
            }
        }

        if ($sementara) {
            $absen = AbsensiGuru::where('guru_id', $t['guru'])->where('tanggal', $t['tanggal'])->whereIn('status', ['izin', 'sakit', 'alpha'])->value('status');
            if ($absen) {
                $hasil[] = ['jenis' => 'Guru', 'pesan' => 'guru tercatat '.$absen.' pada '.$t['tanggal']];
            }
            $pengganti = GuruPengganti::with('kelas:id,nama_kelas')->where('tanggal', $t['tanggal'])->whereIn('status', ['menunggu_persetujuan', 'disetujui'])
                ->where('guru_pengganti_id', $t['guru'])->get()
                ->filter(fn ($g) => $this->tumpangTindih($t['mulai'], $t['selesai'], $this->jam($g->jam_mulai), $this->jam($g->jam_selesai)));
            foreach ($pengganti as $g) {
                $hasil[] = ['jenis' => 'Guru', 'pesan' => "guru menjadi pengganti di {$g->kelas?->nama_kelas} ".$this->rentang($g->jam_mulai, $g->jam_selesai)];
            }
        }

        return $hasil;
    }

    private function pastikanBisaDiubah(PerubahanJadwal $p): void
    {
        if ($p->status === 'dibatalkan' || $p->diterapkan_at) {
            throw ValidationException::withMessages(['status' => 'Pengajuan yang sudah dibatalkan atau diterapkan tidak dapat diubah.']);
        }
    }

    private function tumpangTindih(string $mulaiA, string $selesaiA, string $mulaiB, string $selesaiB): bool
    {
        return $mulaiA < $selesaiB && $mulaiB < $selesaiA;
    }

    private function jam(mixed $waktu): string
    {
        return substr((string) $waktu, 0, 5);
    }

    private function rentang(mixed $mulai, mixed $selesai): string
    {
        return $this->jam($mulai).'–'.$this->jam($selesai);
    }

    /** @param list<string> $nama */
    private function peringatanAkun(array $nama): ?string
    {
        $nama = array_values(array_unique($nama));

        return $nama ? 'Notifikasi tidak terkirim karena belum punya akun pengguna: '.implode(', ', $nama).'.' : null;
    }

    /**
     * Notifikasi database ke guru lama, guru baru, dan wali kelas rombel.
     *
     * @return list<string> nama yang tidak punya akun
     */
    private function beritahu(PerubahanJadwal $p, string $judul, string $pesan): array
    {
        $ids = array_filter([$p->guru_lama_id, $p->guru_baru_id, $p->kelas?->wali_kelas_id ?? Kelas::whereKey($p->kelas_id)->value('wali_kelas_id')]);
        $tanpaAkun = [];
        foreach (Guru::with('user')->whereIn('id', array_unique($ids))->get() as $guru) {
            if ($guru->user) {
                $guru->user->notify(new PerubahanJadwalNotification($p->id, $judul, $pesan));
            } else {
                $tanpaAkun[] = $guru->nama;
            }
        }

        return $tanpaAkun;
    }

    private function ringkasBaru(PerubahanJadwal $p): string
    {
        $this->muat($p);
        $tanggal = $p->jenis === 'sementara'
            ? Carbon::parse($p->tanggal_baru ?? $p->tanggal_perubahan)->format('d-m-Y')
            : "mulai {$this->tanggalId($p->tanggal_perubahan)}";
        $ruang = $p->ruang_baru ? ", ruang {$p->ruang_baru}" : '';

        return "{$p->hari_baru} {$tanggal}, ".$this->rentang($p->jam_mulai_baru, $p->jam_selesai_baru).", {$p->guruBaru?->nama}{$ruang}";
    }

    private function tanggalId(mixed $t): string
    {
        return Carbon::parse($t)->format('d-m-Y');
    }

    private function present(PerubahanJadwal $p): array
    {
        $p->loadMissing(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruLama:id,nama', 'guruBaru:id,nama', 'pengaju:id,name', 'diputuskanOleh:id,name']);

        return [
            'id' => $p->id,
            'jadwal_id' => $p->jadwal_id,
            'jenis' => $p->jenis,
            'tanggal_perubahan' => substr((string) $p->tanggal_perubahan, 0, 10),
            'tanggal_baru' => $p->tanggal_baru ? substr((string) $p->tanggal_baru, 0, 10) : null,
            'kelas' => $p->kelas?->only(['id', 'nama_kelas']),
            'mata_pelajaran' => $p->mataPelajaran?->only(['id', 'nama_mapel']),
            'guru_lama' => $p->guruLama?->only(['id', 'nama']),
            'guru_baru' => $p->guruBaru?->only(['id', 'nama']),
            'hari_lama' => $p->hari_lama,
            'jam_mulai_lama' => $this->jam($p->jam_mulai_lama),
            'jam_selesai_lama' => $this->jam($p->jam_selesai_lama),
            'hari_baru' => $p->hari_baru,
            'jam_mulai_baru' => $this->jam($p->jam_mulai_baru),
            'jam_selesai_baru' => $this->jam($p->jam_selesai_baru),
            'jadwal_lama' => "{$p->hari_lama}, ".$this->rentang($p->jam_mulai_lama, $p->jam_selesai_lama),
            'jadwal_baru' => "{$p->hari_baru}, ".$this->rentang($p->jam_mulai_baru, $p->jam_selesai_baru),
            'ruang_lama' => $p->ruang_lama,
            'ruang_baru' => $p->ruang_baru,
            'alasan' => $p->alasan,
            'catatan' => $p->catatan,
            'pengaju' => $p->pengaju?->name,
            'status' => $p->status,
            'status_label' => self::STATUS_LABEL[$p->status],
            'catatan_keputusan' => $p->catatan_keputusan,
            'diputuskan_oleh' => $p->diputuskanOleh?->name,
            'tanggal_keputusan' => $p->tanggal_keputusan,
            'diterapkan_at' => $p->diterapkan_at,
            'created_at' => $p->created_at,
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

    private function muat(PerubahanJadwal $p): void
    {
        $p->loadMissing(['kelas:id,nama_kelas,wali_kelas_id', 'mataPelajaran:id,nama_mapel', 'guruLama:id,nama', 'guruBaru:id,nama']);
    }

    private function snapshot(PerubahanJadwal $p): array
    {
        $this->muat($p);

        return [
            'jenis' => $p->jenis,
            'tanggal_perubahan' => substr((string) $p->tanggal_perubahan, 0, 10),
            'tanggal_baru' => $p->tanggal_baru ? substr((string) $p->tanggal_baru, 0, 10) : null,
            'rombel' => $p->kelas?->nama_kelas,
            'mata_pelajaran' => $p->mataPelajaran?->nama_mapel,
            'jadwal_lama' => "{$p->hari_lama}, ".$this->rentang($p->jam_mulai_lama, $p->jam_selesai_lama),
            'jadwal_baru' => "{$p->hari_baru}, ".$this->rentang($p->jam_mulai_baru, $p->jam_selesai_baru),
            'guru_lama' => $p->guruLama?->nama,
            'guru_baru' => $p->guruBaru?->nama,
            'ruang_lama' => $p->ruang_lama,
            'ruang_baru' => $p->ruang_baru,
            'alasan' => $p->alasan,
            'status' => $p->status,
            'catatan' => $p->catatan,
        ];
    }

    private function label(PerubahanJadwal $p): string
    {
        $this->muat($p);

        return "{$p->mataPelajaran?->nama_mapel} — {$p->kelas?->nama_kelas} ({$p->jenis}, ".$this->tanggalId($p->tanggal_perubahan).')';
    }

    private function log(Request $request, PerubahanJadwal $p, string $event, string $deskripsi, array $properties): void
    {
        activity(self::LOG)->performedOn($p)->causedBy($request->user())->event($event)->withProperties($properties)->log($deskripsi);
    }
}

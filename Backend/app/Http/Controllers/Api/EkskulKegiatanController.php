<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EkskulHelpers;
use App\Http\Controllers\Controller;
use App\Models\Ekskul;
use App\Models\EkskulAnggota;
use App\Models\EkskulKegiatan;
use App\Models\EkskulPresensi;
use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Jadwal & kegiatan ekstrakurikuler, cek bentrok, dan presensi. */
class EkskulKegiatanController extends Controller
{
    use EkskulHelpers;

    private const SCHEDULE = ['tanggal', 'jam_mulai', 'jam_selesai', 'tempat'];

    // ------------------------------------------------------------- kegiatan

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'ekskul_id' => ['nullable', 'integer'], 'tahun_ajaran_id' => ['nullable', 'integer'], 'semester' => ['nullable', 'in:ganjil,genap'],
            'jenis' => ['nullable', 'string'], 'status' => ['nullable', 'in:terjadwal,terlaksana,dibatalkan'], 'dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date'],
            'waktu' => ['nullable', 'in:mendatang,lalu'], 'search' => ['nullable', 'string', 'max:100'],
        ]);
        $hariIni = now()->toDateString();

        $q = EkskulKegiatan::query()->join('ekskul', 'ekskul.id', '=', 'ekskul_kegiatan.ekskul_id')->select('ekskul_kegiatan.*')
            ->when(! empty($in['ekskul_id']), fn ($q) => $q->where('ekskul_kegiatan.ekskul_id', $in['ekskul_id']))
            ->when(! empty($in['tahun_ajaran_id']), fn ($q) => $q->where('ekskul.tahun_ajaran_id', $in['tahun_ajaran_id']))
            ->when(! empty($in['semester']), fn ($q) => $q->where('ekskul.semester', $in['semester']))
            ->when(! empty($in['jenis']), fn ($q) => $q->where('ekskul_kegiatan.jenis', $in['jenis']))
            ->when(! empty($in['status']), fn ($q) => $q->where('ekskul_kegiatan.status', $in['status']))
            ->when(! empty($in['dari']), fn ($q) => $q->where('ekskul_kegiatan.tanggal', '>=', $in['dari']))
            ->when(! empty($in['sampai']), fn ($q) => $q->where('ekskul_kegiatan.tanggal', '<=', $in['sampai']))
            ->when(($in['waktu'] ?? null) === 'mendatang', fn ($q) => $q->where('ekskul_kegiatan.tanggal', '>=', $hariIni)->where('ekskul_kegiatan.status', '!=', 'dibatalkan'))
            ->when(($in['waktu'] ?? null) === 'lalu', fn ($q) => $q->where('ekskul_kegiatan.tanggal', '<', $hariIni))
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('ekskul_kegiatan.materi', 'like', '%'.$in['search'].'%')->orWhere('ekskul.nama', 'like', '%'.$in['search'].'%')->orWhere('ekskul_kegiatan.tempat', 'like', '%'.$in['search'].'%')));
        $q = ($in['waktu'] ?? null) === 'lalu' ? $q->orderByDesc('ekskul_kegiatan.tanggal')->orderByDesc('ekskul_kegiatan.jam_mulai') : $q->orderBy('ekskul_kegiatan.tanggal')->orderBy('ekskul_kegiatan.jam_mulai');

        return response()->json($this->presentList($q->limit(600)->get()));
    }

    public function show(EkskulKegiatan $kegiatan): JsonResponse
    {
        $log = Activity::where('log_name', self::LOG_EKSKUL)->where('subject_type', EkskulKegiatan::class)->where('subject_id', $kegiatan->id)
            ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(100)->get()
            ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at]);

        return response()->json($this->presentList(collect([$kegiatan]))[0] + ['riwayat' => $log]);
    }

    public function store(Request $request): JsonResponse
    {
        $d = $this->validasi($request, null);
        $this->tolakBilaBentrok($d, null, (bool) $request->boolean('abaikan_bentrok'));
        $k = EkskulKegiatan::create($this->lengkapi($d) + ['status' => 'terjadwal', 'dibuat_oleh' => $request->user()?->id]);
        $e = Ekskul::findOrFail($k->ekskul_id);
        $this->logEkskul($request, $k, 'created', "Menjadwalkan kegiatan {$e->nama} pada ".Carbon::parse($k->tanggal)->format('d/m/Y').'.', ['sebelum' => null, 'sesudah' => $this->ringkas($k)]);

        return response()->json($this->presentList(collect([$k]))[0], 201);
    }

    public function update(Request $request, EkskulKegiatan $kegiatan): JsonResponse
    {
        $d = $this->validasi($request, $kegiatan);
        $jadwalBerubah = collect(self::SCHEDULE)->contains(fn ($f) => (string) ($f === 'tanggal' ? substr((string) $kegiatan->tanggal, 0, 10) : ($f === 'tempat' ? $kegiatan->tempat : $this->hm($kegiatan->{$f}))) !== (string) ($d[$f] ?? null));
        if ($jadwalBerubah) {
            if ($kegiatan->status === 'dibatalkan') {
                throw ValidationException::withMessages(['kegiatan' => 'Kegiatan yang dibatalkan tidak dapat dijadwal ulang. Buat kegiatan baru.']);
            }
            if (EkskulPresensi::where('kegiatan_id', $kegiatan->id)->exists()) {
                throw ValidationException::withMessages(['tanggal' => 'Jadwal tidak dapat diubah karena presensi sudah tercatat pada kegiatan ini.']);
            }
            if (blank($request->input('alasan_perubahan'))) {
                throw ValidationException::withMessages(['alasan_perubahan' => 'Alasan perubahan jadwal wajib diisi.']);
            }
            $this->tolakBilaBentrok($d, $kegiatan->id, (bool) $request->boolean('abaikan_bentrok'));
        }

        $lama = $this->ringkas($kegiatan);
        $semula = $kegiatan->jadwal_semula ?: ($jadwalBerubah ? ['tanggal' => substr((string) $kegiatan->tanggal, 0, 10), 'jam_mulai' => $this->hm($kegiatan->jam_mulai), 'jam_selesai' => $this->hm($kegiatan->jam_selesai), 'tempat' => $kegiatan->tempat] : null);
        if ($jadwalBerubah && $semula) {
            $semula['alasan'] = $request->input('alasan_perubahan');
        }
        $kegiatan->update($this->lengkapi($d) + ['jadwal_semula' => $semula]);
        $baru = $this->ringkas($kegiatan->fresh());
        $berubah = array_filter($baru, fn ($v, $k) => ($lama[$k] ?? null) != $v, ARRAY_FILTER_USE_BOTH);
        if ($berubah) {
            $this->logEkskul($request, $kegiatan, $jadwalBerubah ? 'jadwal_diubah' : 'updated', ($jadwalBerubah ? 'Mengubah jadwal' : 'Mengubah').' kegiatan.', ['sebelum' => array_intersect_key($lama, $berubah), 'sesudah' => $berubah, 'alasan' => $request->input('alasan_perubahan')]);
        }

        return response()->json($this->presentList(collect([$kegiatan->fresh()]))[0]);
    }

    public function batalkan(Request $request, EkskulKegiatan $kegiatan): JsonResponse
    {
        $in = $request->validate(['alasan' => ['required', 'string', 'min:3', 'max:255']]);
        if (EkskulPresensi::where('kegiatan_id', $kegiatan->id)->exists()) {
            throw ValidationException::withMessages(['kegiatan' => 'Kegiatan yang sudah memiliki presensi tidak dapat dibatalkan.']);
        }
        $lama = $kegiatan->status;
        $kegiatan->update(['status' => 'dibatalkan', 'alasan_batal' => $in['alasan']]);
        $this->logEkskul($request, $kegiatan, 'dibatalkan', 'Membatalkan kegiatan.', ['sebelum' => ['status' => $lama], 'sesudah' => ['status' => 'dibatalkan'], 'alasan' => $in['alasan']]);

        return response()->json($this->presentList(collect([$kegiatan]))[0]);
    }

    public function destroy(Request $request, EkskulKegiatan $kegiatan): JsonResponse
    {
        if (EkskulPresensi::where('kegiatan_id', $kegiatan->id)->exists()) {
            throw ValidationException::withMessages(['kegiatan' => 'Kegiatan yang sudah memiliki presensi tidak dapat dihapus.']);
        }
        $this->logEkskul($request, $kegiatan, 'deleted', 'Menghapus kegiatan tanggal '.Carbon::parse($kegiatan->tanggal)->format('d/m/Y').'.', ['sebelum' => $this->ringkas($kegiatan), 'sesudah' => null]);
        $kegiatan->delete();

        return response()->json(['message' => 'Kegiatan dihapus.']);
    }

    public function cekBentrok(Request $request): JsonResponse
    {
        $d = $request->validate([
            'ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'tanggal' => ['required', 'date'], 'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'], 'tempat' => ['nullable', 'string'], 'pembina_guru_id' => ['nullable', 'integer'], 'kegiatan_id' => ['nullable', 'integer'],
        ]);
        $d = $this->lengkapi($d);

        return response()->json(['bentrok' => $this->bentrok($d, $d['kegiatan_id'] ?? null)]);
    }

    /** Buat jadwal rutin dari hari/jam ekstrakurikuler untuk rentang tanggal (lewati tanggal libur, yang sudah ada, dan yang bentrok). */
    public function rutin(Request $request): JsonResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'dari' => ['required', 'date'], 'sampai' => ['required', 'date', 'after_or_equal:dari'], 'simulasi' => ['nullable', 'boolean']]);
        $e = Ekskul::findOrFail($in['ekskul_id']);
        if (! $e->hari || ! $e->jam_mulai || ! $e->jam_selesai) {
            throw ValidationException::withMessages(['ekskul_id' => 'Isi hari dan jam pada data ekstrakurikuler terlebih dahulu.']);
        }
        if (Carbon::parse($in['dari'])->diffInDays(Carbon::parse($in['sampai'])) > 200) {
            throw ValidationException::withMessages(['sampai' => 'Rentang maksimal 200 hari.']);
        }

        $libur = DB::table('hari_efektif')->whereBetween('tanggal', [$in['dari'], $in['sampai']])->where('jenis', 'libur')->pluck('tanggal')->map(fn ($t) => substr((string) $t, 0, 10))->flip();
        $ada = EkskulKegiatan::where('ekskul_id', $e->id)->whereBetween('tanggal', [$in['dari'], $in['sampai']])->where('status', '!=', 'dibatalkan')->pluck('tanggal')->map(fn ($t) => substr((string) $t, 0, 10))->flip();

        $dibuat = [];
        $dilewati = [];
        for ($t = Carbon::parse($in['dari']); $t->lte(Carbon::parse($in['sampai'])); $t->addDay()) {
            if ($this->namaHari($t->toDateString()) !== $e->hari) {
                continue;
            }
            $tgl = $t->toDateString();
            if ($libur->has($tgl)) {
                $dilewati[] = ['tanggal' => $tgl, 'alasan' => 'Hari libur (menu Hari Efektif)'];

                continue;
            }
            if ($ada->has($tgl)) {
                $dilewati[] = ['tanggal' => $tgl, 'alasan' => 'Sudah ada jadwal'];

                continue;
            }
            $d = $this->lengkapi(['ekskul_id' => $e->id, 'jenis' => 'rutin', 'tanggal' => $tgl, 'jam_mulai' => $this->hm($e->jam_mulai), 'jam_selesai' => $this->hm($e->jam_selesai), 'tempat' => $e->tempat, 'pembina_guru_id' => $e->pembina_guru_id]);
            $keras = collect($this->bentrok($d, null))->where('keras', true);
            if ($keras->isNotEmpty()) {
                $dilewati[] = ['tanggal' => $tgl, 'alasan' => 'Bentrok: '.$keras->pluck('pesan')->implode('; ')];

                continue;
            }
            if (empty($in['simulasi'])) {
                $k = EkskulKegiatan::create($d + ['status' => 'terjadwal', 'dibuat_oleh' => $request->user()?->id]);
                $this->logEkskul($request, $k, 'created', "Jadwal rutin {$e->nama} dibuat untuk ".Carbon::parse($tgl)->format('d/m/Y').'.', ['sebelum' => null, 'sesudah' => ['tanggal' => $tgl, 'jenis' => 'rutin']]);
            }
            $dibuat[] = $tgl;
        }

        return response()->json(['simulasi' => (bool) ($in['simulasi'] ?? false), 'dibuat' => $dibuat, 'dilewati' => $dilewati, 'message' => count($dibuat).' jadwal rutin '.(! empty($in['simulasi']) ? 'akan dibuat' : 'dibuat').(count($dilewati) ? ', '.count($dilewati).' tanggal dilewati.' : '.')]);
    }

    // ------------------------------------------------------------- presensi

    public function presensi(EkskulKegiatan $kegiatan): JsonResponse
    {
        $e = Ekskul::findOrFail($kegiatan->ekskul_id);
        $tgl = substr((string) $kegiatan->tanggal, 0, 10);
        $catatan = EkskulPresensi::where('kegiatan_id', $kegiatan->id)->get()->keyBy('siswa_id');
        $anggota = $this->anggotaPada($e->id, $tgl);
        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat')->whereIn('id', $anggota->pluck('siswa_id')->merge($catatan->keys())->unique())->orderBy('nama')->get();

        $baris = $siswa->map(fn (Siswa $s) => [
            'siswa_id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis, 'kelas' => $s->kelas?->nama_kelas,
            'status' => $catatan[$s->id]->status ?? null, 'keterangan' => $catatan[$s->id]->keterangan ?? null,
        ])->values();

        $alasan = $kegiatan->status === 'dibatalkan' ? 'Kegiatan dibatalkan.' : ($tgl > now()->toDateString() ? 'Presensi baru dapat diisi pada atau setelah tanggal kegiatan.' : null);

        return response()->json([
            'kegiatan' => $this->presentList(collect([$kegiatan]))[0], 'boleh_input' => $alasan === null, 'alasan_terkunci' => $alasan, 'data' => $baris,
            'ringkasan' => ['anggota' => $baris->count(), 'tercatat' => $catatan->count()] + collect(self::STATUS_HADIR)->map(fn ($l, $k) => $catatan->where('status', $k)->count())->all(),
            'status_hadir' => collect(self::STATUS_HADIR)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
        ]);
    }

    /** Simpan presensi satu kegiatan. `semua_hadir` menandai seluruh peserta yang belum diisi sebagai hadir. */
    public function simpanPresensi(Request $request, EkskulKegiatan $kegiatan): JsonResponse
    {
        $in = $request->validate([
            'data' => ['nullable', 'array'], 'data.*.siswa_id' => ['required', 'integer'], 'data.*.status' => ['required', 'in:hadir,izin,sakit,alpha'], 'data.*.keterangan' => ['nullable', 'string', 'max:255'],
            'semua_hadir' => ['nullable', 'boolean'],
        ]);
        $tgl = substr((string) $kegiatan->tanggal, 0, 10);
        if ($kegiatan->status === 'dibatalkan') {
            throw ValidationException::withMessages(['kegiatan' => 'Kegiatan dibatalkan; presensi tidak dapat dicatat.']);
        }
        if ($tgl > now()->toDateString()) {
            throw ValidationException::withMessages(['kegiatan' => 'Presensi baru dapat diisi pada atau setelah tanggal kegiatan.']);
        }
        $e = Ekskul::findOrFail($kegiatan->ekskul_id);
        $anggota = $this->anggotaPada($e->id, $tgl)->pluck('siswa_id')->flip();
        $ada = EkskulPresensi::where('kegiatan_id', $kegiatan->id)->get()->keyBy('siswa_id');

        $item = collect($in['data'] ?? [])->keyBy('siswa_id');
        if (! empty($in['semua_hadir'])) {
            foreach ($anggota->keys() as $sid) {
                if (! $item->has($sid) && ! $ada->has($sid)) {
                    $item->put($sid, ['siswa_id' => $sid, 'status' => 'hadir', 'keterangan' => null]);
                }
            }
        }
        $asing = $item->keys()->reject(fn ($sid) => $anggota->has($sid) || $ada->has($sid));
        if ($asing->isNotEmpty()) {
            throw ValidationException::withMessages(['data' => 'Ada siswa yang bukan anggota ekstrakurikuler ini pada tanggal kegiatan.']);
        }
        if ($item->isEmpty()) {
            throw ValidationException::withMessages(['data' => 'Tidak ada presensi untuk disimpan.']);
        }

        $nama = Siswa::whereIn('id', $item->keys())->pluck('nama', 'id');
        $sebelum = [];
        $sesudah = [];
        foreach ($item as $sid => $r) {
            $lama = $ada[$sid] ?? null;
            if ($lama && $lama->status === $r['status'] && (string) $lama->keterangan === (string) ($r['keterangan'] ?? '')) {
                continue;
            }
            EkskulPresensi::updateOrCreate(['kegiatan_id' => $kegiatan->id, 'siswa_id' => $sid], ['status' => $r['status'], 'keterangan' => $r['keterangan'] ?? null, 'dicatat_oleh' => $request->user()?->id]);
            $sebelum[$nama[$sid] ?? $sid] = $lama?->status;
            $sesudah[$nama[$sid] ?? $sid] = $r['status'];
        }
        if ($sesudah) {
            if ($kegiatan->status === 'terjadwal') {
                $kegiatan->update(['status' => 'terlaksana']);
            }
            $this->logEkskul($request, $kegiatan, 'presensi', 'Presensi '.$e->nama.' '.Carbon::parse($tgl)->format('d/m/Y').' disimpan ('.count($sesudah).' siswa).', ['sebelum' => $sebelum, 'sesudah' => $sesudah]);
        }

        return response()->json(['message' => count($sesudah) ? count($sesudah).' presensi disimpan.' : 'Tidak ada perubahan.', 'diubah' => count($sesudah)]);
    }

    public function rekap(Request $request): JsonResponse
    {
        return response()->json($this->rekapData($request));
    }

    public function exportRekap(Request $request): StreamedResponse
    {
        $data = $this->rekapData($request);
        $wb = new Spreadsheet;
        $ws = $wb->getActiveSheet();
        $ws->setTitle('Rekap Kehadiran');
        $ws->fromArray([['Ekstrakurikuler', 'Semester', 'Siswa', 'NIS', 'Kelas', 'Rombel', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Total Kegiatan', '% Kehadiran']], null, 'A1');
        $ws->getStyle('A1:L1')->getFont()->setBold(true);
        $r = 1;
        foreach ($data['baris'] as $b) {
            $r++;
            $ws->fromArray([[$b['ekskul'], ucfirst($b['semester']).' '.$b['tahun_ajaran'], $b['nama'], $b['nis'], $b['kelas'], $b['rombel'], $b['hadir'], $b['izin'], $b['sakit'], $b['alpha'], $b['total'], $b['persen'] === null ? '-' : $b['persen'].'%']], null, 'A'.$r);
        }
        foreach (range('A', 'L') as $c) {
            $ws->getColumnDimension($c)->setAutoSize(true);
        }

        return response()->streamDownload(fn () => (new Xlsx($wb))->save('php://output'), 'rekap-kehadiran-ekskul.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /** Riwayat presensi: per kegiatan (log perubahan) atau per siswa (seluruh catatan). */
    public function riwayatPresensi(Request $request): JsonResponse
    {
        $in = $request->validate(['kegiatan_id' => ['nullable', 'integer'], 'siswa_id' => ['nullable', 'integer'], 'ekskul_id' => ['nullable', 'integer']]);
        if (! empty($in['kegiatan_id'])) {
            return response()->json(['log' => Activity::where('log_name', self::LOG_EKSKUL)->where('subject_type', EkskulKegiatan::class)->where('subject_id', $in['kegiatan_id'])->where('event', 'presensi')
                ->with('causer:id,name')->orderByDesc('created_at')->limit(100)->get()
                ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at])]);
        }
        if (empty($in['siswa_id'])) {
            throw ValidationException::withMessages(['siswa_id' => 'Pilih siswa atau kegiatan.']);
        }

        $rows = EkskulPresensi::query()->join('ekskul_kegiatan as k', 'k.id', '=', 'ekskul_presensi.kegiatan_id')->join('ekskul as e', 'e.id', '=', 'k.ekskul_id')
            ->where('ekskul_presensi.siswa_id', $in['siswa_id'])->when(! empty($in['ekskul_id']), fn ($q) => $q->where('k.ekskul_id', $in['ekskul_id']))
            ->orderByDesc('k.tanggal')->limit(300)->get(['k.tanggal', 'e.nama as ekskul', 'k.materi', 'ekskul_presensi.status', 'ekskul_presensi.keterangan']);

        return response()->json(['catatan' => $rows->map(fn ($r) => ['tanggal' => substr((string) $r->tanggal, 0, 10), 'ekskul' => $r->ekskul, 'materi' => $r->materi, 'status' => $r->status, 'status_label' => self::STATUS_HADIR[$r->status], 'keterangan' => $r->keterangan])->values()]);
    }

    // ------------------------------------------------------------- pembantu

    /** @return Collection<int, EkskulAnggota> */
    private function anggotaPada(int $ekskulId, string $tanggal): Collection
    {
        return EkskulAnggota::where('ekskul_id', $ekskulId)->where('tanggal_bergabung', '<=', $tanggal)
            ->where(fn ($q) => $q->where('status', 'aktif')->orWhere('tanggal_keluar', '>', $tanggal))->get();
    }

    public function rekapData(Request $request): array
    {
        $in = $request->validate([
            'ekskul_id' => ['nullable', 'integer'], 'tahun_ajaran_id' => ['nullable', 'integer'], 'semester' => ['nullable', 'in:ganjil,genap'], 'kelas_id' => ['nullable', 'integer'],
            'siswa_id' => ['nullable', 'integer'], 'dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date'], 'search' => ['nullable', 'string', 'max:100'],
        ]);

        $rows = EkskulPresensi::query()
            ->join('ekskul_kegiatan as k', 'k.id', '=', 'ekskul_presensi.kegiatan_id')->join('ekskul as e', 'e.id', '=', 'k.ekskul_id')->join('siswa as s', 's.id', '=', 'ekskul_presensi.siswa_id')
            ->where('k.status', '!=', 'dibatalkan')
            ->when(! empty($in['ekskul_id']), fn ($q) => $q->where('k.ekskul_id', $in['ekskul_id']))
            ->when(! empty($in['tahun_ajaran_id']), fn ($q) => $q->where('e.tahun_ajaran_id', $in['tahun_ajaran_id']))
            ->when(! empty($in['semester']), fn ($q) => $q->where('e.semester', $in['semester']))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->where('s.kelas_id', $in['kelas_id']))
            ->when(! empty($in['siswa_id']), fn ($q) => $q->where('s.id', $in['siswa_id']))
            ->when(! empty($in['dari']), fn ($q) => $q->where('k.tanggal', '>=', $in['dari']))
            ->when(! empty($in['sampai']), fn ($q) => $q->where('k.tanggal', '<=', $in['sampai']))
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('s.nama', 'like', '%'.$in['search'].'%')->orWhere('s.nis', 'like', '%'.$in['search'].'%')))
            ->get(['ekskul_presensi.status', 'k.ekskul_id', 'e.nama as ekskul', 'e.semester', 'e.tahun_ajaran_id', 's.id as siswa_id', 's.nama', 's.nis', 's.kelas_id']);

        $kelas = DB::table('kelas')->whereIn('id', $rows->pluck('kelas_id')->filter()->unique())->get(['id', 'nama_kelas', 'tingkat'])->keyBy('id');
        $ta = TahunAjaran::whereIn('id', $rows->pluck('tahun_ajaran_id')->unique())->pluck('nama', 'id');

        $baris = $rows->groupBy(fn ($r) => $r->ekskul_id.'|'.$r->siswa_id)->map(function (Collection $g) use ($kelas, $ta) {
            $f = $g->first();
            $hadir = $g->where('status', 'hadir')->count();

            return [
                'ekskul_id' => $f->ekskul_id, 'ekskul' => $f->ekskul, 'semester' => $f->semester, 'tahun_ajaran' => $ta[$f->tahun_ajaran_id] ?? null,
                'siswa_id' => $f->siswa_id, 'nama' => $f->nama, 'nis' => $f->nis, 'kelas' => $kelas[$f->kelas_id]->tingkat ?? null, 'rombel' => $kelas[$f->kelas_id]->nama_kelas ?? null,
                'hadir' => $hadir, 'izin' => $g->where('status', 'izin')->count(), 'sakit' => $g->where('status', 'sakit')->count(), 'alpha' => $g->where('status', 'alpha')->count(),
                'total' => $g->count(), 'persen' => (int) round($hadir / $g->count() * 100),
            ];
        })->sortBy([['ekskul', 'asc'], ['nama', 'asc']])->values();

        $total = $baris->sum('total');

        return [
            'baris' => $baris->all(),
            'ringkasan' => ['siswa' => $baris->pluck('siswa_id')->unique()->count(), 'catatan' => $total, 'hadir' => $baris->sum('hadir'), 'persen' => $total ? (int) round($baris->sum('hadir') / $total * 100) : null],
        ];
    }

    /** Bentrok: tempat, pembina, jam mengajar pembina (keras) dan peserta ganda (peringatan). */
    private function bentrok(array $d, ?int $kecualiId): array
    {
        $tgl = $d['tanggal'];
        $lain = EkskulKegiatan::query()->join('ekskul', 'ekskul.id', '=', 'ekskul_kegiatan.ekskul_id')->select('ekskul_kegiatan.*', 'ekskul.nama as nama_ekskul')
            ->whereDate('ekskul_kegiatan.tanggal', $tgl)->where('ekskul_kegiatan.status', '!=', 'dibatalkan')
            ->when($kecualiId, fn ($q) => $q->where('ekskul_kegiatan.id', '!=', $kecualiId))
            ->where('ekskul_kegiatan.jam_mulai', '<', $d['jam_selesai'].':00')->where('ekskul_kegiatan.jam_selesai', '>', $d['jam_mulai'].':00')->get();

        $hasil = [];
        $pesertaSaya = EkskulAnggota::where('ekskul_id', $d['ekskul_id'])->where('status', 'aktif')->pluck('siswa_id');
        foreach ($lain as $x) {
            $jam = $this->hm($x->jam_mulai).'–'.$this->hm($x->jam_selesai);
            if (! empty($d['tempat']) && $x->tempat && mb_strtolower(trim($x->tempat)) === mb_strtolower(trim($d['tempat']))) {
                $hasil[] = ['jenis' => 'tempat', 'keras' => true, 'pesan' => "Tempat \"{$x->tempat}\" dipakai {$x->nama_ekskul} ({$jam})."];
            }
            if (! empty($d['pembina_guru_id']) && (int) $x->pembina_guru_id === (int) $d['pembina_guru_id']) {
                $hasil[] = ['jenis' => 'pembina', 'keras' => true, 'pesan' => 'Pembina '.Guru::whereKey($d['pembina_guru_id'])->value('nama')." bertugas di {$x->nama_ekskul} ({$jam})."];
            }
            $ganda = EkskulAnggota::where('ekskul_id', $x->ekskul_id)->where('status', 'aktif')->whereIn('siswa_id', $pesertaSaya)->count();
            if ($ganda > 0 && $x->ekskul_id !== $d['ekskul_id']) {
                $hasil[] = ['jenis' => 'peserta', 'keras' => false, 'pesan' => "{$ganda} siswa juga anggota {$x->nama_ekskul} yang berjalan bersamaan ({$jam})."];
            }
        }
        if (! empty($d['pembina_guru_id'])) {
            $hari = $this->namaHari($tgl);
            $mengajar = JadwalPelajaran::where('guru_id', $d['pembina_guru_id'])->where('hari', $hari)->where('jam_mulai', '<', $d['jam_selesai'].':00')->where('jam_selesai', '>', $d['jam_mulai'].':00')->with('mataPelajaran:id,nama_mapel')->get();
            foreach ($mengajar as $m) {
                $hasil[] = ['jenis' => 'mengajar', 'keras' => true, 'pesan' => 'Pembina mengajar '.($m->mataPelajaran?->nama_mapel ?? 'mata pelajaran').' ('.$this->hm($m->jam_mulai).'–'.$this->hm($m->jam_selesai).') pada hari '.$hari.'.'];
            }
        }

        return array_values(array_map('unserialize', array_unique(array_map('serialize', $hasil))));
    }

    private function tolakBilaBentrok(array $d, ?int $kecualiId, bool $abaikan): void
    {
        $keras = collect($this->bentrok($this->lengkapi($d), $kecualiId))->where('keras', true);
        if ($keras->isNotEmpty() && ! $abaikan) {
            throw ValidationException::withMessages(['bentrok' => 'Bentrok jadwal: '.$keras->pluck('pesan')->implode(' ')]);
        }
    }

    /** Isi bawaan (tempat, pembina, hari) dari data ekstrakurikuler. */
    private function lengkapi(array $d): array
    {
        $e = Ekskul::find($d['ekskul_id']);
        $d['tempat'] = $d['tempat'] ?? $e?->tempat;
        $d['pembina_guru_id'] = $d['pembina_guru_id'] ?? $e?->pembina_guru_id;
        $d['hari'] = $this->namaHari($d['tanggal']);

        return collect($d)->only(['ekskul_id', 'jenis', 'tanggal', 'hari', 'jam_mulai', 'jam_selesai', 'tempat', 'pembina_guru_id', 'pelaksana', 'materi', 'keterangan', 'kegiatan_id'])->all();
    }

    private function validasi(Request $request, ?EkskulKegiatan $ada): array
    {
        $d = $request->validate([
            'ekskul_id' => ['required', 'integer', 'exists:ekskul,id'],
            'jenis' => ['required', 'in:'.implode(',', array_keys(self::JENIS_KEGIATAN))],
            'tanggal' => ['required', 'date'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'tempat' => ['nullable', 'string', 'max:255'],
            'pembina_guru_id' => ['nullable', 'integer', 'exists:guru,id'],
            'pelaksana' => ['nullable', 'string', 'max:255'],
            'materi' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
        ]);
        $e = Ekskul::findOrFail($d['ekskul_id']);
        if ($e->status !== 'aktif' && ! $ada) {
            throw ValidationException::withMessages(['ekskul_id' => "Ekstrakurikuler {$e->nama} sedang nonaktif."]);
        }
        if ($ada && $ada->ekskul_id !== $e->id) {
            throw ValidationException::withMessages(['ekskul_id' => 'Ekstrakurikuler kegiatan tidak dapat diganti.']);
        }

        return collect($d)->map(fn ($v) => is_string($v) && trim($v) === '' ? null : $v)->all();
    }

    private function presentList(Collection $daftar): Collection
    {
        $ekskul = Ekskul::whereIn('id', $daftar->pluck('ekskul_id'))->get()->keyBy('id');
        $guru = Guru::whereIn('id', $daftar->pluck('pembina_guru_id')->filter())->pluck('nama', 'id');
        $presensi = EkskulPresensi::whereIn('kegiatan_id', $daftar->pluck('id'))->selectRaw('kegiatan_id, count(*) as n, sum(case when status = ? then 1 else 0 end) as hadir', ['hadir'])->groupBy('kegiatan_id')->get()->keyBy('kegiatan_id');

        return $daftar->map(function (EkskulKegiatan $k) use ($ekskul, $guru, $presensi) {
            $e = $ekskul[$k->ekskul_id];

            return [
                'id' => $k->id, 'ekskul' => ['id' => $e->id, 'nama' => $e->nama, 'kategori' => $e->kategori], 'jenis' => $k->jenis, 'jenis_label' => self::JENIS_KEGIATAN[$k->jenis],
                'tanggal' => substr((string) $k->tanggal, 0, 10), 'hari' => $k->hari, 'jam_mulai' => $this->hm($k->jam_mulai), 'jam_selesai' => $this->hm($k->jam_selesai),
                'tempat' => $k->tempat, 'pembina_guru_id' => $k->pembina_guru_id, 'pembina' => $guru[$k->pembina_guru_id] ?? null, 'pelaksana' => $k->pelaksana,
                'materi' => $k->materi, 'keterangan' => $k->keterangan, 'status' => $k->status, 'status_label' => self::STATUS_KEGIATAN[$k->status], 'alasan_batal' => $k->alasan_batal,
                'jadwal_semula' => $k->jadwal_semula, 'presensi_tercatat' => (int) ($presensi[$k->id]->n ?? 0), 'presensi_hadir' => (int) ($presensi[$k->id]->hadir ?? 0),
            ];
        })->values();
    }

    /** Kolom yang relevan untuk perbandingan/audit kegiatan. */
    private function ringkas(EkskulKegiatan $k): array
    {
        return [
            'jenis' => $k->jenis, 'tanggal' => substr((string) $k->tanggal, 0, 10), 'jam_mulai' => substr((string) $k->jam_mulai, 0, 5), 'jam_selesai' => substr((string) $k->jam_selesai, 0, 5),
            'tempat' => $k->tempat, 'pembina_guru_id' => $k->pembina_guru_id, 'pelaksana' => $k->pelaksana, 'materi' => $k->materi, 'keterangan' => $k->keterangan, 'status' => $k->status,
        ];
    }
}

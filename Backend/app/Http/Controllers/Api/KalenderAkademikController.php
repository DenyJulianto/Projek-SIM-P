<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\HariEfektif;
use App\Models\HariEfektifPeriode;
use App\Models\KalenderAkademik;
use App\Models\KalenderKegiatan;
use App\Models\KalenderLampiran;
use App\Models\Semester;
use App\Models\TahunAjaran;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Kalender akademik per tahun ajaran.
 *
 * Yang DISIMPAN di sini hanyalah pengaturan kalender (status) dan agenda
 * kegiatan beserta lampirannya. Hari efektif, libur, dan rekap minggu
 * efektif TIDAK disimpan ulang: dibaca langsung dari modul Hari Efektif,
 * dan tanggal awal/akhir tahun ajaran & semester dari data Tahun Ajaran/
 * Semester. Entri dari Hari Efektif tampil di kalender sebagai baca-saja
 * dan diubah lewat menu Hari Efektif; duplikasi kalender pun tidak
 * menyalin data Hari Efektif.
 */
class KalenderAkademikController extends Controller
{
    private const KATEGORI = [
        'pembelajaran' => 'Pembelajaran',
        'ujian' => 'Ujian',
        'penilaian' => 'Penilaian',
        'rapat' => 'Rapat',
        'kegiatan_sekolah' => 'Kegiatan Sekolah',
        'kegiatan_siswa' => 'Kegiatan Siswa',
        'libur' => 'Libur',
        'hari_besar' => 'Hari Besar',
        'administrasi' => 'Administrasi',
        'lainnya' => 'Lainnya',
    ];

    private const STATUS = [
        'direncanakan' => 'Direncanakan',
        'berlangsung' => 'Berlangsung',
        'selesai' => 'Selesai',
        'ditunda' => 'Ditunda',
        'dibatalkan' => 'Dibatalkan',
    ];

    private const STATUS_KALENDER = ['draft' => 'Draft', 'aktif' => 'Aktif', 'arsip' => 'Arsip'];

    /** Jenis Hari Efektif → kategori kalender (untuk tampilan baca-saja). */
    private const PETA_HARI_EFEKTIF = ['libur' => 'libur', 'ujian' => 'ujian', 'kegiatan_sekolah' => 'kegiatan_sekolah', 'lainnya' => 'lainnya'];

    private const HARI_EFEKTIF_LABEL = ['libur' => 'Libur', 'ujian' => 'Ujian', 'kegiatan_sekolah' => 'Kegiatan Sekolah', 'lainnya' => 'Lainnya'];

    private const LOG = 'kalender-akademik';

    public function opsi(): JsonResponse
    {
        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active', 'tanggal_mulai', 'tanggal_selesai']),
            'kategori' => collect(self::KATEGORI)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'status' => collect(self::STATUS)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    /** Pengaturan kalender + periode akademik (dibaca dari Tahun Ajaran, Semester, dan Hari Efektif). */
    public function pengaturan(Request $request): JsonResponse
    {
        $ta = $this->tahunAjaran($request);
        $kalender = KalenderAkademik::firstOrCreate(['tahun_ajaran_id' => $ta->id], ['status' => 'draft']);

        $hariEfektif = app(HariEfektifController::class);
        $semester = collect(['ganjil', 'genap'])->map(function (string $s) use ($ta, $hariEfektif) {
            $sem = Semester::where('tahun_ajaran_id', $ta->id)->where('nama', ucfirst($s))->first();
            $periode = HariEfektifPeriode::where('tahun_ajaran_id', $ta->id)->where('semester', $s)->first();
            $rekap = $periode ? $hariEfektif->rekap($periode)['total'] : null;

            return [
                'semester' => $s,
                'awal' => $sem?->tanggal_mulai?->toDateString(),
                'akhir' => $sem?->tanggal_selesai?->toDateString(),
                'terdaftar' => $sem !== null,
                'hari_efektif' => $periode ? [
                    'hari_sekolah' => (int) $periode->hari_sekolah,
                    'status' => $periode->status,
                    'hari_efektif' => $rekap['hari_efektif'],
                    'libur' => $rekap['libur'],
                    'minggu_efektif' => $rekap['minggu_efektif'],
                    'setara_minggu' => $rekap['setara_minggu'],
                ] : null,
            ];
        })->values();

        return response()->json([
            'kalender' => ['id' => $kalender->id, 'status' => $kalender->status, 'status_label' => self::STATUS_KALENDER[$kalender->status], 'catatan' => $kalender->catatan],
            'tahun_ajaran' => ['id' => $ta->id, 'nama' => $ta->nama, 'awal' => $ta->tanggal_mulai?->toDateString(), 'akhir' => $ta->tanggal_selesai?->toDateString()],
            'semester' => $semester,
        ]);
    }

    public function updatePengaturan(Request $request): JsonResponse
    {
        $ta = $this->tahunAjaran($request);
        $data = $request->validate([
            'status' => ['required', 'in:draft,aktif,arsip'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);
        $kalender = KalenderAkademik::firstOrCreate(['tahun_ajaran_id' => $ta->id], ['status' => 'draft']);
        $lama = $kalender->status;

        $diarsipkan = 0;
        if ($data['status'] === 'aktif') {
            // Hanya satu kalender aktif; yang sebelumnya diarsipkan.
            $diarsipkan = KalenderAkademik::where('status', 'aktif')->where('id', '!=', $kalender->id)->update(['status' => 'arsip']);
        }
        $kalender->update($data + ['diubah_oleh' => $request->user()?->id]);

        if ($lama !== $data['status']) {
            activity(self::LOG)->performedOn($kalender)->causedBy($request->user())->event('status')
                ->withProperties(['tahun_ajaran' => $ta->nama, 'old' => ['status' => $lama], 'new' => ['status' => $data['status']], 'kalender_lain_diarsipkan' => $diarsipkan])
                ->log("Mengubah status kalender {$ta->nama} dari {$lama} menjadi {$data['status']}.");
        }

        return response()->json(['message' => 'Pengaturan kalender disimpan.'.($diarsipkan ? " {$diarsipkan} kalender aktif lain diarsipkan." : '')]);
    }

    /** Entri kalender gabungan: agenda, hari efektif (baca-saja), dan penanda periode. */
    public function entri(Request $request): JsonResponse
    {
        $ta = $this->tahunAjaran($request);
        $data = $this->susunEntri($ta, $request);

        return response()->json([
            'tahun_ajaran' => ['id' => $ta->id, 'nama' => $ta->nama, 'awal' => $ta->tanggal_mulai?->toDateString(), 'akhir' => $ta->tanggal_selesai?->toDateString()],
            'rentang' => $data['rentang'],
            'entri' => $data['entri'],
            'hari_efektif' => $data['hari'],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $ta = $this->tahunAjaran($request);
        $data = $this->validasiKegiatan($request);

        $kegiatan = KalenderKegiatan::create($data + ['tahun_ajaran_id' => $ta->id, 'dibuat_oleh' => $request->user()?->id]);
        $this->log($request, $kegiatan, 'created', "Menambahkan agenda \"{$kegiatan->judul}\" ({$ta->nama}).", ['new' => $this->snapshot($kegiatan)]);

        return response()->json([...$this->present($kegiatan), 'peringatan' => $this->peringatan($ta, $kegiatan)], 201);
    }

    public function show(KalenderKegiatan $kegiatan): JsonResponse
    {
        $riwayat = Activity::where('log_name', self::LOG)->where('subject_type', KalenderKegiatan::class)->where('subject_id', $kegiatan->id)
            ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->get()
            ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at]);

        return response()->json([
            ...$this->present($kegiatan),
            'lampiran' => $kegiatan->lampiran()->orderBy('id')->get()->map(fn (KalenderLampiran $l) => $this->presentLampiran($l)),
            'riwayat' => $riwayat,
        ]);
    }

    public function update(Request $request, KalenderKegiatan $kegiatan): JsonResponse
    {
        $data = $this->validasiKegiatan($request);
        $old = $this->snapshot($kegiatan);

        // Pengingat dikirim ulang bila jadwal atau setelan pengingat berubah.
        if ($data['tanggal_mulai'] !== substr((string) $kegiatan->tanggal_mulai, 0, 10) || ($data['pengingat_hari'] ?? null) !== $kegiatan->pengingat_hari) {
            $data['pengingat_dikirim_at'] = null;
        }
        $kegiatan->update($data);
        $kegiatan->refresh();
        $new = $this->snapshot($kegiatan);

        if ($old !== $new) {
            $this->log($request, $kegiatan, 'updated', "Memperbarui agenda \"{$kegiatan->judul}\".", ['old' => $old, 'new' => $new]);
        }

        return response()->json([...$this->present($kegiatan), 'peringatan' => $this->peringatan(TahunAjaran::findOrFail($kegiatan->tahun_ajaran_id), $kegiatan)]);
    }

    public function destroy(Request $request, KalenderKegiatan $kegiatan): JsonResponse
    {
        $snapshot = $this->snapshot($kegiatan);
        foreach ($kegiatan->lampiran as $l) {
            Storage::disk('local')->delete($l->path);
        }
        $this->log($request, $kegiatan, 'deleted', "Menghapus agenda \"{$kegiatan->judul}\".", ['old' => $snapshot]);
        $kegiatan->delete();

        return response()->json(['message' => 'Agenda dihapus.']);
    }

    public function unggahLampiran(Request $request, KalenderKegiatan $kegiatan): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png', 'max:5120']]);
        if ($kegiatan->lampiran()->count() >= 10) {
            throw ValidationException::withMessages(['file' => 'Maksimal 10 lampiran per agenda.']);
        }

        $file = $request->file('file');
        $lampiran = $kegiatan->lampiran()->create([
            'nama_asli' => $file->getClientOriginalName(),
            'path' => $file->store("kalender/{$kegiatan->id}", 'local'),
            'mime' => $file->getClientMimeType(),
            'ukuran' => $file->getSize(),
            'diunggah_oleh' => $request->user()?->id,
        ]);
        $this->log($request, $kegiatan, 'lampiran', "Menambahkan lampiran \"{$lampiran->nama_asli}\" pada agenda \"{$kegiatan->judul}\".", ['lampiran' => $lampiran->nama_asli]);

        return response()->json($this->presentLampiran($lampiran), 201);
    }

    public function hapusLampiran(Request $request, KalenderLampiran $lampiran): JsonResponse
    {
        $kegiatan = $lampiran->kegiatan;
        Storage::disk('local')->delete($lampiran->path);
        $nama = $lampiran->nama_asli;
        $lampiran->delete();
        $this->log($request, $kegiatan, 'lampiran', "Menghapus lampiran \"{$nama}\" dari agenda \"{$kegiatan->judul}\".", ['lampiran_dihapus' => $nama]);

        return response()->json(['message' => 'Lampiran dihapus.']);
    }

    public function unduhLampiran(KalenderLampiran $lampiran): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($lampiran->path), 404);

        return Storage::disk('local')->download($lampiran->path, $lampiran->nama_asli);
    }

    /**
     * Salin agenda dari tahun ajaran lain dengan menggeser tanggal sebanyak
     * selisih tahun. Hari Efektif TIDAK disalin (kelola di menu Hari Efektif).
     * Tanggal hari besar berbasis kalender lunar perlu disesuaikan manual.
     */
    public function duplikasi(Request $request): JsonResponse
    {
        $in = $request->validate([
            'sumber_tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'tujuan_tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id', 'different:sumber_tahun_ajaran_id'],
            'kategori' => ['nullable', 'array'],
            'kategori.*' => ['in:'.implode(',', array_keys(self::KATEGORI))],
        ]);
        $sumber = TahunAjaran::findOrFail($in['sumber_tahun_ajaran_id']);
        $tujuan = TahunAjaran::findOrFail($in['tujuan_tahun_ajaran_id']);
        $selisihTahun = $tujuan->tanggal_mulai->year - $sumber->tanggal_mulai->year;

        $agenda = KalenderKegiatan::where('tahun_ajaran_id', $sumber->id)
            ->when(! empty($in['kategori']), fn ($q) => $q->whereIn('kategori', $in['kategori']))
            ->orderBy('tanggal_mulai')->get();
        if ($agenda->isEmpty()) {
            throw ValidationException::withMessages(['sumber_tahun_ajaran_id' => 'Tidak ada agenda pada kalender sumber.']);
        }

        $dibuat = 0;
        $sudahAda = 0;
        foreach ($agenda as $k) {
            $mulai = Carbon::parse($k->tanggal_mulai)->addYearsNoOverflow($selisihTahun)->toDateString();
            $selesai = Carbon::parse($k->tanggal_selesai)->addYearsNoOverflow($selisihTahun)->toDateString();
            if (KalenderKegiatan::where(['tahun_ajaran_id' => $tujuan->id, 'judul' => $k->judul, 'kategori' => $k->kategori, 'tanggal_mulai' => $mulai])->exists()) {
                $sudahAda++;

                continue;
            }
            KalenderKegiatan::create([
                'tahun_ajaran_id' => $tujuan->id,
                'judul' => $k->judul,
                'kategori' => $k->kategori,
                'tanggal_mulai' => $mulai,
                'tanggal_selesai' => $selesai,
                'waktu_mulai' => $k->waktu_mulai,
                'waktu_selesai' => $k->waktu_selesai,
                'penanggung_jawab_guru_id' => $k->penanggung_jawab_guru_id,
                'penanggung_jawab' => $k->penanggung_jawab,
                'lokasi' => $k->lokasi,
                'peserta' => $k->peserta,
                'keterangan' => $k->keterangan,
                'status' => 'direncanakan',
                'pengingat_hari' => $k->pengingat_hari,
                'disalin_dari_id' => $k->id,
                'dibuat_oleh' => $request->user()?->id,
            ]);
            $dibuat++;
        }

        $kalender = KalenderAkademik::firstOrCreate(['tahun_ajaran_id' => $tujuan->id], ['status' => 'draft']);
        activity(self::LOG)->performedOn($kalender)->causedBy($request->user())->event('duplicated')
            ->withProperties(['sumber' => $sumber->nama, 'tujuan' => $tujuan->nama, 'selisih_tahun' => $selisihTahun, 'dibuat' => $dibuat, 'sudah_ada' => $sudahAda])
            ->log("Menduplikasi kalender {$sumber->nama} ke {$tujuan->nama}: {$dibuat} agenda disalin, {$sudahAda} sudah ada.");

        return response()->json(['message' => "{$dibuat} agenda disalin sebagai Direncanakan ({$sudahAda} sudah ada). Hari Efektif tidak ikut disalin; atur di menu Hari Efektif.", 'dibuat' => $dibuat, 'sudah_ada' => $sudahAda]);
    }

    /** Agenda yang akan datang dan yang sudah memasuki jendela pengingatnya. */
    public function pengingat(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $akanDatang = KalenderKegiatan::whereIn('status', ['direncanakan', 'berlangsung'])
            ->whereBetween('tanggal_mulai', [$today->toDateString(), $today->copy()->addDays(14)->toDateString()])
            ->orderBy('tanggal_mulai')->limit(20)->get()
            ->map(fn (KalenderKegiatan $k) => [
                ...$this->ringkas($k),
                'hari_lagi' => (int) $today->diffInDays(Carbon::parse($k->tanggal_mulai)),
                'dalam_jendela_pengingat' => $k->pengingat_hari !== null && $today->diffInDays(Carbon::parse($k->tanggal_mulai)) <= $k->pengingat_hari,
            ]);

        return response()->json(['akan_datang' => $akanDatang]);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $ta = $this->tahunAjaran($request);
        $ids = KalenderKegiatan::where('tahun_ajaran_id', $ta->id)->pluck('id');
        $kalenderId = KalenderAkademik::where('tahun_ajaran_id', $ta->id)->value('id');

        return response()->json(
            Activity::where('log_name', self::LOG)->with('causer:id,name')
                ->where(fn ($q) => $q->where(fn ($qq) => $qq->where('subject_type', KalenderKegiatan::class)->whereIn('subject_id', $ids))
                    ->orWhere(fn ($qq) => $qq->where('subject_type', KalenderAkademik::class)->where('subject_id', $kalenderId ?? 0)))
                ->orderByDesc('created_at')->orderByDesc('id')->limit(150)->get()
                ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at])
        );
    }

    public function export(Request $request): StreamedResponse
    {
        $ta = $this->tahunAjaran($request);
        $laporan = $this->laporan($ta, $request);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Agenda');
        $sheet->fromArray([["Kalender Akademik {$ta->nama}"], []], null, 'A1');
        $sheet->fromArray(['Tanggal Mulai', 'Tanggal Selesai', 'Kegiatan', 'Kategori', 'Sumber', 'Status', 'Penanggung Jawab', 'Lokasi', 'Peserta', 'Keterangan'], null, 'A3');
        $sheet->getStyle('A3:J3')->getFont()->setBold(true);
        $sheet->fromArray($laporan['entri']->map(fn ($e) => [
            $e['tanggal_mulai'], $e['tanggal_selesai'], $e['judul'], $e['kategori_label'], $e['sumber_label'], $e['status_label'],
            $e['penanggung_jawab'] ?? '', $e['lokasi'] ?? '', $e['peserta'] ?? '', $e['keterangan'] ?? '',
        ])->all(), null, 'A4');

        $periode = $spreadsheet->createSheet();
        $periode->setTitle('Periode Akademik');
        $periode->fromArray(['Keterangan', 'Awal', 'Akhir', 'Hari Efektif', 'Libur', 'Minggu Efektif', 'Setara Minggu Penuh'], null, 'A1');
        $periode->getStyle('A1:G1')->getFont()->setBold(true);
        $periode->fromArray([['Tahun Ajaran '.$ta->nama, $laporan['tahun_ajaran']['awal'], $laporan['tahun_ajaran']['akhir'], '', '', '', '']], null, 'A2');
        $baris = 3;
        foreach ($laporan['semester'] as $s) {
            $periode->fromArray([['Semester '.ucfirst($s['semester']), $s['awal'], $s['akhir'], $s['hari_efektif']['hari_efektif'] ?? '', $s['hari_efektif']['libur'] ?? '', $s['hari_efektif']['minggu_efektif'] ?? '', $s['hari_efektif']['setara_minggu'] ?? '']], null, "A{$baris}");
            $baris++;
        }
        foreach ($spreadsheet->getAllSheets() as $ws) {
            foreach (range('A', 'J') as $col) {
                $ws->getColumnDimension($col)->setAutoSize(true);
            }
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'kalender-akademik-'.str_replace('/', '-', $ta->nama).'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function pdf(Request $request): Response
    {
        $ta = $this->tahunAjaran($request);
        $laporan = $this->laporan($ta, $request);
        $sekolah = tenant();

        return Pdf::loadView('kalender.pdf', [
            'ta' => $laporan['tahun_ajaran'],
            'semester' => $laporan['semester'],
            'perBulan' => $laporan['entri']->groupBy(fn ($e) => substr($e['tanggal_mulai'], 0, 7))->sortKeys(),
            'sekolah' => $sekolah->nama_sekolah,
        ])->setPaper('a4')->download('kalender-akademik-'.str_replace('/', '-', $ta->nama).'.pdf');
    }

    private function tahunAjaran(Request $request): TahunAjaran
    {
        return TahunAjaran::findOrFail($request->validate(['tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id']])['tahun_ajaran_id']);
    }

    /** Data laporan (export/PDF): seluruh entri tahun ajaran + ringkasan periode. */
    private function laporan(TahunAjaran $ta, Request $request): array
    {
        $entri = $this->susunEntri($ta, $request)['entri'];
        $pengaturan = json_decode($this->pengaturan(Request::create('/', 'GET', ['tahun_ajaran_id' => $ta->id]))->getContent(), true);

        return ['entri' => $entri, 'tahun_ajaran' => $pengaturan['tahun_ajaran'], 'semester' => $pengaturan['semester']];
    }

    /**
     * @return array{rentang: array{dari: string, sampai: string}, entri: Collection<int, array>, hari: array<string, string>}
     */
    private function susunEntri(TahunAjaran $ta, Request $request): array
    {
        $in = $request->validate([
            'dari' => ['nullable', 'date_format:Y-m-d'],
            'sampai' => ['nullable', 'date_format:Y-m-d'],
            'kategori' => ['nullable', 'string', 'max:300'],
            'status' => ['nullable', 'in:'.implode(',', array_keys(self::STATUS))],
            'search' => ['nullable', 'string', 'max:100'],
            'sumber' => ['nullable', 'in:kegiatan,hari_efektif,periode'],
        ]);
        $dari = $in['dari'] ?? $ta->tanggal_mulai->toDateString();
        $sampai = $in['sampai'] ?? $ta->tanggal_selesai->toDateString();
        $kategori = array_values(array_intersect(array_keys(self::KATEGORI) + ['periode'], array_filter(explode(',', (string) ($in['kategori'] ?? '')))));
        $cari = mb_strtolower(trim((string) ($in['search'] ?? '')));
        $sumber = $in['sumber'] ?? null;

        $entri = collect();

        if (! $sumber || $sumber === 'kegiatan') {
            KalenderKegiatan::withCount('lampiran')->with('penanggungJawabGuru:id,nama')->where('tahun_ajaran_id', $ta->id)
                ->where('tanggal_mulai', '<=', $sampai)->where('tanggal_selesai', '>=', $dari)
                ->when($kategori, fn ($q) => $q->whereIn('kategori', $kategori))
                ->when(! empty($in['status']), fn ($q) => $q->where('status', $in['status']))
                ->when($cari !== '', fn ($q) => $q->where(fn ($qq) => $qq->where('judul', 'like', "%{$cari}%")->orWhere('lokasi', 'like', "%{$cari}%")
                    ->orWhere('penanggung_jawab', 'like', "%{$cari}%")->orWhere('peserta', 'like', "%{$cari}%")->orWhere('keterangan', 'like', "%{$cari}%")))
                ->get()->each(fn (KalenderKegiatan $k) => $entri->push($this->ringkas($k)));
        }

        // Hari efektif: dibaca dari modul Hari Efektif (tidak disalin).
        $hariMap = [];
        $periodeIds = HariEfektifPeriode::where('tahun_ajaran_id', $ta->id)->pluck('id');
        $barisHe = HariEfektif::whereIn('periode_id', $periodeIds)->where('tanggal', '>=', $dari)->where('tanggal', '<=', $sampai)->orderBy('tanggal')->get(['tanggal', 'jenis', 'keterangan']);
        foreach ($barisHe as $h) {
            $hariMap[substr((string) $h->tanggal, 0, 10)] = $h->jenis;
        }
        if ((! $sumber || $sumber === 'hari_efektif') && empty($in['status'])) {
            foreach ($this->kelompokHariEfektif($barisHe) as $g) {
                $kat = self::PETA_HARI_EFEKTIF[$g['jenis']];
                $judul = $g['keterangan'] ?: self::HARI_EFEKTIF_LABEL[$g['jenis']];
                if (($kategori && ! in_array($kat, $kategori, true)) || ($cari !== '' && ! str_contains(mb_strtolower($judul), $cari))) {
                    continue;
                }
                $entri->push($this->entriBacaSaja("he:{$g['jenis']}:{$g['mulai']}", 'hari_efektif', $judul, $kat, $g['mulai'], $g['selesai'], 'Hari Efektif: '.self::HARI_EFEKTIF_LABEL[$g['jenis']]));
            }
        }

        // Penanda periode: awal/akhir tahun ajaran dan semester.
        if ((! $sumber || $sumber === 'periode') && empty($in['status']) && (! $kategori || in_array('periode', $kategori, true))) {
            $penanda = [["Awal Tahun Ajaran {$ta->nama}", $ta->tanggal_mulai->toDateString()], ["Akhir Tahun Ajaran {$ta->nama}", $ta->tanggal_selesai->toDateString()]];
            foreach (Semester::where('tahun_ajaran_id', $ta->id)->get() as $s) {
                $penanda[] = ["Awal Semester {$s->nama}", $s->tanggal_mulai->toDateString()];
                $penanda[] = ["Akhir Semester {$s->nama}", $s->tanggal_selesai->toDateString()];
            }
            foreach ($penanda as [$judul, $tgl]) {
                if ($tgl >= $dari && $tgl <= $sampai && ($cari === '' || str_contains(mb_strtolower($judul), $cari))) {
                    $entri->push($this->entriBacaSaja("periode:{$tgl}:{$judul}", 'periode', $judul, 'periode', $tgl, $tgl, 'Penanda Periode'));
                }
            }
        }

        return [
            'rentang' => ['dari' => $dari, 'sampai' => $sampai],
            'entri' => $entri->sortBy([['tanggal_mulai', 'asc'], ['waktu_mulai', 'asc']])->values(),
            'hari' => $hariMap,
        ];
    }

    /**
     * Gabungkan hari efektif bukan-efektif yang berurutan (jenis & keterangan
     * sama; akhir pekan otomatis di antaranya diabaikan) menjadi satu rentang.
     *
     * @return list<array{jenis: string, keterangan: ?string, mulai: string, selesai: string}>
     */
    private function kelompokHariEfektif(Collection $baris): array
    {
        $akhirPekan = $baris->filter(fn ($h) => $h->jenis === 'libur' && $h->keterangan === 'Akhir pekan')->map(fn ($h) => substr((string) $h->tanggal, 0, 10))->flip();
        $relevan = $baris->filter(fn ($h) => $h->jenis !== 'efektif' && ! ($h->jenis === 'libur' && $h->keterangan === 'Akhir pekan'))->values();

        $hasil = [];
        foreach ($relevan as $h) {
            $tgl = substr((string) $h->tanggal, 0, 10);
            $terakhir = count($hasil) - 1;
            if ($terakhir >= 0 && $hasil[$terakhir]['jenis'] === $h->jenis && $hasil[$terakhir]['keterangan'] === $h->keterangan) {
                $cek = Carbon::parse($hasil[$terakhir]['selesai'])->addDay();
                while ($cek->toDateString() < $tgl && $akhirPekan->has($cek->toDateString())) {
                    $cek->addDay();
                }
                if ($cek->toDateString() === $tgl) {
                    $hasil[$terakhir]['selesai'] = $tgl;

                    continue;
                }
            }
            $hasil[] = ['jenis' => $h->jenis, 'keterangan' => $h->keterangan, 'mulai' => $tgl, 'selesai' => $tgl];
        }

        return $hasil;
    }

    private function entriBacaSaja(string $key, string $sumber, string $judul, string $kategori, string $mulai, string $selesai, string $sumberLabel): array
    {
        return [
            'key' => $key,
            'sumber' => $sumber,
            'sumber_label' => $sumberLabel,
            'id' => null,
            'judul' => $judul,
            'kategori' => $kategori,
            'kategori_label' => $kategori === 'periode' ? 'Periode Akademik' : self::KATEGORI[$kategori],
            'tanggal_mulai' => $mulai,
            'tanggal_selesai' => $selesai,
            'waktu_mulai' => null,
            'waktu_selesai' => null,
            'status' => null,
            'status_label' => '-',
            'lokasi' => null,
            'penanggung_jawab' => null,
            'peserta' => null,
            'keterangan' => null,
            'jumlah_lampiran' => 0,
            'baca_saja' => true,
        ];
    }

    private function ringkas(KalenderKegiatan $k): array
    {
        return [
            'key' => "kegiatan:{$k->id}",
            'sumber' => 'kegiatan',
            'sumber_label' => 'Agenda Kalender',
            'id' => $k->id,
            'judul' => $k->judul,
            'kategori' => $k->kategori,
            'kategori_label' => self::KATEGORI[$k->kategori],
            'tanggal_mulai' => substr((string) $k->tanggal_mulai, 0, 10),
            'tanggal_selesai' => substr((string) $k->tanggal_selesai, 0, 10),
            'waktu_mulai' => $k->waktu_mulai ? substr((string) $k->waktu_mulai, 0, 5) : null,
            'waktu_selesai' => $k->waktu_selesai ? substr((string) $k->waktu_selesai, 0, 5) : null,
            'status' => $k->status,
            'status_label' => self::STATUS[$k->status],
            'lokasi' => $k->lokasi,
            'penanggung_jawab' => $k->penanggungJawabGuru?->nama ?? $k->penanggung_jawab,
            'peserta' => $k->peserta,
            'keterangan' => $k->keterangan,
            'jumlah_lampiran' => $k->lampiran_count ?? $k->lampiran()->count(),
            'pengingat_hari' => $k->pengingat_hari,
            'disalin' => $k->disalin_dari_id !== null,
            'baca_saja' => false,
        ];
    }

    private function present(KalenderKegiatan $k): array
    {
        $k->loadMissing('penanggungJawabGuru:id,nama');

        return $this->ringkas($k) + ['tahun_ajaran_id' => $k->tahun_ajaran_id, 'penanggung_jawab_guru_id' => $k->penanggung_jawab_guru_id, 'penanggung_jawab_teks' => $k->penanggung_jawab];
    }

    private function presentLampiran(KalenderLampiran $l): array
    {
        return ['id' => $l->id, 'nama_asli' => $l->nama_asli, 'mime' => $l->mime, 'ukuran' => $l->ukuran, 'created_at' => $l->created_at];
    }

    private function validasiKegiatan(Request $request): array
    {
        $data = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'in:'.implode(',', array_keys(self::KATEGORI))],
            'tanggal_mulai' => ['required', 'date_format:Y-m-d'],
            'tanggal_selesai' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:tanggal_mulai'],
            'waktu_mulai' => ['nullable', 'date_format:H:i'],
            'waktu_selesai' => ['nullable', 'date_format:H:i'],
            'penanggung_jawab_guru_id' => ['nullable', 'integer', 'exists:guru,id'],
            'penanggung_jawab' => ['nullable', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'peserta' => ['nullable', 'string', 'max:2000'],
            'keterangan' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', 'in:'.implode(',', array_keys(self::STATUS))],
            'pengingat_hari' => ['nullable', 'integer', 'min:0', 'max:60'],
        ]);
        $data['tanggal_selesai'] = $data['tanggal_selesai'] ?? $data['tanggal_mulai'];

        if (! empty($data['waktu_mulai']) && ! empty($data['waktu_selesai']) && $data['tanggal_mulai'] === $data['tanggal_selesai'] && $data['waktu_selesai'] <= $data['waktu_mulai']) {
            throw ValidationException::withMessages(['waktu_selesai' => 'Waktu selesai harus setelah waktu mulai.']);
        }
        if (! empty($data['penanggung_jawab_guru_id'])) {
            $data['penanggung_jawab'] = null;
        }

        return $data;
    }

    /**
     * Peringatan (tidak memblokir): di luar rentang tahun ajaran, serta
     * arahan ke Hari Efektif bila agenda meniadakan pembelajaran.
     *
     * @return list<string>
     */
    private function peringatan(TahunAjaran $ta, KalenderKegiatan $k): array
    {
        $mulai = substr((string) $k->tanggal_mulai, 0, 10);
        $selesai = substr((string) $k->tanggal_selesai, 0, 10);
        $peringatan = [];

        if ($mulai < $ta->tanggal_mulai->toDateString() || $selesai > $ta->tanggal_selesai->toDateString()) {
            $peringatan[] = "Agenda berada di luar rentang tahun ajaran {$ta->nama} ({$ta->tanggal_mulai->toDateString()} s.d. {$ta->tanggal_selesai->toDateString()}).";
        }

        if (in_array($k->kategori, ['libur', 'ujian', 'kegiatan_sekolah'], true)) {
            $periodeIds = HariEfektifPeriode::where('tahun_ajaran_id', $ta->id)->pluck('id');
            $masihEfektif = HariEfektif::whereIn('periode_id', $periodeIds)->whereBetween('tanggal', [$mulai, $selesai])->where('jenis', 'efektif')->count();
            if ($masihEfektif > 0) {
                $peringatan[] = "{$masihEfektif} tanggal pada rentang ini masih tercatat sebagai Hari Efektif. Bila agenda ini meniadakan pembelajaran, tandai di menu Hari Efektif agar rekap hari/minggu efektif ikut berubah (agenda ini sendiri tidak mengubah Hari Efektif).";
            }
        }

        return $peringatan;
    }

    private function snapshot(KalenderKegiatan $k): array
    {
        $k->loadMissing('penanggungJawabGuru:id,nama');

        return [
            'judul' => $k->judul,
            'kategori' => self::KATEGORI[$k->kategori],
            'tanggal_mulai' => substr((string) $k->tanggal_mulai, 0, 10),
            'tanggal_selesai' => substr((string) $k->tanggal_selesai, 0, 10),
            'waktu' => $k->waktu_mulai ? substr((string) $k->waktu_mulai, 0, 5).($k->waktu_selesai ? '–'.substr((string) $k->waktu_selesai, 0, 5) : '') : null,
            'penanggung_jawab' => $k->penanggungJawabGuru?->nama ?? $k->penanggung_jawab,
            'lokasi' => $k->lokasi,
            'peserta' => $k->peserta,
            'keterangan' => $k->keterangan,
            'status' => self::STATUS[$k->status],
            'pengingat_hari' => $k->pengingat_hari,
        ];
    }

    private function log(Request $request, Model $subject, string $event, string $deskripsi, array $properties): void
    {
        activity(self::LOG)->performedOn($subject)->causedBy($request->user())->event($event)->withProperties($properties)->log($deskripsi);
    }
}

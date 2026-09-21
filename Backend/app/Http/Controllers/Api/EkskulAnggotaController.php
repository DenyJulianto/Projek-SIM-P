<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EkskulHelpers;
use App\Http\Controllers\Controller;
use App\Models\Ekskul;
use App\Models\EkskulAnggota;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Keanggotaan siswa pada ekstrakurikuler: daftar, pindah, keluarkan, import/export, riwayat. */
class EkskulAnggotaController extends Controller
{
    use EkskulHelpers;

    private const STATUS = ['aktif' => 'Aktif', 'keluar' => 'Keluar', 'pindah' => 'Pindah'];

    public function index(Request $request): JsonResponse
    {
        $in = $this->filter($request);
        $hal = $this->kueri($in)->paginate($in['per_page'] ?? 25);
        $hal->setCollection($this->present($hal->getCollection()));

        return response()->json($hal);
    }

    public function siswaTersedia(Request $request): JsonResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'search' => ['nullable', 'string', 'max:100'], 'kelas_id' => ['nullable', 'integer']]);
        $sudah = EkskulAnggota::where('ekskul_id', $in['ekskul_id'])->where('status', 'aktif')->pluck('siswa_id');

        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat')->where('status', 'aktif')->whereNotIn('id', $sudah)
            ->when(! empty($in['kelas_id']), fn ($q) => $q->where('kelas_id', $in['kelas_id']))
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('nama', 'like', '%'.$in['search'].'%')->orWhere('nis', 'like', '%'.$in['search'].'%')->orWhere('nisn', 'like', '%'.$in['search'].'%')))
            ->orderBy('nama')->limit(40)->get(['id', 'nama', 'nis', 'nisn', 'kelas_id']);

        return response()->json($siswa->map(fn (Siswa $s) => ['id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis, 'nisn' => $s->nisn, 'kelas' => $s->kelas?->nama_kelas, 'tingkat' => $s->kelas?->tingkat]));
    }

    /** Daftarkan satu atau beberapa siswa ke sebuah ekstrakurikuler. */
    public function store(Request $request): JsonResponse
    {
        $in = $request->validate([
            'ekskul_id' => ['required', 'integer', 'exists:ekskul,id'],
            'siswa_ids' => ['required', 'array', 'min:1', 'max:500'], 'siswa_ids.*' => ['integer'],
            'tanggal_bergabung' => ['nullable', 'date'],
        ]);
        $ekskul = Ekskul::findOrFail($in['ekskul_id']);
        $tanggal = $in['tanggal_bergabung'] ?? now()->toDateString();

        $berhasil = 0;
        $gagal = [];
        foreach (Siswa::whereIn('id', $in['siswa_ids'])->get() as $siswa) {
            $err = $this->tambahkan($request, $ekskul, $siswa, $tanggal);
            $err ? $gagal[] = ['siswa' => $siswa->nama, 'alasan' => $err] : $berhasil++;
        }
        if ($berhasil === 0) {
            throw ValidationException::withMessages(['siswa_ids' => $gagal[0]['alasan'] ?? 'Tidak ada siswa yang dapat didaftarkan.']);
        }

        return response()->json(['berhasil' => $berhasil, 'gagal' => $gagal, 'message' => "{$berhasil} siswa didaftarkan ke {$ekskul->nama}".($gagal ? ', '.count($gagal).' gagal.' : '.')], 201);
    }

    public function pindah(Request $request, EkskulAnggota $anggota): JsonResponse
    {
        $in = $request->validate(['ekskul_tujuan_id' => ['required', 'integer', 'exists:ekskul,id'], 'tanggal' => ['nullable', 'date'], 'alasan' => ['nullable', 'string', 'max:255']]);
        if ($anggota->status !== 'aktif') {
            throw ValidationException::withMessages(['anggota' => 'Hanya anggota aktif yang dapat dipindahkan.']);
        }
        if ($in['ekskul_tujuan_id'] === $anggota->ekskul_id) {
            throw ValidationException::withMessages(['ekskul_tujuan_id' => 'Ekstrakurikuler tujuan sama dengan asal.']);
        }
        $tujuan = Ekskul::findOrFail($in['ekskul_tujuan_id']);
        $asal = Ekskul::findOrFail($anggota->ekskul_id);
        $siswa = Siswa::findOrFail($anggota->siswa_id);
        $tanggal = $in['tanggal'] ?? now()->toDateString();

        DB::transaction(function () use ($request, $tujuan, $asal, $siswa, $anggota, $tanggal, $in) {
            $err = $this->tambahkan($request, $tujuan, $siswa, $tanggal, false);
            if ($err) {
                throw ValidationException::withMessages(['ekskul_tujuan_id' => $err]);
            }
            $baru = EkskulAnggota::where('ekskul_id', $tujuan->id)->where('siswa_id', $siswa->id)->where('status', 'aktif')->latest('id')->first();
            $anggota->update(['status' => 'pindah', 'tanggal_keluar' => $tanggal, 'alasan_keluar' => $in['alasan'] ?? "Pindah ke {$tujuan->nama}", 'dipindah_ke_id' => $tujuan->id]);
            $this->logEkskul($request, $anggota, 'pindah', "{$siswa->nama} dipindahkan dari {$asal->nama} ke {$tujuan->nama}.", [
                'sebelum' => ['ekskul' => $asal->nama, 'status' => 'aktif'], 'sesudah' => ['ekskul' => $tujuan->nama, 'status' => 'pindah', 'anggota_baru_id' => $baru?->id],
            ]);
        });

        return response()->json(['message' => "Siswa dipindahkan ke {$tujuan->nama}."]);
    }

    public function keluar(Request $request, EkskulAnggota $anggota): JsonResponse
    {
        $in = $request->validate(['alasan' => ['required', 'string', 'min:3', 'max:255'], 'tanggal' => ['nullable', 'date']]);
        if ($anggota->status !== 'aktif') {
            throw ValidationException::withMessages(['anggota' => 'Anggota ini sudah tidak aktif.']);
        }
        $ekskul = Ekskul::findOrFail($anggota->ekskul_id);
        $siswa = Siswa::findOrFail($anggota->siswa_id);
        $anggota->update(['status' => 'keluar', 'tanggal_keluar' => $in['tanggal'] ?? now()->toDateString(), 'alasan_keluar' => $in['alasan']]);
        $this->logEkskul($request, $anggota, 'keluar', "{$siswa->nama} dikeluarkan dari {$ekskul->nama}.", ['sebelum' => ['status' => 'aktif'], 'sesudah' => ['status' => 'keluar'], 'alasan' => $in['alasan']]);

        return response()->json(['message' => 'Siswa dikeluarkan dari ekstrakurikuler.']);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $in = $request->validate(['siswa_id' => ['nullable', 'integer'], 'ekskul_id' => ['nullable', 'integer']]);
        if (empty($in['siswa_id']) && empty($in['ekskul_id'])) {
            throw ValidationException::withMessages(['siswa_id' => 'Pilih siswa atau ekstrakurikuler.']);
        }
        $anggota = EkskulAnggota::when(! empty($in['siswa_id']), fn ($q) => $q->where('siswa_id', $in['siswa_id']))->when(! empty($in['ekskul_id']), fn ($q) => $q->where('ekskul_id', $in['ekskul_id']))->orderByDesc('id')->limit(300)->get();

        $log = Activity::where('log_name', self::LOG_EKSKUL)->where('subject_type', EkskulAnggota::class)->whereIn('subject_id', $anggota->pluck('id'))
            ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(200)->get()
            ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at]);

        return response()->json(['keanggotaan' => $this->present($anggota), 'log' => $log]);
    }

    // ------------------------------------------------------- import / export

    public function template(): StreamedResponse
    {
        $wb = new Spreadsheet;
        $ws = $wb->getActiveSheet();
        $ws->setTitle('Peserta');
        $ws->fromArray([['NIS', 'Tanggal Bergabung (opsional, YYYY-MM-DD)'], ['20240001', now()->toDateString()]], null, 'A1');
        $ws->getStyle('A1:B1')->getFont()->setBold(true);
        $ws->getColumnDimension('A')->setWidth(18);
        $ws->getColumnDimension('B')->setWidth(40);

        return $this->unduhXlsx($wb, 'template-import-peserta-ekskul.xlsx');
    }

    /** Import peserta dari Excel/CSV (kolom NIS, opsional tanggal bergabung) ke satu ekstrakurikuler. */
    public function import(Request $request): JsonResponse
    {
        $in = $request->validate([
            'ekskul_id' => ['required', 'integer', 'exists:ekskul,id'],
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:2048'],
        ]);
        $ekskul = Ekskul::findOrFail($in['ekskul_id']);

        try {
            $baris = IOFactory::load($request->file('file')->getRealPath())->getActiveSheet()->toArray(null, true, true, false);
        } catch (\Throwable) {
            throw ValidationException::withMessages(['file' => 'Berkas tidak dapat dibaca. Gunakan template Excel yang disediakan.']);
        }
        array_shift($baris);
        $baris = array_values(array_filter($baris, fn ($r) => trim((string) ($r[0] ?? '')) !== ''));
        if (count($baris) === 0) {
            throw ValidationException::withMessages(['file' => 'Berkas tidak berisi baris data.']);
        }
        if (count($baris) > 500) {
            throw ValidationException::withMessages(['file' => 'Maksimal 500 baris per import.']);
        }

        $berhasil = 0;
        $gagal = [];
        foreach ($baris as $i => $r) {
            $nis = trim((string) $r[0]);
            $baris_ke = $i + 2;
            $siswa = Siswa::where('nis', $nis)->first();
            if (! $siswa) {
                $gagal[] = ['baris' => $baris_ke, 'nis' => $nis, 'alasan' => 'NIS tidak ditemukan di Data Siswa.'];

                continue;
            }
            $tanggal = now()->toDateString();
            $mentah = trim((string) ($r[1] ?? ''));
            if ($mentah !== '') {
                try {
                    $tanggal = is_numeric($mentah) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float) $mentah)->format('Y-m-d') : Carbon::parse($mentah)->toDateString();
                } catch (\Throwable) {
                    $gagal[] = ['baris' => $baris_ke, 'nis' => $nis, 'alasan' => "Tanggal bergabung \"{$mentah}\" tidak valid."];

                    continue;
                }
            }
            $err = $this->tambahkan($request, $ekskul, $siswa, $tanggal);
            $err ? $gagal[] = ['baris' => $baris_ke, 'nis' => $nis, 'alasan' => $err] : $berhasil++;
        }

        return response()->json(['berhasil' => $berhasil, 'gagal' => $gagal, 'message' => "{$berhasil} peserta diimpor".($gagal ? ', '.count($gagal).' baris gagal.' : '.')]);
    }

    public function export(Request $request): StreamedResponse
    {
        $in = $this->filter($request);
        $rows = $this->present($this->kueri($in)->get());
        $wb = new Spreadsheet;
        $ws = $wb->getActiveSheet();
        $ws->setTitle('Peserta Ekstrakurikuler');
        $ws->fromArray([['Tahun Ajaran', 'Semester', 'Ekstrakurikuler', 'Nama Siswa', 'NIS', 'NISN', 'Kelas', 'Rombel', 'Tanggal Bergabung', 'Status Keanggotaan', 'Tanggal Keluar', 'Keterangan']], null, 'A1');
        $ws->getStyle('A1:L1')->getFont()->setBold(true);
        $r = 1;
        foreach ($rows as $x) {
            $r++;
            $ws->fromArray([[$x['ekskul']['tahun_ajaran'], ucfirst($x['ekskul']['semester']), $x['ekskul']['nama'], $x['siswa']['nama'], $x['siswa']['nis'], $x['siswa']['nisn'], $x['kelas'], $x['rombel'], $x['tanggal_bergabung'], $x['status_label'], $x['tanggal_keluar'], $x['alasan_keluar']]], null, 'A'.$r);
        }
        foreach (range('A', 'L') as $c) {
            $ws->getColumnDimension($c)->setAutoSize(true);
        }

        return $this->unduhXlsx($wb, 'peserta-ekstrakurikuler.xlsx');
    }

    // ------------------------------------------------------------- pembantu

    /** Menambah keanggotaan; mengembalikan pesan galat bila ditolak (null = berhasil). */
    private function tambahkan(Request $request, Ekskul $ekskul, Siswa $siswa, string $tanggal, bool $catat = true): ?string
    {
        if ($ekskul->status !== 'aktif') {
            return "Ekstrakurikuler {$ekskul->nama} sedang nonaktif.";
        }
        if ($siswa->status !== 'aktif') {
            return 'Siswa berstatus '.$siswa->status.' dan tidak dapat didaftarkan.';
        }
        if (EkskulAnggota::where('ekskul_id', $ekskul->id)->where('siswa_id', $siswa->id)->where('status', 'aktif')->exists()) {
            return "Siswa sudah menjadi anggota aktif {$ekskul->nama}.";
        }
        if ($ekskul->kuota !== null && $this->terisi($ekskul) >= $ekskul->kuota) {
            return "Kuota {$ekskul->nama} ({$ekskul->kuota}) sudah penuh.";
        }
        $a = EkskulAnggota::create(['ekskul_id' => $ekskul->id, 'siswa_id' => $siswa->id, 'tanggal_bergabung' => $tanggal, 'status' => 'aktif', 'dibuat_oleh' => $request->user()?->id]);
        if ($catat) {
            $this->logEkskul($request, $a, 'bergabung', "{$siswa->nama} bergabung ke {$ekskul->nama}.", ['sebelum' => null, 'sesudah' => ['ekskul' => $ekskul->nama, 'status' => 'aktif', 'tanggal_bergabung' => $tanggal]]);
        }

        return null;
    }

    private function filter(Request $request): array
    {
        return $request->validate([
            'tahun_ajaran_id' => ['nullable', 'integer'], 'semester' => ['nullable', 'in:ganjil,genap'], 'ekskul_id' => ['nullable', 'integer'],
            'kelas_id' => ['nullable', 'integer'], 'tingkat' => ['nullable', 'string', 'max:20'], 'status' => ['nullable', 'in:aktif,keluar,pindah'], 'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:200'],
        ]);
    }

    private function kueri(array $in)
    {
        return EkskulAnggota::query()
            ->join('ekskul', 'ekskul.id', '=', 'ekskul_anggota.ekskul_id')->join('siswa', 'siswa.id', '=', 'ekskul_anggota.siswa_id')->leftJoin('kelas', 'kelas.id', '=', 'siswa.kelas_id')
            ->select('ekskul_anggota.*')
            ->when(! empty($in['tahun_ajaran_id']), fn ($q) => $q->where('ekskul.tahun_ajaran_id', $in['tahun_ajaran_id']))
            ->when(! empty($in['semester']), fn ($q) => $q->where('ekskul.semester', $in['semester']))
            ->when(! empty($in['ekskul_id']), fn ($q) => $q->where('ekskul_anggota.ekskul_id', $in['ekskul_id']))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->where('siswa.kelas_id', $in['kelas_id']))
            ->when(! empty($in['tingkat']), fn ($q) => $q->where('kelas.tingkat', $in['tingkat']))
            ->when(! empty($in['status']), fn ($q) => $q->where('ekskul_anggota.status', $in['status']))
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('siswa.nama', 'like', '%'.$in['search'].'%')->orWhere('siswa.nis', 'like', '%'.$in['search'].'%')->orWhere('siswa.nisn', 'like', '%'.$in['search'].'%')))
            ->orderBy('ekskul.nama')->orderBy('siswa.nama');
    }

    private function present($koleksi)
    {
        $ekskul = Ekskul::whereIn('id', $koleksi->pluck('ekskul_id'))->get()->keyBy('id');
        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat')->whereIn('id', $koleksi->pluck('siswa_id'))->get()->keyBy('id');
        $ta = TahunAjaran::whereIn('id', $ekskul->pluck('tahun_ajaran_id'))->pluck('nama', 'id');
        $tujuan = Ekskul::whereIn('id', $koleksi->pluck('dipindah_ke_id')->filter())->pluck('nama', 'id');

        return $koleksi->map(function (EkskulAnggota $a) use ($ekskul, $siswa, $ta, $tujuan) {
            $e = $ekskul[$a->ekskul_id];
            $s = $siswa[$a->siswa_id];

            return [
                'id' => $a->id,
                'siswa' => ['id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis, 'nisn' => $s->nisn],
                'kelas' => $s->kelas?->tingkat, 'rombel' => $s->kelas?->nama_kelas, 'kelas_id' => $s->kelas_id,
                'ekskul' => ['id' => $e->id, 'nama' => $e->nama, 'semester' => $e->semester, 'tahun_ajaran' => $ta[$e->tahun_ajaran_id] ?? null],
                'tanggal_bergabung' => substr((string) $a->tanggal_bergabung, 0, 10), 'status' => $a->status, 'status_label' => self::STATUS[$a->status],
                'tanggal_keluar' => $a->tanggal_keluar ? substr((string) $a->tanggal_keluar, 0, 10) : null,
                'alasan_keluar' => $a->alasan_keluar, 'dipindah_ke' => $a->dipindah_ke_id ? ($tujuan[$a->dipindah_ke_id] ?? null) : null,
            ];
        })->values();
    }

    private function unduhXlsx(Spreadsheet $wb, string $nama): StreamedResponse
    {
        return response()->streamDownload(function () use ($wb) {
            (new Xlsx($wb))->save('php://output');
        }, $nama, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }
}

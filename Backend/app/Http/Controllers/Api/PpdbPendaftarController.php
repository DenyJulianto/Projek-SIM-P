<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PpdbHelpers;
use App\Http\Controllers\Controller;
use App\Models\PpdbDokumen;
use App\Models\PpdbJalur;
use App\Models\PpdbPendaftar;
use App\Models\PpdbPeriode;
use App\Models\PpdbPersyaratan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pendaftaran calon peserta didik (diinput panitia), dokumen, dan verifikasi & validasi.
 */
class PpdbPendaftarController extends Controller
{
    use PpdbHelpers;

    /** Butir yang diperiksa panitia pada verifikasi data. */
    private const CHECKLIST = [
        'identitas' => 'Data identitas',
        'nik' => 'NIK',
        'nisn' => 'NISN',
        'orang_tua' => 'Data orang tua/wali',
        'sekolah_asal' => 'Data sekolah asal',
        'persyaratan_jalur' => 'Persyaratan jalur',
        'dokumen' => 'Dokumen pendukung & keabsahannya',
    ];

    private const KONTAK = ['alamat', 'no_hp', 'email', 'telepon_orang_tua'];

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate([
            'periode_id' => ['required', 'integer', 'exists:ppdb_periode,id'],
            'jalur_id' => ['nullable', 'integer'],
            'status_pendaftaran' => ['nullable', 'in:terdaftar,dibatalkan'],
            'status_verifikasi' => ['nullable', 'in:belum,diverifikasi,perlu_perbaikan,ditolak'],
            'status_seleksi' => ['nullable', 'in:belum,lolos,tidak_lolos'],
            'status_daftar_ulang' => ['nullable', 'in:belum,sudah,dibatalkan'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
            'sekolah_asal' => ['nullable', 'string', 'max:255'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $q = PpdbPendaftar::with('jalur:id,nama')->withCount('dokumen')->where('ppdb_periode_id', $in['periode_id'])
            ->when(! empty($in['jalur_id']), fn ($q) => $q->where('ppdb_jalur_id', $in['jalur_id']))
            ->when(! empty($in['status_pendaftaran']), fn ($q) => $q->where('status_pendaftaran', $in['status_pendaftaran']))
            ->when(! empty($in['status_verifikasi']), fn ($q) => $q->where('status_verifikasi', $in['status_verifikasi']))
            ->when(! empty($in['status_seleksi']), fn ($q) => $q->where('status_seleksi', $in['status_seleksi']))
            ->when(! empty($in['status_daftar_ulang']), fn ($q) => $q->where('status_daftar_ulang', $in['status_daftar_ulang']))
            ->when(! empty($in['jenis_kelamin']), fn ($q) => $q->where('jenis_kelamin', $in['jenis_kelamin']))
            ->when(! empty($in['sekolah_asal']), fn ($q) => $q->where('sekolah_asal', 'like', '%'.$in['sekolah_asal'].'%'))
            ->when(! empty($in['search']), function ($q) use ($in) {
                $k = '%'.$in['search'].'%';
                $q->where(fn ($w) => $w->where('nama_lengkap', 'like', $k)->orWhere('nomor_pendaftaran', 'like', $k)->orWhere('nik', 'like', $k)->orWhere('nisn', 'like', $k));
            })
            ->orderByDesc('id');

        $hal = $q->paginate($in['per_page'] ?? 25);
        $hal->getCollection()->transform(fn (PpdbPendaftar $p) => $this->presentRingkas($p));

        return response()->json($hal);
    }

    /** Opsi filter asal sekolah. */
    public function asalSekolah(Request $request): JsonResponse
    {
        return response()->json(
            PpdbPendaftar::where('ppdb_periode_id', $request->integer('periode_id'))->whereNotNull('sekolah_asal')->distinct()->orderBy('sekolah_asal')->pluck('sekolah_asal')
        );
    }

    public function show(PpdbPendaftar $pendaftar): JsonResponse
    {
        return response()->json($this->presentRinci($pendaftar));
    }

    public function store(Request $request): JsonResponse
    {
        $periode = PpdbPeriode::findOrFail($request->integer('periode_id'));
        if ($periode->status !== 'dibuka') {
            throw ValidationException::withMessages(['periode_id' => 'Pendaftaran belum dibuka atau sudah ditutup (status PPDB: '.self::STATUS_PERIODE[$periode->status].').']);
        }
        $data = $this->validasiForm($request, $periode, null);

        $pendaftar = DB::transaction(function () use ($periode, $data, $request) {
            $urut = PpdbPendaftar::where('ppdb_periode_id', $periode->id)->count() + 1;
            $tahun = substr((string) $periode->tahunAjaran?->nama, 0, 4) ?: date('Y');
            $nomor = sprintf('PPDB%s-%d-%04d', $tahun, $periode->id, $urut);
            while (PpdbPendaftar::where('nomor_pendaftaran', $nomor)->exists()) {
                $nomor = sprintf('PPDB%s-%d-%04d', $tahun, $periode->id, ++$urut);
            }

            return PpdbPendaftar::create($data + ['ppdb_periode_id' => $periode->id, 'nomor_pendaftaran' => $nomor, 'dibuat_oleh' => $request->user()?->id]);
        });

        $this->logPpdb($request, $pendaftar, 'created', "Mendaftarkan {$this->labelPendaftar($pendaftar)}.", ['sebelum' => null, 'sesudah' => ['status_pendaftaran' => 'terdaftar', 'jalur' => $pendaftar->jalur?->nama, 'nomor_pendaftaran' => $pendaftar->nomor_pendaftaran]]);

        return response()->json($this->presentRinci($pendaftar), 201);
    }

    public function update(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $this->pastikanBolehDiubah($pendaftar);
        $data = $this->validasiForm($request, $pendaftar->periode, $pendaftar);

        $berubah = [];
        foreach ($data as $k => $v) {
            if ((string) ($pendaftar->{$k} instanceof Carbon ? $pendaftar->{$k}->toDateString() : $pendaftar->{$k}) !== (string) $v) {
                $berubah[$k] = $v;
            }
        }
        if (! $berubah) {
            return response()->json($this->presentRinci($pendaftar));
        }
        if ($pendaftar->status_seleksi !== 'belum' && array_diff(array_keys($berubah), self::KONTAK)) {
            throw ValidationException::withMessages(['pendaftar' => 'Data pendaftar yang sudah memiliki hasil seleksi hanya dapat diubah pada kontak dan alamat. Batalkan hasil seleksi terlebih dahulu bila perlu koreksi data lain.']);
        }
        $this->pastikanPengumumanBelumTerbit($pendaftar->periode, 'mengubah data pendaftar');

        $sebelum = array_intersect_key($pendaftar->only(array_keys($berubah)), $berubah);
        $sebelum = array_map(fn ($v) => $v instanceof Carbon ? $v->toDateString() : $v, $sebelum);
        $reset = $pendaftar->status_verifikasi !== 'belum' && array_diff(array_keys($berubah), self::KONTAK);
        $pendaftar->fill($data);
        if ($reset) {
            $pendaftar->fill(['status_verifikasi' => 'belum', 'diverifikasi_oleh' => null, 'tanggal_verifikasi' => null]);
        }
        $pendaftar->save();

        $this->logPpdb($request, $pendaftar, 'updated', "Mengubah data {$this->labelPendaftar($pendaftar)}".($reset ? ' — verifikasi diulang.' : '.'), ['sebelum' => $sebelum, 'sesudah' => $berubah]);

        return response()->json($this->presentRinci($pendaftar));
    }

    public function batalkan(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $in = $request->validate(['alasan' => ['required', 'string', 'min:3', 'max:500']]);
        if ($pendaftar->status_penerimaan === 'diterima') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftar yang sudah diterima tidak dapat dibatalkan dari menu ini.']);
        }
        $this->pastikanPengumumanBelumTerbit($pendaftar->periode, 'membatalkan pendaftaran');
        $pendaftar->update(['status_pendaftaran' => 'dibatalkan', 'catatan_verifikasi' => $pendaftar->catatan_verifikasi]);
        $this->logPpdb($request, $pendaftar, 'dibatalkan', "Membatalkan pendaftaran {$this->labelPendaftar($pendaftar)}.", ['alasan' => $in['alasan'], 'sebelum' => ['status_pendaftaran' => 'terdaftar'], 'sesudah' => ['status_pendaftaran' => 'dibatalkan']]);

        return response()->json($this->presentRinci($pendaftar));
    }

    public function pulihkan(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        if ($pendaftar->status_pendaftaran !== 'dibatalkan') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftaran ini tidak dalam keadaan dibatalkan.']);
        }
        $this->pastikanPengumumanBelumTerbit($pendaftar->periode, 'memulihkan pendaftaran');
        $pendaftar->update(['status_pendaftaran' => 'terdaftar']);
        $this->logPpdb($request, $pendaftar, 'dipulihkan', "Memulihkan pendaftaran {$this->labelPendaftar($pendaftar)}.", ['sebelum' => ['status_pendaftaran' => 'dibatalkan'], 'sesudah' => ['status_pendaftaran' => 'terdaftar']]);

        return response()->json($this->presentRinci($pendaftar));
    }

    // ---------------------------------------------------------------- dokumen

    public function unggahDokumen(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $this->pastikanBolehDiubah($pendaftar);
        $in = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:3072'],
            'ppdb_persyaratan_id' => ['nullable', 'integer'],
            'nama' => ['nullable', 'string', 'max:255'],
        ]);
        $persyaratan = null;
        if (! empty($in['ppdb_persyaratan_id'])) {
            $persyaratan = $this->persyaratanBerlaku($pendaftar)->firstWhere('id', (int) $in['ppdb_persyaratan_id']);
            if (! $persyaratan) {
                throw ValidationException::withMessages(['ppdb_persyaratan_id' => 'Persyaratan tidak berlaku untuk jalur pendaftar ini.']);
            }
        }
        if ($pendaftar->dokumen()->count() >= 15 && ! $persyaratan) {
            throw ValidationException::withMessages(['file' => 'Maksimal 15 dokumen per pendaftar.']);
        }

        $file = $request->file('file');
        $nama = $in['nama'] ?? $persyaratan?->nama ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $lama = $persyaratan ? $pendaftar->dokumen()->where('ppdb_persyaratan_id', $persyaratan->id)->first() : null;
        if ($lama) {
            Storage::disk('local')->delete($lama->path);
            $lama->delete();
        }
        $dok = $pendaftar->dokumen()->create([
            'ppdb_persyaratan_id' => $persyaratan?->id,
            'nama' => $nama,
            'nama_asli' => $file->getClientOriginalName(),
            'path' => $file->store("ppdb/{$pendaftar->id}", 'local'),
            'mime' => $file->getMimeType() ?: $file->getClientMimeType(),
            'ukuran' => $file->getSize(),
            'diunggah_oleh' => $request->user()?->id,
        ]);

        $reset = $pendaftar->status_verifikasi === 'diverifikasi' && $pendaftar->status_seleksi === 'belum';
        if ($reset) {
            $pendaftar->update(['status_verifikasi' => 'belum', 'diverifikasi_oleh' => null, 'tanggal_verifikasi' => null]);
        }
        $this->logPpdb($request, $pendaftar, 'dokumen', ($lama ? 'Mengganti' : 'Mengunggah')." dokumen \"{$nama}\" untuk {$this->labelPendaftar($pendaftar)}".($reset ? ' — verifikasi diulang.' : '.'), ['dokumen' => $nama, 'sebelum' => ['dokumen' => $lama?->nama_asli], 'sesudah' => ['dokumen' => $dok->nama_asli]]);

        return response()->json($this->presentRinci($pendaftar), 201);
    }

    public function hapusDokumen(Request $request, PpdbDokumen $dokumen): JsonResponse
    {
        $pendaftar = $dokumen->pendaftar;
        $this->pastikanBolehDiubah($pendaftar);
        Storage::disk('local')->delete($dokumen->path);
        $nama = $dokumen->nama;
        $dokumen->delete();
        $reset = $pendaftar->status_verifikasi === 'diverifikasi' && $pendaftar->status_seleksi === 'belum';
        if ($reset) {
            $pendaftar->update(['status_verifikasi' => 'belum', 'diverifikasi_oleh' => null, 'tanggal_verifikasi' => null]);
        }
        $this->logPpdb($request, $pendaftar, 'dokumen', "Menghapus dokumen \"{$nama}\" dari {$this->labelPendaftar($pendaftar)}".($reset ? ' — verifikasi diulang.' : '.'), ['dokumen_dihapus' => $nama, 'sebelum' => ['dokumen' => $nama], 'sesudah' => ['dokumen' => null]]);

        return response()->json($this->presentRinci($pendaftar));
    }

    /** Berkas dilayani lewat rute terautentikasi; ?unduh=1 memaksa unduhan, selain itu tampil di browser (preview). */
    public function berkasDokumen(Request $request, PpdbDokumen $dokumen): Response
    {
        abort_unless(Storage::disk('local')->exists($dokumen->path), 404, 'Berkas tidak ditemukan.');
        $ext = pathinfo($dokumen->path, PATHINFO_EXTENSION);
        $nama = str_replace('"', '', $dokumen->nama_asli ?: $dokumen->nama.'.'.$ext);

        return Storage::disk('local')->response($dokumen->path, $nama, ['Content-Type' => $dokumen->mime], $request->boolean('unduh') ? 'attachment' : 'inline');
    }

    public function periksaDokumen(Request $request, PpdbDokumen $dokumen): JsonResponse
    {
        $in = $request->validate([
            'status' => ['required', 'in:menunggu,sah,tidak_sah'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ]);
        if ($in['status'] === 'tidak_sah' && blank($in['catatan'] ?? null)) {
            throw ValidationException::withMessages(['catatan' => 'Alasan dokumen tidak sah wajib diisi.']);
        }
        $pendaftar = $dokumen->pendaftar;
        $this->pastikanBolehDiubah($pendaftar);
        $this->pastikanPengumumanBelumTerbit($pendaftar->periode, 'memeriksa dokumen');

        $lama = $dokumen->status;
        $catatanLama = $dokumen->catatan;
        $dokumen->update([
            'status' => $in['status'], 'catatan' => $in['catatan'] ?? null,
            'diperiksa_oleh' => $in['status'] === 'menunggu' ? null : $request->user()?->id,
            'tanggal_periksa' => $in['status'] === 'menunggu' ? null : now(),
        ]);
        $this->logPpdb($request, $pendaftar, 'dokumen', "Dokumen \"{$dokumen->nama}\" {$this->labelPendaftar($pendaftar)}: {$lama} → {$in['status']}.", ['dokumen' => $dokumen->nama, 'sebelum' => ['status' => $lama, 'catatan' => $catatanLama], 'sesudah' => ['status' => $in['status'], 'catatan' => $in['catatan'] ?? null]]);

        return response()->json($this->presentRinci($pendaftar));
    }

    // -------------------------------------------------------------- verifikasi

    public function verifikasi(Request $request, PpdbPendaftar $pendaftar): JsonResponse
    {
        $in = $request->validate([
            'keputusan' => ['required', 'in:setujui,tolak,perbaikan'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'checklist' => ['nullable', 'array'],
            'checklist.*' => ['boolean'],
        ]);
        $this->pastikanBolehDiubah($pendaftar);
        $this->pastikanPengumumanBelumTerbit($pendaftar->periode, 'mengubah hasil verifikasi');
        if ($pendaftar->status_seleksi !== 'belum') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftar ini sudah memiliki hasil seleksi. Batalkan hasil seleksi sebelum memverifikasi ulang.']);
        }
        $keputusan = $in['keputusan'];
        $catatan = trim((string) ($in['catatan'] ?? ''));
        if ($keputusan !== 'setujui' && mb_strlen($catatan) < 5) {
            throw ValidationException::withMessages(['catatan' => 'Catatan verifikasi wajib diisi (min. 5 karakter) agar jelas alasan penolakan atau perbaikan yang diminta.']);
        }

        $checklist = collect(self::CHECKLIST)->map(fn ($l, $k) => (bool) ($in['checklist'][$k] ?? false))->all();
        if ($keputusan === 'setujui') {
            $wajib = array_keys(self::CHECKLIST);
            if (blank($pendaftar->nisn)) {
                $wajib = array_values(array_diff($wajib, ['nisn']));
            }
            $belum = array_filter($wajib, fn ($k) => ! $checklist[$k]);
            $temuan = collect($belum)->map(fn ($k) => 'Butir "'.self::CHECKLIST[$k].'" belum dicentang')->all();

            $tanpaDokumen = $this->persyaratanBerlaku($pendaftar)->where('wajib', true)->reject(
                fn ($r) => $pendaftar->dokumen->firstWhere('ppdb_persyaratan_id', $r->id)?->status === 'sah'
            );
            foreach ($tanpaDokumen as $r) {
                $ada = $pendaftar->dokumen->firstWhere('ppdb_persyaratan_id', $r->id);
                $temuan[] = "Dokumen \"{$r->nama}\" ".($ada ? 'belum dinyatakan sah' : 'belum diunggah');
            }
            if ($temuan) {
                throw ValidationException::withMessages(['keputusan' => 'Data belum dapat disetujui: '.implode('; ', $temuan).'.']);
            }
        }

        $status = ['setujui' => 'diverifikasi', 'tolak' => 'ditolak', 'perbaikan' => 'perlu_perbaikan'][$keputusan];
        $sebelumV = ['status_verifikasi' => $pendaftar->status_verifikasi, 'catatan_verifikasi' => $pendaftar->catatan_verifikasi];
        $pendaftar->update([
            'status_verifikasi' => $status, 'hasil_verifikasi' => $checklist, 'catatan_verifikasi' => $catatan ?: null,
            'diverifikasi_oleh' => $request->user()?->id, 'tanggal_verifikasi' => now(),
        ]);
        $this->logPpdb($request, $pendaftar, 'verifikasi', "Verifikasi {$this->labelPendaftar($pendaftar)}: ".self::LABEL_VERIFIKASI[$status].'.', ['keputusan' => $keputusan, 'catatan' => $catatan, 'checklist' => $checklist, 'sebelum' => $sebelumV, 'sesudah' => ['status_verifikasi' => $status, 'catatan_verifikasi' => $catatan ?: null]]);

        return response()->json($this->presentRinci($pendaftar));
    }

    // ------------------------------------------------------------------ bukti

    public function bukti(PpdbPendaftar $pendaftar): Response
    {
        $periode = $pendaftar->periode->load('tahunAjaran:id,nama');
        $hari = fn ($d) => $d ? Carbon::parse($d)->locale('id')->translatedFormat('d F Y') : '-';

        return Pdf::loadView('ppdb.bukti', [
            'sekolah' => tenant()->nama_sekolah ?: 'Sekolah',
            'p' => $pendaftar->load('jalur:id,nama'),
            'periode' => $periode,
            'persyaratan' => $this->persyaratanBerlaku($pendaftar)->map(fn ($r) => [
                'nama' => $r->nama, 'wajib' => $r->wajib,
                'status' => ['menunggu' => 'Menunggu pemeriksaan', 'sah' => 'Sah', 'tidak_sah' => 'Tidak sah'][$pendaftar->dokumen->firstWhere('ppdb_persyaratan_id', $r->id)?->status ?? ''] ?? 'Belum diunggah',
            ]),
            'tglDaftar' => $hari($pendaftar->created_at),
            'jadwal' => ['Seleksi' => $hari($periode->jadwal_seleksi), 'Pengumuman' => $hari($periode->jadwal_pengumuman), 'Daftar ulang' => $hari($periode->daftar_ulang_mulai).' s.d. '.$hari($periode->daftar_ulang_selesai)],
            'tglLahir' => $pendaftar->tanggal_lahir ? Carbon::parse($pendaftar->tanggal_lahir)->locale('id')->translatedFormat('d F Y') : '-',
        ])->setPaper('a5', 'portrait')->download('bukti-pendaftaran-'.$pendaftar->nomor_pendaftaran.'.pdf');
    }

    // ------------------------------------------------------------- pembantu

    /** Kunci yang tidak boleh diubah lagi setelah calon siswa menjadi siswa resmi. */
    private function pastikanBolehDiubah(PpdbPendaftar $p): void
    {
        if ($p->status_penerimaan === 'diterima') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftar sudah diterima dan datanya dikunci.']);
        }
        if ($p->status_pendaftaran === 'dibatalkan') {
            throw ValidationException::withMessages(['pendaftar' => 'Pendaftaran ini dibatalkan. Pulihkan terlebih dahulu untuk mengubahnya.']);
        }
    }

    /** @return \Illuminate\Support\Collection<int, PpdbPersyaratan> */
    private function persyaratanBerlaku(PpdbPendaftar $p, string $tahap = 'pendaftaran')
    {
        return PpdbPersyaratan::where('ppdb_periode_id', $p->ppdb_periode_id)->where('tahap', $tahap)
            ->where(fn ($q) => $q->whereNull('ppdb_jalur_id')->orWhere('ppdb_jalur_id', $p->ppdb_jalur_id))->orderBy('urutan')->orderBy('id')->get();
    }

    private function validasiForm(Request $request, PpdbPeriode $periode, ?PpdbPendaftar $ada): array
    {
        $d = $request->validate([
            'ppdb_jalur_id' => ['required', 'integer'],
            'nik' => ['required', 'digits:16'],
            'nisn' => ['nullable', 'digits:10'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'nama_panggilan' => ['nullable', 'string', 'max:100'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string', 'max:100'],
            'tanggal_lahir' => ['nullable', 'date', 'before:today'],
            'agama' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string', 'max:1000'],
            'no_hp' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'nama_ayah' => ['nullable', 'string', 'max:255'],
            'nama_ibu' => ['nullable', 'string', 'max:255'],
            'nama_wali' => ['nullable', 'string', 'max:255'],
            'nik_orang_tua' => ['nullable', 'digits:16'],
            'pekerjaan_orang_tua' => ['nullable', 'string', 'max:255'],
            'penghasilan_orang_tua' => ['nullable', 'string', 'max:100'],
            'telepon_orang_tua' => ['nullable', 'string', 'max:20'],
            'sekolah_asal' => ['nullable', 'string', 'max:255'],
            'npsn_sekolah_asal' => ['nullable', 'string', 'max:12'],
            'tahun_lulus' => ['nullable', 'integer', 'min:1990', 'max:2100'],
            'nomor_ijazah' => ['nullable', 'string', 'max:60'],
            'pilihan_program' => ['nullable', 'string', 'max:255'],
        ]);

        $jalur = PpdbJalur::where('ppdb_periode_id', $periode->id)->find($d['ppdb_jalur_id']);
        if (! $jalur || (! $jalur->aktif && $jalur->id !== $ada?->ppdb_jalur_id)) {
            throw ValidationException::withMessages(['ppdb_jalur_id' => 'Jalur tidak valid atau tidak aktif pada PPDB ini.']);
        }
        if ($ada && $ada->ppdb_jalur_id !== $jalur->id && $ada->status_seleksi !== 'belum') {
            throw ValidationException::withMessages(['ppdb_jalur_id' => 'Jalur tidak dapat diubah setelah ada hasil seleksi.']);
        }

        foreach (['nik' => 'NIK', 'nisn' => 'NISN'] as $kolom => $label) {
            if (! empty($d[$kolom]) && PpdbPendaftar::where('ppdb_periode_id', $periode->id)->where('status_pendaftaran', 'terdaftar')
                ->where($kolom, $d[$kolom])->when($ada, fn ($q) => $q->where('id', '!=', $ada->id))->exists()) {
                throw ValidationException::withMessages([$kolom => "{$label} ini sudah terdaftar pada PPDB yang sama."]);
            }
        }

        return collect($d)->map(fn ($v) => is_string($v) ? (trim($v) === '' ? null : trim($v)) : $v)->all();
    }

    private function presentRingkas(PpdbPendaftar $p): array
    {
        return [
            'id' => $p->id, 'nomor_pendaftaran' => $p->nomor_pendaftaran, 'nama_lengkap' => $p->nama_lengkap, 'nik' => $p->nik, 'nisn' => $p->nisn,
            'jenis_kelamin' => $p->jenis_kelamin, 'sekolah_asal' => $p->sekolah_asal, 'ppdb_jalur_id' => $p->ppdb_jalur_id, 'jalur' => $p->jalur?->nama,
            'status_pendaftaran' => $p->status_pendaftaran,
            'status_verifikasi' => $p->status_verifikasi, 'status_verifikasi_label' => self::LABEL_VERIFIKASI[$p->status_verifikasi],
            'status_seleksi' => $p->status_seleksi, 'status_seleksi_label' => self::LABEL_SELEKSI[$p->status_seleksi],
            'status_daftar_ulang' => $p->status_daftar_ulang, 'status_daftar_ulang_label' => self::LABEL_DAFTAR_ULANG[$p->status_daftar_ulang],
            'status_penerimaan' => $p->status_penerimaan, 'skor' => $p->skor, 'dokumen_count' => $p->dokumen_count ?? null, 'created_at' => $p->created_at,
        ];
    }

    private function presentRinci(PpdbPendaftar $p): array
    {
        $p->refresh()->load(['jalur:id,nama', 'dokumen', 'periode']);
        $persyaratan = $this->persyaratanBerlaku($p)->map(function (PpdbPersyaratan $r) use ($p) {
            $d = $p->dokumen->firstWhere('ppdb_persyaratan_id', $r->id);

            return ['id' => $r->id, 'nama' => $r->nama, 'wajib' => $r->wajib, 'keterangan' => $r->keterangan, 'dokumen_id' => $d?->id, 'dokumen_status' => $d?->status];
        })->values();

        $riwayat = Activity::where('log_name', self::LOG_PPDB)->where('subject_type', PpdbPendaftar::class)->where('subject_id', $p->id)
            ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(200)->get()
            ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at]);

        $hari = fn ($d) => $d ? substr((string) $d, 0, 10) : null;

        return $this->presentRingkas($p) + collect($p->only(PpdbPendaftar::FORM))->except(['nik', 'nisn', 'nama_lengkap', 'jenis_kelamin', 'ppdb_jalur_id'])->all() + [
            'ppdb_periode_id' => $p->ppdb_periode_id,
            'tanggal_lahir' => $hari($p->tanggal_lahir),
            'catatan_verifikasi' => $p->catatan_verifikasi, 'hasil_verifikasi' => $p->hasil_verifikasi,
            'checklist_definisi' => collect(self::CHECKLIST)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'diverifikasi_oleh' => $p->diverifikasi_oleh ? DB::table('users')->where('id', $p->diverifikasi_oleh)->value('name') : null,
            'tanggal_verifikasi' => $p->tanggal_verifikasi,
            'nilai_seleksi' => $p->nilai_seleksi, 'catatan_seleksi' => $p->catatan_seleksi,
            'tanggal_daftar_ulang' => $p->tanggal_daftar_ulang, 'nis_terbit' => $p->nis_terbit, 'siswa_id' => $p->siswa_id,
            'dokumen' => $p->dokumen->map(fn (PpdbDokumen $d) => [
                'id' => $d->id, 'nama' => $d->nama, 'nama_asli' => $d->nama_asli, 'mime' => $d->mime, 'ukuran' => $d->ukuran, 'ppdb_persyaratan_id' => $d->ppdb_persyaratan_id,
                'status' => $d->status, 'catatan' => $d->catatan, 'tanggal_periksa' => $d->tanggal_periksa, 'created_at' => $d->created_at,
            ])->values(),
            'persyaratan' => $persyaratan,
            'riwayat' => $riwayat,
        ];
    }
}

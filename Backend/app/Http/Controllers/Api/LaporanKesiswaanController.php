<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\LaporanKesiswaanBuilder;
use App\Http\Controllers\Api\Concerns\LaporanKesiswaanPengaturan;
use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Kelas;
use App\Models\LaporanKesiswaanArsip;
use App\Models\MutasiSiswa;
use App\Models\PpdbJalur;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Laporan Kesiswaan. Tidak menyimpan data kesiswaan sendiri: semua dibaca dari Data Siswa, PPDB, Kelas & Rombel,
 * Kehadiran, Pelanggaran, Prestasi, Ekstrakurikuler, dan Catatan Siswa. Yang disimpan hanya register mutasi,
 * pengaturan tampilan, dan arsip (snapshot) laporan yang pernah dibuat.
 */
class LaporanKesiswaanController extends Controller
{
    use LaporanKesiswaanBuilder;
    use LaporanKesiswaanPengaturan;

    public const JENIS = [
        'siswa' => 'Laporan Data Siswa', 'ppdb' => 'Laporan PPDB', 'kelas' => 'Laporan Kelas & Rombel', 'mutasi' => 'Laporan Mutasi Siswa',
        'kehadiran' => 'Laporan Kehadiran Siswa', 'perkembangan' => 'Laporan Perkembangan Siswa',
    ];

    // ---------------------------------------------------------------- opsi

    public function opsi(): JsonResponse
    {
        $semesterAktif = Semester::where('is_active', true)->value('nama');

        return response()->json([
            'jenis' => collect(self::JENIS)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'semester_aktif' => $semesterAktif ? strtolower($semesterAktif) : null,
            'jenjang' => Kelas::whereNotNull('jenjang')->distinct()->orderBy('jenjang')->pluck('jenjang')->values(),
            'tingkat' => Kelas::whereNotNull('tingkat')->distinct()->orderBy('tingkat')->pluck('tingkat')->values(),
            'kelas' => Kelas::orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tingkat', 'jenjang', 'tahun_ajaran', 'tahun_ajaran_id']),
            'jalur' => PpdbJalur::join('ppdb_periode', 'ppdb_periode.id', '=', 'ppdb_jalur.ppdb_periode_id')->orderBy('ppdb_jalur.id')->get(['ppdb_jalur.id', 'ppdb_jalur.nama', 'ppdb_periode.tahun_ajaran_id']),
            'status_siswa' => collect(self::STATUS_SISWA)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'kolom' => collect(self::KOLOM)->map(fn ($k) => array_map(fn ($x) => ['key' => $x[0], 'label' => $x[1]], $k)),
            'jenis_mutasi' => collect(self::JENIS_MUTASI)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values(),
            'boleh_hapus_arsip' => (bool) request()->user()?->can('laporan-kesiswaan.hapus-arsip'),
        ]);
    }

    // ----------------------------------------------------------- dashboard

    public function dashboard(Request $request): JsonResponse
    {
        $in = $request->validate(['tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'], 'semester' => ['nullable', 'in:ganjil,genap']]);
        $ta = TahunAjaran::findOrFail($in['tahun_ajaran_id']);
        $sem = ! empty($in['semester']) ? Semester::where('tahun_ajaran_id', $ta->id)->whereRaw('lower(nama) = ?', [$in['semester']])->first() : null;
        $dari = substr((string) ($sem->tanggal_mulai ?? $ta->tanggal_mulai), 0, 10);
        $sampai = substr((string) ($sem->tanggal_selesai ?? $ta->tanggal_selesai), 0, 10);

        $kelas = Kelas::where(fn ($q) => $q->where('tahun_ajaran', $ta->nama)->orWhere('tahun_ajaran_id', $ta->id))->get(['id', 'jenjang', 'tingkat', 'status']);
        $aktifPerKelas = Siswa::where('status', 'aktif')->selectRaw('kelas_id, count(*) as n')->groupBy('kelas_id')->pluck('n', 'kelas_id');
        $jenjangSekolah = tenant()->jenjang ?: 'Belum diisi';
        $perJenjang = $kelas->groupBy(fn ($k) => $k->jenjang ?: $jenjangSekolah)->map(fn ($g, $j) => ['jenjang' => $j, 'rombel' => $g->count(), 'siswa' => (int) $g->sum(fn ($k) => $aktifPerKelas[$k->id] ?? 0)])->values();
        $perTingkat = $kelas->groupBy(fn ($k) => $k->tingkat ?: 'Belum diisi')->map(fn ($g, $t) => ['tingkat' => $t, 'rombel' => $g->count(), 'siswa' => (int) $g->sum(fn ($k) => $aktifPerKelas[$k->id] ?? 0)])->sortBy('tingkat', SORT_NATURAL)->values();

        $ids = Siswa::whereIn('kelas_id', $kelas->pluck('id'))->pluck('id');
        $absen = Absensi::whereIn('siswa_id', $ids)->whereBetween('tanggal', [$dari, $sampai])->selectRaw('count(*) as total, sum(case when status = ? then 1 else 0 end) as hadir', ['hadir'])->first();

        $tahunMasuk = (int) substr((string) $ta->tanggal_mulai, 0, 4);
        $terbaru = LaporanKesiswaanArsip::with('pembuat:id,name')->orderByDesc('id')->limit(5)->get()->map(fn ($a) => $this->presentArsip($a));

        return response()->json([
            'konteks' => ['tahun_ajaran' => $ta->nama, 'periode' => $dari.' s.d. '.$sampai],
            'siswa_aktif' => Siswa::where('status', 'aktif')->count(),
            'siswa_baru' => Siswa::where('tahun_masuk', $tahunMasuk)->count(),
            'tahun_masuk_acuan' => $tahunMasuk,
            'siswa_keluar' => Siswa::whereIn('status', ['keluar', 'pindah'])->count(),
            'pindahan_masuk' => MutasiSiswa::where('jenis', 'masuk')->where('status', 'tercatat')->whereBetween('tanggal', [$dari, $sampai])->count(),
            'rombel' => $kelas->count(),
            'per_jenjang' => $perJenjang, 'per_tingkat' => $perTingkat,
            'kehadiran' => $this->persen((int) ($absen->hadir ?? 0), (int) ($absen->total ?? 0)),
            'jumlah_laporan' => LaporanKesiswaanArsip::count(),
            'laporan_bulan_ini' => LaporanKesiswaanArsip::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
            'terbaru' => $terbaru,
        ]);
    }

    // ------------------------------------------------------------- laporan

    public function tampil(Request $request, string $jenis): JsonResponse
    {
        return response()->json($this->bangun($request, $jenis));
    }

    public function export(Request $request, string $jenis): Response
    {
        $format = $request->validate(['format' => ['required', 'in:xlsx,pdf']])['format'];
        $laporan = $this->bangun($request, $jenis);
        $arsip = $this->simpanArsip($request, $jenis, $laporan, $format);

        return $this->keluarkan($laporan, $format, $jenis.'-'.$arsip->id);
    }

    /** Mencatat pencetakan ke arsip (dilakukan di browser); snapshot memungkinkan cetak ulang dengan isi yang sama. */
    public function cetak(Request $request, string $jenis): JsonResponse
    {
        $laporan = $this->bangun($request, $jenis);
        $arsip = $this->simpanArsip($request, $jenis, $laporan, 'cetak');

        return response()->json(['message' => 'Pencetakan dicatat di Arsip & Riwayat Laporan.', 'arsip_id' => $arsip->id]);
    }

    // --------------------------------------------------------------- arsip

    public function arsip(Request $request): JsonResponse
    {
        $in = $request->validate([
            'jenis' => ['nullable', 'string'], 'format' => ['nullable', 'in:xlsx,pdf,cetak'], 'tahun_ajaran_id' => ['nullable', 'integer'], 'dari' => ['nullable', 'date'], 'sampai' => ['nullable', 'date'],
            'search' => ['nullable', 'string', 'max:100'], 'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);
        $hal = LaporanKesiswaanArsip::with(['pembuat:id,name', 'tahunAjaran:id,nama'])
            ->when(! empty($in['jenis']), fn ($q) => $q->where('jenis', $in['jenis']))->when(! empty($in['format']), fn ($q) => $q->where('format', $in['format']))
            ->when(! empty($in['tahun_ajaran_id']), fn ($q) => $q->where('tahun_ajaran_id', $in['tahun_ajaran_id']))
            ->when(! empty($in['dari']), fn ($q) => $q->whereDate('created_at', '>=', $in['dari']))->when(! empty($in['sampai']), fn ($q) => $q->whereDate('created_at', '<=', $in['sampai']))
            ->when(! empty($in['search']), fn ($q) => $q->where('nama', 'like', '%'.$in['search'].'%'))->orderByDesc('id')->paginate($in['per_page'] ?? 20);
        $hal->getCollection()->transform(fn ($a) => $this->presentArsip($a));

        return response()->json($hal);
    }

    /** Membuka laporan yang pernah dibuat (isi snapshot, bukan dihitung ulang). */
    public function bukaArsip(LaporanKesiswaanArsip $arsip): JsonResponse
    {
        return response()->json($this->baca($arsip));
    }

    public function unduhArsip(Request $request, LaporanKesiswaanArsip $arsip): Response
    {
        $format = $request->validate(['format' => ['nullable', 'in:xlsx,pdf']])['format'] ?? ($arsip->format === 'cetak' ? 'pdf' : $arsip->format);

        return $this->keluarkan($this->baca($arsip), $format, $arsip->jenis.'-arsip-'.$arsip->id);
    }

    public function hapusArsip(Request $request, LaporanKesiswaanArsip $arsip): JsonResponse
    {
        $user = $request->user();
        if (! ($user?->can('laporan-kesiswaan.hapus-arsip') || $arsip->dibuat_oleh === $user?->id)) {
            abort(403, 'Anda hanya dapat menghapus arsip yang Anda buat sendiri. Penghapusan arsip milik orang lain memerlukan hak akses khusus.');
        }
        if ($arsip->snapshot_path) {
            Storage::disk('local')->delete($arsip->snapshot_path);
        }
        activity(self::LOG_LAPORAN)->performedOn($arsip)->causedBy($user)->event('arsip_dihapus')->withProperties(['sebelum' => ['nama' => $arsip->nama, 'format' => $arsip->format], 'sesudah' => null, 'ip' => $request->ip()])->log("Menghapus arsip laporan \"{$arsip->nama}\".");
        $arsip->delete();

        return response()->json(['message' => 'Arsip laporan dihapus.']);
    }

    // ---------------------------------------------------------- pengaturan

    public function pengaturan(): JsonResponse
    {
        return response()->json($this->pengaturanUmum() + ['logo_sekolah' => tenant()->logo ?: null]);
    }

    public function simpanPengaturan(Request $request): JsonResponse
    {
        $d = $request->validate([
            'kop_nama' => ['required', 'string', 'max:255'], 'kop_alamat' => ['nullable', 'string', 'max:500'], 'kop_kontak' => ['nullable', 'string', 'max:255'],
            'tampil_logo' => ['boolean'], 'kota' => ['nullable', 'string', 'max:100'],
            'penandatangan' => ['nullable', 'array', 'max:3'], 'penandatangan.*.jabatan' => ['required', 'string', 'max:100'], 'penandatangan.*.nama' => ['nullable', 'string', 'max:150'], 'penandatangan.*.nip' => ['nullable', 'string', 'max:40'],
        ]);
        $lama = $this->pengaturanUmum();
        DB::table('laporan_kesiswaan_pengaturan')->updateOrInsert(['kunci' => 'umum'], ['nilai' => json_encode($d), 'updated_at' => now(), 'created_at' => now()]);
        activity(self::LOG_LAPORAN)->causedBy($request->user())->event('pengaturan')->withProperties(['sebelum' => $lama, 'sesudah' => $d, 'ip' => $request->ip()])->log('Mengubah pengaturan tampilan laporan kesiswaan.');

        return response()->json($this->pengaturanUmum());
    }

    // ------------------------------------------------------------- pembantu

    private function bangun(Request $request, string $jenis): array
    {
        abort_unless(isset(self::JENIS[$jenis]), 404, 'Jenis laporan tidak dikenal.');
        $c = $this->ctx($request);
        if ($jenis === 'perkembangan' && empty($c['siswa_id'])) {
            throw ValidationException::withMessages(['siswa_id' => 'Pilih siswa untuk laporan perkembangan.']);
        }
        $hasil = $this->{'laporan'.ucfirst($jenis)}($c);

        return [
            'jenis' => $jenis, 'judul' => self::JENIS[$jenis],
            'konteks' => $this->labelKonteks($c),
            'ringkasan' => $hasil['ringkasan'], 'catatan' => $hasil['catatan'],
            'tabel' => $this->pilihKolom($hasil['tabel'], $c['kolom'] ?? null, $jenis),
            'pengaturan' => $this->blokPengaturan($c['tanggal_laporan'] ?? null, $request->boolean('logo', true), $request->boolean('ttd', true)),
            'orientasi' => $jenis === 'perkembangan' ? 'portrait' : 'landscape',
        ];
    }

    private function simpanArsip(Request $request, string $jenis, array $laporan, string $format): LaporanKesiswaanArsip
    {
        $k = $laporan['konteks'];
        $baris = collect($laporan['tabel'])->firstWhere('id', 'data')['baris'] ?? collect($laporan['tabel'])->first()['baris'] ?? [];
        $arsip = LaporanKesiswaanArsip::create([
            'jenis' => $jenis, 'nama' => $laporan['judul'].' — '.$k['tahun_ajaran'].($k['semester'] !== 'semua' ? ' '.ucfirst($k['semester']) : ''), 'format' => $format,
            'tahun_ajaran_id' => $k['tahun_ajaran_id'], 'semester' => $k['semester'] === 'semua' ? null : $k['semester'], 'periode' => $k['periode'],
            'parameter' => $request->except(['format']), 'jumlah_baris' => count($baris), 'dibuat_oleh' => $request->user()?->id,
        ]);
        $json = json_encode($laporan, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR) ?: '{}';
        $path = "laporan-kesiswaan/{$arsip->id}.json";
        Storage::disk('local')->put($path, $json);
        $arsip->update(['snapshot_path' => $path, 'ukuran' => strlen($json)]);
        activity(self::LOG_LAPORAN)->performedOn($arsip)->causedBy($request->user())->event('laporan_dibuat')->withProperties(['sebelum' => null, 'sesudah' => ['format' => $format, 'jenis' => $jenis], 'ip' => $request->ip()])->log("Membuat {$arsip->nama} ({$format}).");

        return $arsip;
    }

    private function baca(LaporanKesiswaanArsip $arsip): array
    {
        if (! $arsip->snapshot_path || ! Storage::disk('local')->exists($arsip->snapshot_path)) {
            throw ValidationException::withMessages(['arsip' => 'Berkas arsip laporan ini tidak lagi tersedia.']);
        }

        return json_decode(Storage::disk('local')->get($arsip->snapshot_path), true) ?: [];
    }

    private function keluarkan(array $laporan, string $format, string $nama): Response
    {
        $sekolah = $laporan['pengaturan']['kop']['nama'] ?? (tenant()->nama_sekolah ?: 'Sekolah');
        $berkas = 'laporan-kesiswaan-'.$nama.'.'.$format;

        if ($format === 'xlsx') {
            return response(app(LaporanAkademikController::class)->xlsx($laporan, $sekolah), 200, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition' => 'attachment; filename="'.$berkas.'"']);
        }

        return Pdf::loadView('laporan.kesiswaan', ['laporan' => $laporan, 'logo' => $this->logoDataUri($laporan['pengaturan']['kop']['logo'] ?? null), 'tanggalLaporan' => $this->tanggalIndonesia($laporan['pengaturan']['tanggal_laporan'] ?? null), 'dibuat' => now()->locale('id')->translatedFormat('d F Y H:i')])
            ->setPaper('a4', $laporan['orientasi'] ?? 'landscape')->download($berkas);
    }

    private function presentArsip(LaporanKesiswaanArsip $a): array
    {
        $ada = $a->snapshot_path && Storage::disk('local')->exists($a->snapshot_path);

        return [
            'id' => $a->id, 'jenis' => $a->jenis, 'jenis_label' => self::JENIS[$a->jenis] ?? $a->jenis, 'nama' => $a->nama, 'format' => $a->format, 'tahun_ajaran' => $a->tahunAjaran?->nama, 'semester' => $a->semester,
            'periode' => $a->periode, 'pembuat' => $a->pembuat?->name, 'dibuat_oleh' => $a->dibuat_oleh, 'created_at' => $a->created_at, 'jumlah_baris' => $a->jumlah_baris, 'ukuran' => $a->ukuran,
            'status' => $ada ? 'tersedia' : 'berkas_hilang', 'status_label' => $ada ? 'Tersedia' : 'Berkas hilang', 'parameter' => $a->parameter,
        ];
    }
}

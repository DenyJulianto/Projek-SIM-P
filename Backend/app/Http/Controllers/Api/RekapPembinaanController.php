<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\LaporanKesiswaanBuilder;
use App\Http\Controllers\Api\Concerns\LaporanKesiswaanPengaturan;
use App\Http\Controllers\Api\Concerns\RekapPembinaanData;
use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\PembinaanTindakLanjut;
use App\Models\Pelanggaran;
use App\Models\Prestasi;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rekap Pembinaan: gambaran pembinaan satu siswa dari Pelanggaran, Prestasi, dan Tindak Lanjut Pembinaan.
 * Data pelanggaran bersifat sensitif, jadi setiap endpoint memeriksa hak akses dan, untuk wali kelas,
 * membatasi siswa pada kelas binaannya.
 */
class RekapPembinaanController extends Controller
{
    use LaporanKesiswaanBuilder;
    use LaporanKesiswaanPengaturan;
    use RekapPembinaanData;

    public function opsi(Request $request): JsonResponse
    {
        $batas = $this->batasKelas($request);
        $semesterAktif = Semester::where('is_active', true)->value('nama');
        $kelas = Kelas::when($batas !== null, fn ($q) => $q->whereIn('id', $batas))->orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tingkat', 'tahun_ajaran', 'tahun_ajaran_id']);
        $gabung = fn (array $bawaan, $dariData) => collect($bawaan)->merge($dariData)->filter()->unique()->values();

        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'semester_aktif' => $semesterAktif ? strtolower($semesterAktif) : null,
            'tingkat' => $kelas->pluck('tingkat')->filter()->unique()->sort()->values(),
            'kelas' => $kelas,
            'kategori_pelanggaran' => $gabung(self::KATEGORI_BAWAAN, Pelanggaran::whereNotNull('kategori')->distinct()->pluck('kategori')),
            'bidang_prestasi' => $gabung(self::BIDANG_BAWAAN, Prestasi::whereNotNull('bidang')->distinct()->pluck('bidang')),
            'jenis_tindakan' => self::JENIS_TINDAKAN_BAWAAN,
            'tingkat_pelanggaran' => $this->daftar(self::TINGKAT_PELANGGARAN),
            'status_pelanggaran' => $this->daftar(self::STATUS_PELANGGARAN),
            'tingkat_prestasi' => $this->daftar(self::TINGKAT_PRESTASI),
            'jenis_prestasi' => $this->daftar(self::JENIS_PRESTASI),
            'status_tindak_lanjut' => $this->daftar(self::STATUS_TINDAK_LANJUT),
            'izin' => [
                'kelola' => $this->boleh($request, 'rekap-pembinaan.manage'), 'lihat_semua' => $batas === null,
                'nama_pengguna' => $request->user()?->name,
            ],
        ]);
    }

    /** Pencarian siswa untuk dipilih (nama/NIS/NISN), dibatasi kelas binaan bagi wali kelas. */
    public function daftarSiswa(Request $request): JsonResponse
    {
        $in = $request->validate([
            'search' => ['nullable', 'string', 'max:100'], 'tahun_ajaran_id' => ['nullable', 'integer'], 'tingkat' => ['nullable', 'string', 'max:20'], 'kelas_id' => ['nullable', 'integer'],
        ]);
        $batas = $this->batasKelas($request);
        $ta = ! empty($in['tahun_ajaran_id']) ? TahunAjaran::find($in['tahun_ajaran_id']) : null;

        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat')
            ->when($batas !== null, fn ($q) => $q->whereIn('kelas_id', $batas))
            ->when(! empty($in['kelas_id']), fn ($q) => $q->where('kelas_id', $in['kelas_id']))
            ->when(! empty($in['tingkat']) || $ta, fn ($q) => $q->whereHas('kelas', fn ($k) => $k->when(! empty($in['tingkat']), fn ($x) => $x->where('tingkat', $in['tingkat']))
                ->when($ta, fn ($x) => $x->where(fn ($w) => $w->where('tahun_ajaran', $ta->nama)->orWhere('tahun_ajaran_id', $ta->id)))))
            ->when(! empty($in['search']), fn ($q) => $q->where(fn ($w) => $w->where('nama', 'like', '%'.$in['search'].'%')->orWhere('nis', 'like', '%'.$in['search'].'%')->orWhere('nisn', 'like', '%'.$in['search'].'%')))
            ->withCount(['pelanggaran as pelanggaran_aktif' => fn ($q) => $q->where('status', '!=', 'selesai')])
            ->orderBy('nama')->limit(30)->get();

        return response()->json($siswa->map(fn (Siswa $s) => [
            'id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis, 'nisn' => $s->nisn, 'status' => $s->status, 'kelas' => $s->kelas?->tingkat, 'rombel' => $s->kelas?->nama_kelas, 'pelanggaran_aktif' => (int) $s->pelanggaran_aktif,
        ]));
    }

    /** Seluruh isi halaman satu siswa: identitas, ringkasan, dua riwayat, tindak lanjut, timeline, dan analisis. */
    public function profil(Request $request, Siswa $siswa): JsonResponse
    {
        $this->pastikanSiswa($request, $siswa);
        $f = $this->filter($request);
        $data = $this->ambilData($siswa, $f, $this->boleh($request, 'rekap-pembinaan.manage'));
        $bagian = $this->saring($data, $f);

        return response()->json([
            'identitas' => $this->identitas($siswa),
            'periode' => ['dari' => $f['dari'], 'sampai' => $f['sampai'], 'tahun_ajaran' => $f['ta']?->nama],
            'ringkasan' => $this->ringkasan($data),
            'pelanggaran' => $bagian['pelanggaran'], 'prestasi' => $bagian['prestasi'], 'tindak_lanjut' => $bagian['tindak_lanjut'],
            'timeline' => $this->timeline($data, $f),
            'analisis' => $this->analisis($data),
            'pilihan_pelanggaran' => $data['semua_pelanggaran']->map(fn ($p) => ['id' => $p['id'], 'tanggal' => $p['tanggal'], 'jenis' => $p['jenis'], 'status' => $p['status_label']])->values(),
            'kelola' => $this->boleh($request, 'rekap-pembinaan.manage'),
        ]);
    }

    /** Riwayat tindakan atas satu pelanggaran: tindak lanjut terkait dan perubahan status/isi (audit). */
    public function riwayatPelanggaran(Request $request, Pelanggaran $pelanggaran): JsonResponse
    {
        $this->pastikanSiswa($request, Siswa::findOrFail($pelanggaran->siswa_id));
        $internal = $this->boleh($request, 'rekap-pembinaan.manage');
        $tl = PembinaanTindakLanjut::where('pelanggaran_id', $pelanggaran->id)->orderByDesc('tanggal_pembinaan')->get();
        $petugas = User::whereIn('id', $tl->pluck('dibuat_oleh')->filter())->pluck('name', 'id');

        return response()->json([
            'tindak_lanjut' => $tl->map(fn ($t) => $this->barisTl($t, $petugas, collect([$pelanggaran->id => $pelanggaran->jenis]), $internal)),
            'log' => Activity::where('log_name', self::LOG_PEMBINAAN)->where('subject_type', Pelanggaran::class)->where('subject_id', $pelanggaran->id)->with('causer:id,name')
                ->orderByDesc('created_at')->orderByDesc('id')->limit(50)->get()
                ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $this->propertiLog($a->properties, $internal), 'created_at' => $a->created_at]),
        ]);
    }

    // ------------------------------------------------------- laporan individual

    public function laporan(Request $request, Siswa $siswa): JsonResponse
    {
        $this->pastikanSiswa($request, $siswa);

        return response()->json($this->bangunLaporan($request, $siswa));
    }

    public function export(Request $request, Siswa $siswa): Response
    {
        $this->pastikanSiswa($request, $siswa);
        $format = $request->validate(['format' => ['required', 'in:xlsx,pdf']])['format'];
        $laporan = $this->bangunLaporan($request, $siswa);
        $this->catatKeluaran($request, $siswa, $format);
        $berkas = 'rekap-pembinaan-'.preg_replace('/[^A-Za-z0-9]+/', '-', $siswa->nama).'.'.$format;

        if ($format === 'xlsx') {
            return response(app(LaporanAkademikController::class)->xlsx($laporan, $laporan['pengaturan']['kop']['nama']), 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition' => 'attachment; filename="'.$berkas.'"',
            ]);
        }

        return Pdf::loadView('laporan.kesiswaan', [
            'laporan' => $laporan, 'logo' => $this->logoDataUri($laporan['pengaturan']['kop']['logo'] ?? null), 'tanggalLaporan' => $this->tanggalIndonesia($laporan['pengaturan']['tanggal_laporan'] ?? null),
            'dibuat' => now()->locale('id')->translatedFormat('d F Y H:i'),
        ])->setPaper('a4', 'portrait')->download($berkas);
    }

    /** Mencatat pencetakan (dilakukan di browser) ke audit. */
    public function catatCetak(Request $request, Siswa $siswa): JsonResponse
    {
        $this->pastikanSiswa($request, $siswa);
        $this->catatKeluaran($request, $siswa, 'cetak');

        return response()->json(['message' => 'Pencetakan dicatat.']);
    }

    // ------------------------------------------------------------- pembantu

    private function daftar(array $peta): array
    {
        return collect($peta)->map(fn ($l, $k) => ['key' => $k, 'label' => $l])->values()->all();
    }

    private function catatKeluaran(Request $request, Siswa $siswa, string $format): void
    {
        activity(self::LOG_PEMBINAAN)->performedOn($siswa)->causedBy($request->user())->event('ekspor')
            ->withProperties(['sebelum' => null, 'sesudah' => ['format' => $format, 'bagian' => $request->input('bagian', 'semua')], 'ip' => $request->ip()])
            ->log("Mengeluarkan laporan pembinaan {$siswa->nama} ({$format}).");
    }

    private function tanggal(?string $t): string
    {
        return $t ? Carbon::parse($t)->format('d/m/Y') : '-';
    }

    private function bangunLaporan(Request $request, Siswa $siswa): array
    {
        $f = $this->filter($request);
        $bagian = $f['bagian'] ?? 'semua';
        // Catatan internal tidak pernah ikut laporan: laporan dapat dicetak dan diserahkan ke pihak lain.
        $data = $this->ambilData($siswa, $f, false);
        $s = $this->saring($data, $f);
        $r = $this->ringkasan($data);
        $i = $this->identitas($siswa);
        $ada = fn (string $b) => $bagian === 'semua' || $bagian === $b;
        $tipe = ['pelanggaran' => 'Pelanggaran', 'prestasi' => 'Prestasi', 'tindak_lanjut' => 'Tindak lanjut'];

        $tabel = [$this->tabel('identitas', 'Identitas siswa', [['aspek', 'Data'], ['isi', 'Keterangan']], [
            ['aspek' => 'Nama lengkap', 'isi' => $i['nama']], ['aspek' => 'NIS / NISN', 'isi' => $i['nis'].' / '.($i['nisn'] ?: '-')], ['aspek' => 'Kelas / rombel', 'isi' => ($i['kelas'] ?: '-').' / '.($i['rombel'] ?: '-')],
            ['aspek' => 'Tahun ajaran', 'isi' => $i['tahun_ajaran'] ?: '-'], ['aspek' => 'Wali kelas', 'isi' => $i['wali_kelas'] ?: '-'], ['aspek' => 'Status siswa', 'isi' => ucfirst((string) $i['status'])],
        ])];
        if ($ada('pelanggaran')) {
            $kolom = array_merge([['tanggal', 'Tanggal'], ['jenis', 'Jenis Pelanggaran'], ['kategori', 'Kategori'], ['tingkat', 'Tingkat']], $r['pakai_poin'] ? [['poin', 'Poin', 'angka']] : [], [['deskripsi', 'Deskripsi'], ['tindakan', 'Tindakan'], ['status', 'Status'], ['petugas', 'Petugas'], ['catatan', 'Catatan']]);
            $tabel[] = $this->tabel('pelanggaran', 'Riwayat pelanggaran', $kolom, $s['pelanggaran']->map(fn ($p) => ['tanggal' => $this->tanggal($p['tanggal']), 'jenis' => $p['jenis'], 'kategori' => $p['kategori'] ?: '-', 'tingkat' => $p['tingkat_label'],
                'poin' => $p['poin'], 'deskripsi' => $p['deskripsi'] ?: '-', 'tindakan' => $p['tindakan'] ?: '-', 'status' => $p['status_label'], 'petugas' => $p['petugas'] ?: '-', 'catatan' => $p['catatan'] ?: '-']));
        }
        if ($ada('prestasi')) {
            $tabel[] = $this->tabel('prestasi', 'Riwayat prestasi (terverifikasi)', [['tanggal', 'Tanggal'], ['judul', 'Prestasi'], ['bidang', 'Bidang'], ['tingkat', 'Tingkat'], ['jenis', 'Jenis'], ['penyelenggara', 'Penyelenggara'], ['peringkat', 'Peringkat'], ['keterangan', 'Keterangan'], ['bukti', 'Bukti']],
                $s['prestasi']->map(fn ($p) => ['tanggal' => $this->tanggal($p['tanggal']), 'judul' => $p['judul'], 'bidang' => $p['bidang'] ?: '-', 'tingkat' => $p['tingkat_label'], 'jenis' => $p['jenis_label'] ?: '-', 'penyelenggara' => $p['penyelenggara'] ?: '-',
                    'peringkat' => $p['peringkat'] ?: '-', 'keterangan' => $p['keterangan'] ?: '-', 'bukti' => $p['bukti_url'] ? 'Ada' : '-']));
        }
        if ($ada('tindak_lanjut')) {
            $tabel[] = $this->tabel('tindak_lanjut', 'Tindak lanjut pembinaan', [['tanggal', 'Tanggal Pembinaan'], ['tindakan', 'Jenis Tindakan'], ['pembina', 'Pembina'], ['pelanggaran', 'Terkait Pelanggaran'], ['catatan', 'Catatan'], ['rekomendasi', 'Rekomendasi'], ['jadwal', 'Tanggal Tindak Lanjut'], ['status', 'Status']],
                $s['tindak_lanjut']->map(fn ($t) => ['tanggal' => $this->tanggal($t['tanggal_pembinaan']), 'tindakan' => $t['jenis_tindakan'], 'pembina' => $t['pembina'], 'pelanggaran' => $t['pelanggaran'] ?: '-', 'catatan' => $t['catatan'] ?: '-', 'rekomendasi' => $t['rekomendasi'] ?: '-',
                    'jadwal' => $this->tanggal($t['tanggal_tindak_lanjut']), 'status' => $t['status_label']]));
        }
        if ($ada('timeline')) {
            $tabel[] = $this->tabel('timeline', 'Timeline pembinaan', [['tanggal', 'Tanggal'], ['jenis', 'Jenis'], ['kegiatan', 'Kegiatan'], ['keterangan', 'Keterangan'], ['status', 'Status']],
                $this->timeline($data, $f)->map(fn ($e) => ['tanggal' => $this->tanggal($e['tanggal']), 'jenis' => $tipe[$e['tipe']], 'kegiatan' => $e['judul'], 'keterangan' => $e['sub'], 'status' => $e['badge'] ?: '-']));
        }

        return [
            'jenis' => 'rekap-pembinaan', 'judul' => 'Rekap Pembinaan Siswa — '.$siswa->nama,
            'konteks' => [
                'tahun_ajaran_id' => $f['ta']?->id, 'tahun_ajaran' => $f['ta']?->nama ?? 'Semua periode', 'semester' => $f['semester'] ?? 'semua',
                'periode' => $f['dari'] || $f['sampai'] ? $this->tanggal($f['dari']).' – '.$this->tanggal($f['sampai']) : 'Semua waktu', 'rombel' => $i['rombel'], 'dibuat' => now()->toDateTimeString(),
            ],
            'ringkasan' => [
                $this->stat('Total pelanggaran', $r['total_pelanggaran']), $this->stat('Pelanggaran aktif', $r['pelanggaran_aktif']), $this->stat('Total prestasi', $r['total_prestasi']), $this->stat('Tindak lanjut pembinaan', $r['total_tindak_lanjut']),
            ],
            'catatan' => ['Pelanggaran dan prestasi ditampilkan sebagai dua aspek terpisah dan tidak digabung menjadi skor. Prestasi yang dihitung hanya yang sudah terverifikasi. Catatan internal pembinaan tidak dicantumkan dalam laporan ini.'],
            'tabel' => $tabel,
            'pengaturan' => $this->blokPengaturan($f['tanggal_laporan'] ?? null, $request->boolean('logo', true), $request->boolean('ttd', true)),
            'orientasi' => 'landscape',
        ];
    }
}

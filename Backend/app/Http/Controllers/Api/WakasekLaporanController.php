<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\LaporanKesiswaanBuilder;
use App\Http\Controllers\Api\Concerns\LaporanKesiswaanPengaturan;
use App\Http\Controllers\Api\Concerns\WakasekData;
use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\GuruPengganti;
use App\Models\Kelas;
use App\Models\Nilai;
use App\Models\Pelanggaran;
use App\Models\Prestasi;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

/** Laporan Guru & Tendik dan Laporan Sekolah untuk Wakil Kepala Sekolah (preview, PDF, Excel, cetak). */
class WakasekLaporanController extends Controller
{
    use LaporanKesiswaanBuilder, WakasekData {
        LaporanKesiswaanBuilder::persen insteadof WakasekData;
    }
    use LaporanKesiswaanPengaturan;

    private const JENIS = ['guru-tendik' => 'Laporan Guru & Tenaga Kependidikan', 'sekolah' => 'Laporan Sekolah'];

    public function tampil(Request $request, string $jenis): JsonResponse
    {
        return response()->json($this->bangunLaporan($request, $jenis));
    }

    public function export(Request $request, string $jenis): Response
    {
        $format = $request->validate(['format' => ['required', 'in:xlsx,pdf']])['format'];
        $laporan = $this->bangunLaporan($request, $jenis);
        $this->catat($request, $jenis, $format);
        $berkas = 'laporan-'.$jenis.'-'.now()->format('Ymd').'.'.$format;

        if ($format === 'xlsx') {
            return response(app(LaporanAkademikController::class)->xlsx($laporan, $laporan['pengaturan']['kop']['nama']), 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition' => 'attachment; filename="'.$berkas.'"',
            ]);
        }

        return Pdf::loadView('laporan.kesiswaan', [
            'laporan' => $laporan, 'logo' => $this->logoDataUri($laporan['pengaturan']['kop']['logo'] ?? null), 'tanggalLaporan' => $this->tanggalIndonesia($laporan['pengaturan']['tanggal_laporan'] ?? null),
            'dibuat' => now()->locale('id')->translatedFormat('d F Y H:i'),
        ])->setPaper('a4', $laporan['orientasi'])->download($berkas);
    }

    public function catatCetak(Request $request, string $jenis): JsonResponse
    {
        abort_unless(isset(self::JENIS[$jenis]), 404, 'Jenis laporan tidak dikenal.');
        $this->catat($request, $jenis, 'cetak');

        return response()->json(['message' => 'Pencetakan dicatat.']);
    }

    // ------------------------------------------------------------- pembantu

    private function catat(Request $request, string $jenis, string $format): void
    {
        activity('laporan-wakasek')->causedBy($request->user())->event('laporan')->withProperties(['jenis' => $jenis, 'format' => $format, 'ip' => $request->ip()])->log('Mengeluarkan '.self::JENIS[$jenis]." ({$format}).");
    }

    private function tgl(string $t): string
    {
        return Carbon::parse($t)->format('d/m/Y');
    }

    private function bangunLaporan(Request $request, string $jenis): array
    {
        abort_unless(isset(self::JENIS[$jenis]), 404, 'Jenis laporan tidak dikenal.');
        [$dari, $sampai] = $this->periode($request);
        $request->validate(['tanggal_laporan' => ['nullable', 'date'], 'logo' => ['nullable', 'boolean'], 'ttd' => ['nullable', 'boolean']]);
        $isi = $jenis === 'guru-tendik' ? $this->laporanGuruTendik($dari, $sampai) : $this->laporanSekolah($dari, $sampai);
        $ta = TahunAjaran::where('is_active', true)->first();

        return [
            'jenis' => $jenis, 'judul' => self::JENIS[$jenis],
            'konteks' => ['tahun_ajaran_id' => $ta?->id, 'tahun_ajaran' => $ta?->nama ?? 'Semua periode', 'semester' => 'semua', 'periode' => $this->tgl($dari).' – '.$this->tgl($sampai), 'dibuat' => now()->toDateTimeString()],
            'ringkasan' => $isi['ringkasan'], 'catatan' => $isi['catatan'], 'tabel' => $isi['tabel'],
            'pengaturan' => $this->blokPengaturan($request->input('tanggal_laporan'), $request->boolean('logo', true), $request->boolean('ttd', true)),
            'orientasi' => 'landscape',
        ];
    }

    private function laporanGuruTendik(string $dari, string $sampai): array
    {
        $aktivitas = $this->hitungAktivitasGuru($dari, $sampai);
        $semua = Guru::orderBy('nama')->get()->keyBy('id');
        $hadirTotal = (int) $aktivitas->sum('hadir');
        $catatTotal = $hadirTotal + (int) $aktivitas->sum('tidak_hadir');
        $pengganti = GuruPengganti::with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'guruBerhalangan:id,nama', 'guruPengganti:id,nama'])->where('status', 'disetujui')->whereBetween('tanggal', [$dari, $sampai])->orderBy('tanggal')->get();

        return [
            'ringkasan' => [
                $this->stat('Total guru & tendik', $semua->count()), $this->stat('Aktif', $semua->where('status', 'aktif')->count()),
                $this->stat('Kehadiran', $this->persen($hadirTotal, $catatTotal), '%'), $this->stat('Guru perlu perhatian', $aktivitas->where('perlu_perhatian', true)->count(), 'ada jadwal, belum mencatat aktivitas'),
                $this->stat('Penggantian guru', $pengganti->count(), 'disetujui pada periode'),
            ],
            'catatan' => ['Data diambil dari Data Guru, Jadwal Pelajaran, Kehadiran Guru, Guru Pengganti, serta materi, tugas, ujian, dan nilai yang dicatat guru pada periode ini. "Perlu perhatian" hanyalah penanda untuk ditindaklanjuti, bukan penilaian kinerja.'],
            'tabel' => [
                $this->tabel('data', 'Data guru & tenaga kependidikan', [['nama', 'Nama'], ['nip', 'NIP'], ['jabatan', 'Jabatan'], ['status_kepegawaian', 'Status Kepegawaian'], ['mata_pelajaran', 'Mata Pelajaran'], ['status', 'Status']],
                    $semua->map(fn (Guru $g) => ['nama' => trim($g->nama.($g->gelar ? ', '.$g->gelar : '')), 'nip' => $g->nip ?: '-', 'jabatan' => $g->jabatan ?: '-', 'status_kepegawaian' => $g->status_kepegawaian ?: '-', 'mata_pelajaran' => $g->mata_pelajaran ?: '-', 'status' => ucfirst((string) $g->status)])),
                $this->tabel('beban', 'Beban mengajar & aktivitas', [['nama', 'Nama'], ['sesi', 'Sesi/Minggu', 'angka'], ['kelas', 'Kelas', 'angka'], ['mapel', 'Mapel', 'angka'], ['materi', 'Materi', 'angka'], ['tugas', 'Tugas', 'angka'], ['ujian', 'Ujian', 'angka'], ['nilai', 'Nilai Diinput', 'angka'], ['terakhir', 'Aktivitas Terakhir']],
                    $aktivitas->map(fn ($a) => ['nama' => $a['nama'], 'sesi' => $a['sesi_per_minggu'], 'kelas' => $a['kelas'], 'mapel' => $a['mapel'], 'materi' => $a['materi'], 'tugas' => $a['tugas'], 'ujian' => $a['ujian'], 'nilai' => $a['nilai'], 'terakhir' => $a['terakhir_aktif'] ? $this->tgl($a['terakhir_aktif']) : '-'])),
                $this->tabel('kehadiran', 'Kehadiran guru & tendik', [['nama', 'Nama'], ['hadir', 'Hadir', 'angka'], ['sakit', 'Sakit', 'angka'], ['izin', 'Izin', 'angka'], ['alpha', 'Alpha', 'angka'], ['persen', '% Hadir', 'persen']],
                    $this->kehadiranGuru($dari, $sampai)->map(fn ($k) => ['nama' => $k['nama'], 'hadir' => $k['hadir'], 'sakit' => $k['sakit'], 'izin' => $k['izin'], 'alpha' => $k['alpha'], 'persen' => $k['persen']])),
                $this->tabel('pengganti', 'Guru pengganti (disetujui)', [['tanggal', 'Tanggal'], ['kelas', 'Kelas'], ['mapel', 'Mata Pelajaran'], ['berhalangan', 'Guru Berhalangan'], ['pengganti', 'Guru Pengganti'], ['alasan', 'Alasan']],
                    $pengganti->map(fn (GuruPengganti $p) => ['tanggal' => $this->tgl((string) $p->tanggal), 'kelas' => $p->kelas?->nama_kelas, 'mapel' => $p->mataPelajaran?->nama_mapel, 'berhalangan' => $p->guruBerhalangan?->nama, 'pengganti' => $p->guruPengganti?->nama, 'alasan' => $p->alasan])),
            ],
        ];
    }

    private function laporanSekolah(string $dari, string $sampai): array
    {
        $siswaAktif = Siswa::where('status', 'aktif')->get(['id', 'kelas_id', 'jenis_kelamin']);
        $perKelas = $siswaAktif->groupBy('kelas_id');
        $kehadiran = $this->kehadiranSiswaPerKelas($dari, $sampai);
        $guru = $this->kehadiranGuru($dari, $sampai);
        $tot = fn ($c, string $k) => (int) $c->sum($k);
        $pelanggaran = Pelanggaran::whereBetween('tanggal', [$dari, $sampai])->get(['tanggal', 'tingkat', 'status']);
        $prestasi = Prestasi::where('status', 'terverifikasi')->whereBetween('tanggal', [$dari, $sampai])->get(['tanggal', 'tingkat']);
        $rataNilai = Nilai::whereBetween('created_at', [Carbon::parse($dari)->startOfDay(), Carbon::parse($sampai)->endOfDay()])->avg('nilai');

        $bulan = collect();
        foreach ($pelanggaran->pluck('tanggal')->merge($prestasi->pluck('tanggal'))->map(fn ($t) => substr((string) $t, 0, 7))->unique()->sort() as $b) {
            $bulan->push(['bulan' => self::BULAN[(int) substr($b, 5, 2)].' '.substr($b, 0, 4), 'pelanggaran' => $pelanggaran->filter(fn ($p) => str_starts_with((string) $p->tanggal, $b))->count(), 'prestasi' => $prestasi->filter(fn ($p) => str_starts_with((string) $p->tanggal, $b))->count()]);
        }

        return [
            'ringkasan' => [
                $this->stat('Siswa aktif', $siswaAktif->count()), $this->stat('Guru & tendik aktif', Guru::where('status', 'aktif')->count()), $this->stat('Rombel', Kelas::count()),
                $this->stat('Kehadiran siswa', $this->persen($tot($kehadiran, 'hadir'), $tot($kehadiran, 'total')), '%'), $this->stat('Kehadiran guru', $this->persen($tot($guru, 'hadir'), $tot($guru, 'total')), '%'),
                $this->stat('Rata-rata nilai', $rataNilai !== null ? round((float) $rataNilai, 1) : null, 'nilai yang diinput pada periode'), $this->stat('Pelanggaran', $pelanggaran->count()), $this->stat('Prestasi', $prestasi->count(), 'terverifikasi'),
            ],
            'catatan' => ['Ringkasan sekolah pada periode terpilih, dihitung langsung dari data Siswa, Kelas, Kehadiran, Nilai, Pelanggaran, dan Prestasi. Pelanggaran dan prestasi ditampilkan terpisah, tidak digabung menjadi skor.'],
            'tabel' => [
                $this->tabel('kelas', 'Siswa per rombel', [['rombel', 'Rombel'], ['tingkat', 'Tingkat'], ['laki', 'Laki-laki', 'angka'], ['perempuan', 'Perempuan', 'angka'], ['jumlah', 'Jumlah Siswa Aktif', 'angka']],
                    Kelas::orderBy('nama_kelas')->get()->map(function (Kelas $k) use ($perKelas) {
                        $s = $perKelas->get($k->id, collect());

                        return ['rombel' => $k->nama_kelas, 'tingkat' => $k->tingkat ?: '-', 'laki' => $s->where('jenis_kelamin', 'L')->count(), 'perempuan' => $s->where('jenis_kelamin', 'P')->count(), 'jumlah' => $s->count()];
                    })),
                $this->tabel('kehadiran', 'Kehadiran siswa per rombel', [['rombel', 'Rombel'], ['hadir', 'Hadir', 'angka'], ['sakit', 'Sakit', 'angka'], ['izin', 'Izin', 'angka'], ['alpha', 'Alpha', 'angka'], ['persen', '% Hadir', 'persen']],
                    $kehadiran->map(fn ($k) => ['rombel' => $k['kelas'], 'hadir' => $k['hadir'], 'sakit' => $k['sakit'], 'izin' => $k['izin'], 'alpha' => $k['alpha'], 'persen' => $k['persen']])),
                $this->tabel('kesiswaan', 'Pelanggaran dan prestasi per bulan', [['bulan', 'Bulan'], ['pelanggaran', 'Catatan Pelanggaran', 'angka'], ['prestasi', 'Prestasi Terverifikasi', 'angka']], $bulan),
            ],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\PembagianMapel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Monitoring kelengkapan nilai per tahun ajaran & semester. Tidak menyimpan
 * data apa pun: semuanya dihitung dari tabel nilai, siswa, dan penugasan.
 *
 * Satu baris = satu pasangan rombel × mata pelajaran. Guru pengampu diambil
 * dari Pembagian Mata Pelajaran (tahun ajaran + semester); bila tidak ada,
 * dari Jadwal Pelajaran; bila tidak ada, dari guru yang menginput nilai.
 *
 * Kelengkapan dihitung per siswa aktif rombel × komponen nilai wajib
 * (harian, tugas, UTS, UAS — bisa dipilih): satu komponen dianggap terisi
 * bila siswa punya minimal satu nilai berjenis itu. Anggota rombel memakai
 * data siswa saat ini (sistem belum menyimpan riwayat rombel per semester).
 */
class MonitoringNilaiController extends Controller
{
    private const JENIS = ['harian', 'tugas', 'uts', 'uas'];

    private const JENIS_LABEL = ['harian' => 'Harian', 'tugas' => 'Tugas', 'uts' => 'UTS', 'uas' => 'UAS'];

    private const STATUS_LABEL = [
        'lengkap' => 'Lengkap',
        'sebagian' => 'Sebagian',
        'belum' => 'Belum Diinput',
        'tanpa_siswa' => 'Tanpa Siswa',
    ];

    public function opsi(): JsonResponse
    {
        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']),
            'kelas' => Kelas::orderBy('nama_kelas')->get(['id', 'nama_kelas', 'tahun_ajaran']),
            'mata_pelajaran' => MataPelajaran::orderBy('nama_mapel')->get(['id', 'nama_mapel']),
            'guru' => Guru::orderBy('nama')->get(['id', 'nama']),
            'jenis' => collect(self::JENIS_LABEL)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
            'status' => collect(self::STATUS_LABEL)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $hasil = $this->bangun($request);
        $rows = $hasil['rows']->map(fn ($r) => $this->bersih($r))->values();

        return response()->json([
            'konteks' => $hasil['konteks'],
            'ringkasan' => $this->ringkasan($rows),
            'rows' => $rows,
            'rekap_kelas' => $this->rekap($rows, 'kelas'),
            'rekap_mapel' => $this->rekap($rows, 'mata_pelajaran'),
        ]);
    }

    /** Detail nilai per siswa untuk satu rombel × mata pelajaran. */
    public function detail(Request $request): JsonResponse
    {
        $request->validate([
            'kelas_id' => ['required', 'integer', 'exists:kelas,id'],
            'mata_pelajaran_id' => ['required', 'integer', 'exists:mata_pelajaran,id'],
        ]);
        $hasil = $this->bangun($request, true);
        $row = $hasil['rows']->first(fn ($r) => $r['kelas']['id'] === $request->integer('kelas_id') && $r['mata_pelajaran']['id'] === $request->integer('mata_pelajaran_id'));
        if (! $row) {
            throw ValidationException::withMessages(['kelas_id' => 'Rombel tidak termasuk tahun ajaran yang dipilih atau tidak memiliki data untuk mata pelajaran ini.']);
        }

        return response()->json(['konteks' => $hasil['konteks'], 'jenis_wajib' => $hasil['jenis_wajib'], 'ringkasan' => $this->bersih($row), 'siswa' => $row['_siswa']]);
    }

    public function export(Request $request): StreamedResponse
    {
        $hasil = $this->bangun($request, true);
        $rows = $hasil['rows'];
        $ringkas = $rows->map(fn ($r) => $this->bersih($r))->values();
        $konteks = $hasil['konteks'];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Monitoring');
        $sheet->fromArray([["Monitoring Nilai — Tahun Ajaran {$konteks['tahun_ajaran']}, Semester ".ucfirst($konteks['semester'])], ['Komponen wajib: '.implode(', ', array_map(fn ($j) => self::JENIS_LABEL[$j], $hasil['jenis_wajib']))], []], null, 'A1');
        $sheet->fromArray(['Rombel', 'Mata Pelajaran', 'Guru Pengampu', 'Jumlah Siswa', 'Nilai Terinput', 'Belum Diinput', 'Kelengkapan (%)', 'Status', 'Rata-rata', 'Terendah', 'Tertinggi'], null, 'A4');
        $sheet->getStyle('A4:K4')->getFont()->setBold(true);
        $sheet->fromArray($ringkas->map(fn ($r) => [
            $r['kelas']['nama_kelas'], $r['mata_pelajaran']['nama_mapel'], collect($r['guru'])->pluck('nama')->implode(', '), $r['jumlah_siswa'],
            $r['nilai_diinput'], $r['nilai_belum'], $r['persen'], $r['status_label'], $r['rata_rata'], $r['terendah'], $r['tertinggi'],
        ])->all(), null, 'A5');

        $this->sheetRekap($spreadsheet->createSheet(), 'Rekap Kelas', 'Rombel', $this->rekap($ringkas, 'kelas'));
        $this->sheetRekap($spreadsheet->createSheet(), 'Rekap Mapel', 'Mata Pelajaran', $this->rekap($ringkas, 'mata_pelajaran'));

        $kosong = $spreadsheet->createSheet();
        $kosong->setTitle('Nilai Kosong');
        $kosong->fromArray(['Rombel', 'Mata Pelajaran', 'Guru Pengampu', 'NIS', 'Nama Siswa', 'Komponen Belum Ada'], null, 'A1');
        $kosong->getStyle('A1:F1')->getFont()->setBold(true);
        $baris = [];
        foreach ($rows as $r) {
            foreach ($r['_siswa'] as $s) {
                if ($s['kosong']) {
                    $baris[] = [$r['kelas']['nama_kelas'], $r['mata_pelajaran']['nama_mapel'], collect($r['guru'])->pluck('nama')->implode(', '), $s['nis'], $s['nama'], implode(', ', array_map(fn ($j) => self::JENIS_LABEL[$j], $s['kosong']))];
                }
            }
        }
        $kosong->fromArray($baris, null, 'A2');

        foreach ($spreadsheet->getAllSheets() as $ws) {
            foreach (range('A', 'K') as $col) {
                $ws->getColumnDimension($col)->setAutoSize(true);
            }
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(fn () => $writer->save('php://output'), 'monitoring-nilai-'.now()->format('Y-m-d').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function sheetRekap(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, string $judul, string $kolomNama, Collection $rekap): void
    {
        $ws->setTitle($judul);
        $ws->fromArray([$kolomNama, 'Jumlah Baris', 'Lengkap', 'Nilai Terinput', 'Belum Diinput', 'Kelengkapan (%)', 'Rata-rata', 'Terendah', 'Tertinggi'], null, 'A1');
        $ws->getStyle('A1:I1')->getFont()->setBold(true);
        $ws->fromArray($rekap->map(fn ($r) => [$r['nama'], $r['jumlah_baris'], $r['jumlah_lengkap'], $r['nilai_diinput'], $r['nilai_belum'], $r['persen'], $r['rata_rata'], $r['terendah'], $r['tertinggi']])->all(), null, 'A2');
    }

    /**
     * Susun baris monitoring untuk konteks (tahun ajaran, semester) dan filter.
     *
     * @return array{konteks: array, jenis_wajib: list<string>, rows: Collection<int, array>}
     */
    public function bangun(Request $request, bool $denganSiswa = false): array
    {
        $in = $request->validate([
            'tahun_ajaran_id' => ['required', 'integer', 'exists:tahun_ajaran,id'],
            'semester' => ['required', 'in:ganjil,genap'],
            'jenis_wajib' => ['nullable', 'string', 'max:60'],
            'kelas_id' => ['nullable', 'integer'],
            'mata_pelajaran_id' => ['nullable', 'integer'],
            'guru_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:lengkap,sebagian,belum,tanpa_siswa'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $ta = TahunAjaran::findOrFail($in['tahun_ajaran_id']);
        $semester = $in['semester'];
        $jenisWajib = array_values(array_intersect(self::JENIS, array_filter(explode(',', (string) ($in['jenis_wajib'] ?? '')))));
        if ($jenisWajib === []) {
            $jenisWajib = self::JENIS;
        }

        $kelas = Kelas::where(fn ($q) => $q->where('tahun_ajaran', $ta->nama)->orWhere('tahun_ajaran_id', $ta->id))->get(['id', 'nama_kelas'])->keyBy('id');
        $siswaPerKelas = Siswa::whereIn('kelas_id', $kelas->keys())->where('status', 'aktif')->orderBy('nama')->get(['id', 'kelas_id', 'nis', 'nama'])->groupBy('kelas_id');
        $siswaKelas = $siswaPerKelas->flatten(1)->pluck('kelas_id', 'id');

        $nilai = Nilai::where('tahun_ajaran', $ta->nama)->whereRaw('lower(semester) = ?', [$semester])
            ->whereIn('siswa_id', $siswaKelas->keys())->get(['siswa_id', 'mata_pelajaran_id', 'guru_id', 'jenis_nilai', 'nilai']);

        // Pasangan rombel × mapel beserta guru pengampunya.
        $pasangan = [];
        $tambah = function (int $kelasId, int $mapelId, int $guruId, string $sumber) use (&$pasangan) {
            $pasangan["{$kelasId}|{$mapelId}"][$sumber][$guruId] = true;
        };
        PembagianMapel::where('tahun_ajaran_id', $ta->id)->where('semester', $semester)->where('status', '!=', 'nonaktif')
            ->whereIn('kelas_id', $kelas->keys())->get(['kelas_id', 'mata_pelajaran_id', 'guru_id'])
            ->each(fn ($p) => $tambah($p->kelas_id, $p->mata_pelajaran_id, $p->guru_id, 'pembagian'));
        JadwalPelajaran::whereIn('kelas_id', $kelas->keys())->get(['kelas_id', 'mata_pelajaran_id', 'guru_id'])
            ->each(fn ($j) => $tambah($j->kelas_id, $j->mata_pelajaran_id, $j->guru_id, 'jadwal'));
        foreach ($nilai as $n) {
            $tambah((int) $siswaKelas[$n->siswa_id], $n->mata_pelajaran_id, $n->guru_id, 'nilai');
        }

        $mapel = MataPelajaran::pluck('nama_mapel', 'id');
        $guruNama = Guru::pluck('nama', 'id');
        $nilaiPerPasangan = $nilai->groupBy(fn ($n) => $siswaKelas[$n->siswa_id].'|'.$n->mata_pelajaran_id);

        $rows = collect($pasangan)->map(function (array $sumberGuru, string $kunci) use ($kelas, $siswaPerKelas, $nilaiPerPasangan, $mapel, $guruNama, $jenisWajib, $denganSiswa) {
            [$kelasId, $mapelId] = array_map('intval', explode('|', $kunci));
            $sumber = isset($sumberGuru['pembagian']) ? 'pembagian' : (isset($sumberGuru['jadwal']) ? 'jadwal' : 'nilai');
            $guruIds = array_keys($sumberGuru[$sumber]);

            $siswa = $siswaPerKelas->get($kelasId, collect());
            $nilaiRow = $nilaiPerPasangan->get($kunci, collect());
            $perSiswa = $nilaiRow->groupBy('siswa_id');

            $terinput = 0;
            $lengkap = 0;
            $tanpaNilai = 0;
            $detail = [];
            foreach ($siswa as $s) {
                $milik = $perSiswa->get($s->id, collect());
                $punya = $milik->pluck('jenis_nilai')->unique()->all();
                $kosong = array_values(array_diff($jenisWajib, $punya));
                $terinput += count($jenisWajib) - count($kosong);
                if ($kosong === []) {
                    $lengkap++;
                }
                if ($milik->isEmpty()) {
                    $tanpaNilai++;
                }
                if ($denganSiswa) {
                    $detail[] = [
                        'id' => $s->id,
                        'nis' => $s->nis,
                        'nama' => $s->nama,
                        'jenis' => collect(self::JENIS)->mapWithKeys(fn ($j) => [$j => [
                            'jumlah' => $milik->where('jenis_nilai', $j)->count(),
                            'rata_rata' => $milik->where('jenis_nilai', $j)->isEmpty() ? null : round((float) $milik->where('jenis_nilai', $j)->avg('nilai'), 2),
                        ]])->all(),
                        'kosong' => $kosong,
                        'rata_rata' => $milik->isEmpty() ? null : round((float) $milik->avg('nilai'), 2),
                    ];
                }
            }

            $jumlahSiswa = $siswa->count();
            $seharusnya = $jumlahSiswa * count($jenisWajib);
            $status = $jumlahSiswa === 0 ? 'tanpa_siswa' : ($terinput >= $seharusnya ? 'lengkap' : ($terinput === 0 ? 'belum' : 'sebagian'));

            return [
                'kelas' => ['id' => $kelasId, 'nama_kelas' => $kelas[$kelasId]->nama_kelas],
                'mata_pelajaran' => ['id' => $mapelId, 'nama_mapel' => $mapel[$mapelId] ?? '-'],
                'guru' => array_map(fn ($id) => ['id' => $id, 'nama' => $guruNama[$id] ?? '-'], $guruIds),
                'sumber_guru' => $sumber,
                'jumlah_siswa' => $jumlahSiswa,
                'total_seharusnya' => $seharusnya,
                'nilai_diinput' => $terinput,
                'nilai_belum' => $seharusnya - $terinput,
                'persen' => $seharusnya > 0 ? (int) round($terinput / $seharusnya * 100) : null,
                'status' => $status,
                'status_label' => self::STATUS_LABEL[$status],
                'siswa_lengkap' => $lengkap,
                'siswa_belum_lengkap' => $jumlahSiswa - $lengkap,
                'siswa_tanpa_nilai' => $tanpaNilai,
                'jumlah_nilai' => $nilaiRow->count(),
                'total_nilai' => round((float) $nilaiRow->sum('nilai'), 2),
                'rata_rata' => $nilaiRow->isEmpty() ? null : round((float) $nilaiRow->avg('nilai'), 2),
                'terendah' => $nilaiRow->isEmpty() ? null : (float) $nilaiRow->min('nilai'),
                'tertinggi' => $nilaiRow->isEmpty() ? null : (float) $nilaiRow->max('nilai'),
                '_siswa' => $detail,
            ];
        })->values();

        $cari = mb_strtolower(trim((string) ($in['search'] ?? '')));
        $rows = $rows
            ->when(! empty($in['kelas_id']), fn ($c) => $c->filter(fn ($r) => $r['kelas']['id'] === (int) $in['kelas_id']))
            ->when(! empty($in['mata_pelajaran_id']), fn ($c) => $c->filter(fn ($r) => $r['mata_pelajaran']['id'] === (int) $in['mata_pelajaran_id']))
            ->when(! empty($in['guru_id']), fn ($c) => $c->filter(fn ($r) => collect($r['guru'])->contains('id', (int) $in['guru_id'])))
            ->when(! empty($in['status']), fn ($c) => $c->filter(fn ($r) => $r['status'] === $in['status']))
            ->when($cari !== '', fn ($c) => $c->filter(fn ($r) => str_contains(mb_strtolower($r['kelas']['nama_kelas'].' '.$r['mata_pelajaran']['nama_mapel'].' '.collect($r['guru'])->pluck('nama')->implode(' ')), $cari)))
            ->sortBy([fn ($a, $b) => strnatcasecmp($a['kelas']['nama_kelas'], $b['kelas']['nama_kelas']), fn ($a, $b) => strcmp($a['mata_pelajaran']['nama_mapel'], $b['mata_pelajaran']['nama_mapel'])])
            ->values();

        return [
            'konteks' => ['tahun_ajaran_id' => $ta->id, 'tahun_ajaran' => $ta->nama, 'semester' => $semester],
            'jenis_wajib' => $jenisWajib,
            'rows' => $rows,
        ];
    }

    private function ringkasan(Collection $rows): array
    {
        $seharusnya = $rows->sum('total_seharusnya');
        $terinput = $rows->sum('nilai_diinput');

        return [
            'jumlah_baris' => $rows->count(),
            'lengkap' => $rows->where('status', 'lengkap')->count(),
            'sebagian' => $rows->where('status', 'sebagian')->count(),
            'belum' => $rows->where('status', 'belum')->count(),
            'tanpa_siswa' => $rows->where('status', 'tanpa_siswa')->count(),
            'total_seharusnya' => $seharusnya,
            'nilai_diinput' => $terinput,
            'nilai_belum' => $seharusnya - $terinput,
            'persen' => $seharusnya > 0 ? (int) round($terinput / $seharusnya * 100) : null,
        ];
    }

    /** Rekap gabungan per rombel atau per mata pelajaran; rata-rata dibobot jumlah nilai. */
    private function rekap(Collection $rows, string $kunci): Collection
    {
        return $rows->groupBy(fn ($r) => $r[$kunci]['id'])->map(function (Collection $group) use ($kunci) {
            $seharusnya = $group->sum('total_seharusnya');
            $terinput = $group->sum('nilai_diinput');
            $jumlahNilai = $group->sum('jumlah_nilai');

            return [
                'id' => $group->first()[$kunci]['id'],
                'nama' => $group->first()[$kunci][$kunci === 'kelas' ? 'nama_kelas' : 'nama_mapel'],
                'jumlah_baris' => $group->count(),
                'jumlah_lengkap' => $group->where('status', 'lengkap')->count(),
                'total_seharusnya' => $seharusnya,
                'nilai_diinput' => $terinput,
                'nilai_belum' => $seharusnya - $terinput,
                'persen' => $seharusnya > 0 ? (int) round($terinput / $seharusnya * 100) : null,
                'jumlah_nilai' => $jumlahNilai,
                'rata_rata' => $jumlahNilai > 0 ? round($group->sum('total_nilai') / $jumlahNilai, 2) : null,
                'terendah' => $group->pluck('terendah')->filter(fn ($v) => $v !== null)->min(),
                'tertinggi' => $group->pluck('tertinggi')->filter(fn ($v) => $v !== null)->max(),
            ];
        })->sortBy('nama', SORT_NATURAL | SORT_FLAG_CASE)->values();
    }

    /** Buang kunci internal (diawali garis bawah) dari baris monitoring. */
    private function bersih(array $row): array
    {
        return array_filter($row, fn ($k) => ! str_starts_with((string) $k, '_'), ARRAY_FILTER_USE_KEY);
    }
}

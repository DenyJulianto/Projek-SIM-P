<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\EkskulHelpers;
use App\Http\Controllers\Controller;
use App\Models\Ekskul;
use App\Models\EkskulAnggota;
use App\Models\EkskulPenilaian;
use App\Models\EkskulPresensi;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Penilaian ekstrakurikuler. Aspek yang dinilai ditentukan per ekstrakurikuler (tidak harus semua aspek).
 * Nilai akhir = rata-rata aspek (0–100); predikat otomatis dari skala A–D.
 * Alur status: draft → tervalidasi → terkunci (terkunci tidak dapat diubah kecuali dibuka dengan alasan).
 */
class EkskulPenilaianController extends Controller
{
    use EkskulHelpers;

    private const STATUS = ['draft' => 'Draft', 'tervalidasi' => 'Tervalidasi', 'terkunci' => 'Terkunci'];

    public function index(Request $request): JsonResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'search' => ['nullable', 'string', 'max:100']]);

        return response()->json($this->data(Ekskul::findOrFail($in['ekskul_id']), $in['search'] ?? null));
    }

    /** Simpan nilai satu atau beberapa siswa (draft). Siswa terkunci dilewati. */
    public function simpan(Request $request): JsonResponse
    {
        $in = $request->validate([
            'ekskul_id' => ['required', 'integer', 'exists:ekskul,id'],
            'data' => ['required', 'array', 'min:1', 'max:500'],
            'data.*.siswa_id' => ['required', 'integer'],
            'data.*.aspek' => ['nullable', 'array'],
            'data.*.aspek.*' => ['nullable', 'numeric', 'between:0,100'],
            'data.*.deskripsi' => ['nullable', 'string', 'max:2000'],
        ]);
        $e = Ekskul::findOrFail($in['ekskul_id']);
        $aspekEkskul = $this->aspekEkskul($e);
        $anggota = EkskulAnggota::where('ekskul_id', $e->id)->pluck('siswa_id')->flip();
        $nama = Siswa::whereIn('id', collect($in['data'])->pluck('siswa_id'))->pluck('nama', 'id');

        $disimpan = 0;
        $dilewati = [];
        foreach ($in['data'] as $r) {
            $sid = (int) $r['siswa_id'];
            if (! $anggota->has($sid)) {
                $dilewati[] = ['siswa' => $nama[$sid] ?? $sid, 'alasan' => 'Bukan anggota ekstrakurikuler ini.'];

                continue;
            }
            $rec = EkskulPenilaian::where('ekskul_id', $e->id)->where('siswa_id', $sid)->first();
            if ($rec?->status === 'terkunci') {
                $dilewati[] = ['siswa' => $nama[$sid] ?? $sid, 'alasan' => 'Nilai sudah dikunci.'];

                continue;
            }
            $aspek = [];
            foreach ($aspekEkskul as $a) {
                $v = $r['aspek'][$a] ?? null;
                if ($v !== null && $v !== '') {
                    $aspek[$a] = round((float) $v, 2);
                }
            }
            $luar = array_diff(array_keys($r['aspek'] ?? []), $aspekEkskul);
            if ($luar) {
                $dilewati[] = ['siswa' => $nama[$sid] ?? $sid, 'alasan' => 'Aspek tidak dipakai ekstrakurikuler ini: '.implode(', ', $luar).'.'];

                continue;
            }
            $nilai = $aspek ? round(array_sum($aspek) / count($aspek), 2) : null;
            $pred = $this->predikat($nilai);
            $deskripsi = isset($r['deskripsi']) && trim((string) $r['deskripsi']) !== '' ? trim($r['deskripsi']) : null;

            $sebelum = $rec ? ['aspek' => $rec->aspek, 'nilai' => $rec->nilai, 'predikat' => $rec->predikat, 'deskripsi' => $rec->deskripsi, 'status' => $rec->status] : null;
            $sesudah = ['aspek' => $aspek, 'nilai' => $nilai, 'predikat' => $pred[0] ?? null, 'deskripsi' => $deskripsi, 'status' => 'draft'];
            if ($sebelum && $sebelum['aspek'] == $sesudah['aspek'] && (string) $sebelum['deskripsi'] === (string) $sesudah['deskripsi']) {
                continue;
            }
            $model = EkskulPenilaian::updateOrCreate(['ekskul_id' => $e->id, 'siswa_id' => $sid], [
                'aspek' => $aspek ?: null, 'nilai' => $nilai, 'predikat' => $pred[0] ?? null, 'deskripsi' => $deskripsi,
                'status' => 'draft', 'dinilai_oleh' => $request->user()?->id, 'divalidasi_oleh' => null, 'tanggal_validasi' => null,
            ]);
            $this->logEkskul($request, $model, $rec ? 'diubah' : 'dinilai', 'Penilaian '.($nama[$sid] ?? '').' di '.$e->nama.($rec ? ' diubah.' : ' diinput.').($rec && $rec->status === 'tervalidasi' ? ' Validasi dibatalkan.' : ''), ['sebelum' => $sebelum, 'sesudah' => $sesudah]);
            $disimpan++;
        }

        return response()->json(['disimpan' => $disimpan, 'dilewati' => $dilewati, 'message' => "{$disimpan} penilaian disimpan".($dilewati ? ', '.count($dilewati).' dilewati.' : '.')]);
    }

    /** Validasi nilai: aspek yang dipakai ekstrakurikuler harus terisi semua. */
    public function validasi(Request $request): JsonResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'siswa_ids' => ['nullable', 'array'], 'siswa_ids.*' => ['integer']]);
        $e = Ekskul::findOrFail($in['ekskul_id']);
        $aspekEkskul = $this->aspekEkskul($e);
        $nama = Siswa::pluck('nama', 'id');

        $ok = 0;
        $gagal = [];
        foreach ($this->target($e, $in['siswa_ids'] ?? null, 'draft') as $rec) {
            $kurang = array_values(array_diff($aspekEkskul, array_keys($rec->aspek ?? [])));
            if ($kurang) {
                $gagal[] = ['siswa' => $nama[$rec->siswa_id] ?? $rec->siswa_id, 'alasan' => 'Aspek belum diisi: '.implode(', ', $kurang).'.'];

                continue;
            }
            $rec->update(['status' => 'tervalidasi', 'divalidasi_oleh' => $request->user()?->id, 'tanggal_validasi' => now()]);
            $this->logEkskul($request, $rec, 'validasi', 'Nilai '.($nama[$rec->siswa_id] ?? '')." di {$e->nama} divalidasi.", ['sebelum' => ['status' => 'draft'], 'sesudah' => ['status' => 'tervalidasi']]);
            $ok++;
        }

        return response()->json(['berhasil' => $ok, 'gagal' => $gagal, 'message' => "{$ok} nilai divalidasi".($gagal ? ', '.count($gagal).' belum lengkap.' : '.')]);
    }

    public function kunci(Request $request): JsonResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'siswa_ids' => ['nullable', 'array'], 'siswa_ids.*' => ['integer']]);
        $e = Ekskul::findOrFail($in['ekskul_id']);
        $nama = Siswa::pluck('nama', 'id');
        $n = 0;
        foreach ($this->target($e, $in['siswa_ids'] ?? null, 'tervalidasi') as $rec) {
            $rec->update(['status' => 'terkunci', 'dikunci_oleh' => $request->user()?->id, 'tanggal_kunci' => now()]);
            $this->logEkskul($request, $rec, 'kunci', 'Nilai '.($nama[$rec->siswa_id] ?? '')." di {$e->nama} dikunci.", ['sebelum' => ['status' => 'tervalidasi'], 'sesudah' => ['status' => 'terkunci']]);
            $n++;
        }
        if ($n === 0) {
            throw ValidationException::withMessages(['ekskul_id' => 'Tidak ada nilai berstatus tervalidasi yang dapat dikunci. Validasi nilai terlebih dahulu.']);
        }

        return response()->json(['message' => "{$n} nilai dikunci."]);
    }

    public function bukaKunci(Request $request): JsonResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'siswa_ids' => ['nullable', 'array'], 'siswa_ids.*' => ['integer'], 'alasan' => ['required', 'string', 'min:5', 'max:255']]);
        $e = Ekskul::findOrFail($in['ekskul_id']);
        $nama = Siswa::pluck('nama', 'id');
        $n = 0;
        foreach ($this->target($e, $in['siswa_ids'] ?? null, 'terkunci') as $rec) {
            $rec->update(['status' => 'draft', 'dikunci_oleh' => null, 'tanggal_kunci' => null, 'divalidasi_oleh' => null, 'tanggal_validasi' => null]);
            $this->logEkskul($request, $rec, 'buka_kunci', 'Kunci nilai '.($nama[$rec->siswa_id] ?? '')." di {$e->nama} dibuka.", ['sebelum' => ['status' => 'terkunci'], 'sesudah' => ['status' => 'draft'], 'alasan' => $in['alasan']]);
            $n++;
        }
        if ($n === 0) {
            throw ValidationException::withMessages(['ekskul_id' => 'Tidak ada nilai terkunci yang dapat dibuka.']);
        }

        return response()->json(['message' => "{$n} nilai dibuka kuncinya (kembali ke draft dan perlu divalidasi ulang)."]);
    }

    public function riwayat(Request $request): JsonResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id'], 'siswa_id' => ['nullable', 'integer']]);
        $ids = EkskulPenilaian::where('ekskul_id', $in['ekskul_id'])->when(! empty($in['siswa_id']), fn ($q) => $q->where('siswa_id', $in['siswa_id']))->pluck('id');

        return response()->json(
            Activity::where('log_name', self::LOG_EKSKUL)->where('subject_type', EkskulPenilaian::class)->whereIn('subject_id', $ids)
                ->with('causer:id,name')->orderByDesc('created_at')->orderByDesc('id')->limit(200)->get()
                ->map(fn (Activity $a) => ['id' => $a->id, 'event' => $a->event, 'description' => $a->description, 'causer' => $a->causer?->name, 'properties' => $a->properties, 'created_at' => $a->created_at])
        );
    }

    public function export(Request $request): StreamedResponse
    {
        $in = $request->validate(['ekskul_id' => ['required', 'integer', 'exists:ekskul,id']]);
        $e = Ekskul::findOrFail($in['ekskul_id']);
        $d = $this->data($e, null);

        $wb = new Spreadsheet;
        $ws = $wb->getActiveSheet();
        $ws->setTitle('Penilaian');
        $ws->fromArray([["Penilaian Ekstrakurikuler: {$e->nama}"], ['Tahun Ajaran '.$d['ekskul']['tahun_ajaran'].', Semester '.ucfirst($e->semester).' · Pembina: '.($d['ekskul']['pembina'] ?? '-')], []], null, 'A1');
        $kepala = array_merge(['No', 'Nama', 'NIS', 'Kelas', '% Hadir'], $d['aspek'], ['Nilai', 'Predikat', 'Deskripsi', 'Status']);
        $ws->fromArray([$kepala], null, 'A4');
        $ws->getStyle('A1')->getFont()->setBold(true);
        $ws->getStyle('A4:'.\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($kepala)).'4')->getFont()->setBold(true);
        $r = 4;
        foreach ($d['data'] as $i => $b) {
            $r++;
            $ws->fromArray([array_merge([$i + 1, $b['nama'], $b['nis'], $b['rombel'], $b['persen_hadir'] === null ? '-' : $b['persen_hadir'].'%'], array_map(fn ($a) => $b['aspek'][$a] ?? '-', $d['aspek']), [$b['nilai'] ?? '-', $b['predikat'] ?? '-', $b['deskripsi'] ?? '', $b['status_label']])], null, 'A'.$r);
        }
        foreach (range(1, count($kepala)) as $c) {
            $ws->getColumnDimensionByColumn($c)->setAutoSize(true);
        }

        return response()->streamDownload(fn () => (new Xlsx($wb))->save('php://output'), 'penilaian-'.preg_replace('/[^A-Za-z0-9]+/', '-', $e->nama).'.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    // ------------------------------------------------------------- pembantu

    private function aspekEkskul(Ekskul $e): array
    {
        return array_values($e->aspek_penilaian ?: self::ASPEK_BAWAAN);
    }

    /** @return \Illuminate\Support\Collection<int, EkskulPenilaian> */
    private function target(Ekskul $e, ?array $siswaIds, string $status)
    {
        return EkskulPenilaian::where('ekskul_id', $e->id)->where('status', $status)->when($siswaIds, fn ($q) => $q->whereIn('siswa_id', $siswaIds))->get();
    }

    private function data(Ekskul $e, ?string $cari): array
    {
        $anggota = EkskulAnggota::where('ekskul_id', $e->id)->orderByDesc('id')->get()->unique('siswa_id')->keyBy('siswa_id');
        $siswa = Siswa::with('kelas:id,nama_kelas,tingkat')->whereIn('id', $anggota->keys())
            ->when($cari, fn ($q) => $q->where(fn ($w) => $w->where('nama', 'like', '%'.$cari.'%')->orWhere('nis', 'like', '%'.$cari.'%')))->orderBy('nama')->get();
        $nilai = EkskulPenilaian::where('ekskul_id', $e->id)->get()->keyBy('siswa_id');
        $presensi = EkskulPresensi::query()->join('ekskul_kegiatan as k', 'k.id', '=', 'ekskul_presensi.kegiatan_id')->where('k.ekskul_id', $e->id)->where('k.status', '!=', 'dibatalkan')
            ->selectRaw('ekskul_presensi.siswa_id, count(*) as n, sum(case when ekskul_presensi.status = ? then 1 else 0 end) as hadir', ['hadir'])->groupBy('ekskul_presensi.siswa_id')->get()->keyBy('siswa_id');

        $baris = $siswa->map(function (Siswa $s) use ($nilai, $presensi, $anggota) {
            $n = $nilai[$s->id] ?? null;
            $p = $presensi[$s->id] ?? null;

            return [
                'siswa_id' => $s->id, 'nama' => $s->nama, 'nis' => $s->nis, 'kelas' => $s->kelas?->tingkat, 'rombel' => $s->kelas?->nama_kelas,
                'keanggotaan' => $anggota[$s->id]->status, 'persen_hadir' => $p && $p->n > 0 ? (int) round($p->hadir / $p->n * 100) : null,
                'aspek' => $n?->aspek ?? (object) [], 'nilai' => $n?->nilai, 'predikat' => $n?->predikat, 'predikat_label' => $n?->predikat ? $this->predikat((float) $n->nilai)[1] : null,
                'deskripsi' => $n?->deskripsi, 'status' => $n?->status ?? 'belum', 'status_label' => $n ? self::STATUS[$n->status] : 'Belum dinilai',
            ];
        })->values();

        return [
            'ekskul' => ['id' => $e->id, 'nama' => $e->nama, 'semester' => $e->semester, 'tahun_ajaran' => TahunAjaran::whereKey($e->tahun_ajaran_id)->value('nama'), 'pembina' => $e->pembina_guru_id ? \App\Models\Guru::whereKey($e->pembina_guru_id)->value('nama') : null],
            'aspek' => $this->aspekEkskul($e),
            'ringkasan' => [
                'peserta' => $baris->count(), 'belum' => $baris->where('status', 'belum')->count(), 'draft' => $baris->where('status', 'draft')->count(),
                'tervalidasi' => $baris->where('status', 'tervalidasi')->count(), 'terkunci' => $baris->where('status', 'terkunci')->count(),
                'rata_rata' => $baris->whereNotNull('nilai')->isEmpty() ? null : round((float) $baris->whereNotNull('nilai')->avg('nilai'), 2),
                'distribusi' => collect(['A', 'B', 'C', 'D'])->mapWithKeys(fn ($p) => [$p => $baris->where('predikat', $p)->count()])->all(),
            ],
            'data' => $baris->all(),
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\CapaianPembelajaran;
use App\Models\DokumenPendukung;
use App\Models\Guru;
use App\Models\JadwalPelajaran;
use App\Models\Kelas;
use App\Models\ModulAjar;
use App\Models\TahunAjaran;
use App\Support\DokumenPendukungCetak;
use App\Support\HtmlAman;
use App\Support\StrukturDokumenPendukung;
use App\Support\StrukturPerangkatAjar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Dokumen pendukung modul ajar milik guru: Silabus, Pemetaan ATP, dan Jurnal
 * Harian per kelas, mata pelajaran, dan semester. Isian bisa diambil dari
 * Modul Ajar guru (CP, TP, ATP, pertemuan) atau dari data CP/TP Kurikulum,
 * lalu diunduh sebagai PDF/Word.
 */
class DokumenPendukungController extends Controller
{
    private function guruFor(Request $request): Guru
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 403, 'Akun ini tidak tertaut ke profil guru.');

        return $guru;
    }

    private function milik(Request $request, DokumenPendukung $dokumen): DokumenPendukung
    {
        abort_unless($dokumen->guru_id === $this->guruFor($request)->id, 403);

        return $dokumen;
    }

    public function index(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        return response()->json(
            DokumenPendukung::where('guru_id', $guru->id)
                ->when($request->filled('jenis'), fn ($q) => $q->where('jenis', $request->string('jenis')))
                ->with(['tahunAjaran:id,nama', 'kelas:id,nama_kelas,tingkat', 'mataPelajaran:id,nama_mapel'])
                ->orderByDesc('updated_at')
                ->get()
                ->map(fn (DokumenPendukung $d) => [...$d->toArray(), 'jumlah_baris' => count($d->data['baris'] ?? [])])
        );
    }

    /** Pilihan form: tahun ajaran (aktif terpilih) dan kelas/mapel yang diajar. */
    public function opsi(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);

        return response()->json([
            'tahun_ajaran' => TahunAjaran::orderByDesc('nama')->get(['id', 'nama', 'is_active']),
            'tahun_ajaran_aktif' => TahunAjaran::where('is_active', true)->value('id'),
            'mengajar' => JadwalPelajaran::mengajarGuru($guru->id),
            'profil_pelajar' => StrukturPerangkatAjar::PROFIL_PELAJAR,
            'jenis' => StrukturDokumenPendukung::JENIS,
        ]);
    }

    public function show(Request $request, DokumenPendukung $dokumen): JsonResponse
    {
        return response()->json($this->muat($this->milik($request, $dokumen)));
    }

    public function store(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);
        $dokumen = new DokumenPendukung;
        $dokumen->guru_id = $guru->id;
        $this->isi($request, $guru, $dokumen)->save();

        return response()->json($this->muat($dokumen), 201);
    }

    public function update(Request $request, DokumenPendukung $dokumen): JsonResponse
    {
        $guru = $this->guruFor($request);
        $this->milik($request, $dokumen);
        $this->isi($request, $guru, $dokumen)->save();

        return response()->json($this->muat($dokumen));
    }

    public function destroy(Request $request, DokumenPendukung $dokumen): JsonResponse
    {
        $this->milik($request, $dokumen)->delete();

        return response()->json(['message' => 'Dokumen dihapus.']);
    }

    public function unduh(Request $request, DokumenPendukung $dokumen, string $format): Response
    {
        $this->milik($request, $dokumen);

        return (new DokumenPendukungCetak($dokumen->load(['guru', 'tahunAjaran', 'kelas', 'mataPelajaran'])))->respons($format);
    }

    /**
     * Usulan isian dari Modul Ajar Kurikulum Merdeka milik guru untuk kelas,
     * mapel, dan semester yang sama; bila belum ada modul, dari CP/TP
     * Kurikulum. Form menggabungkan atau mengganti isian dengan hasil ini.
     */
    public function sumber(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);
        $q = $request->validate([
            'jenis' => ['required', Rule::in(array_keys(StrukturDokumenPendukung::JENIS))],
            'kelas_id' => ['required', 'integer'],
            'mata_pelajaran_id' => ['required', 'integer'],
            'semester' => ['required', 'in:ganjil,genap'],
        ]);
        abort_unless(JadwalPelajaran::diajarOleh($guru->id, (int) $q['kelas_id'], (int) $q['mata_pelajaran_id']), 422, 'Kelas dan mata pelajaran ini tidak ada di jadwal mengajar Anda.');

        $modul = ModulAjar::where('guru_id', $guru->id)
            ->where('kurikulum', 'merdeka')
            ->where('kelas_id', $q['kelas_id'])
            ->where('mata_pelajaran_id', $q['mata_pelajaran_id'])
            ->orderBy('created_at')->orderBy('id')
            ->get()
            ->filter(fn (ModulAjar $m) => in_array(strtolower((string) ($m->data['semester'] ?? '')), ['', $q['semester']], true))
            ->values();

        if ($modul->isNotEmpty()) {
            $data = match ($q['jenis']) {
                'silabus' => $this->silabusDariModul($modul),
                'pemetaan_atp' => $this->pemetaanDariModul($modul),
                'jurnal' => $this->jurnalDariModul($modul),
            };
            $asal = 'Diambil dari '.$modul->count().' modul ajar Anda untuk kelas dan mata pelajaran ini.';
        } else {
            $kelas = Kelas::find($q['kelas_id']);
            $cp = CapaianPembelajaran::where('mata_pelajaran_id', $q['mata_pelajaran_id'])
                ->where('fase', StrukturPerangkatAjar::faseDariTingkat($kelas?->tingkat))
                ->where('status', 'aktif')
                ->with(['tujuanPembelajaran' => fn ($t) => $t->where('status', 'aktif')->where('semester', $q['semester'])
                    ->when($kelas?->tingkat, fn ($t, $tingkat) => $t->where('tingkat', $tingkat))
                    ->orderBy('urutan')])
                ->orderBy('elemen')
                ->get();
            $data = $this->dariMaster($q['jenis'], $cp);
            $asal = $data['baris']
                ? 'Belum ada modul ajar untuk kelas ini; diambil dari CP/TP yang disusun Kurikulum.'
                : null;
        }

        return response()->json([
            'data' => StrukturDokumenPendukung::bersihkan($q['jenis'], $data),
            'asal' => $asal ?? 'Belum ada modul ajar maupun CP/TP Kurikulum untuk kelas, mata pelajaran, dan semester ini.',
        ]);
    }

    /** Rekap absensi harian kelas pada tanggal-tanggal jurnal (hadir vs. tidak hadir). */
    public function kehadiran(Request $request): JsonResponse
    {
        $guru = $this->guruFor($request);
        $q = $request->validate([
            'kelas_id' => ['required', 'integer'],
            'tanggal' => ['required', 'array', 'max:200'],
            'tanggal.*' => ['date_format:Y-m-d'],
        ]);
        abort_unless(JadwalPelajaran::where('guru_id', $guru->id)->where('kelas_id', $q['kelas_id'])->exists(), 403);

        $rekap = Absensi::where('kelas_id', $q['kelas_id'])
            // Kolom tanggal bisa tersimpan beserta jam (cast date Eloquent).
            ->whereIn(DB::raw('date(tanggal)'), $q['tanggal'])
            ->get(['tanggal', 'status'])
            ->groupBy(fn ($a) => $a->tanggal->format('Y-m-d'))
            ->map(fn ($g) => [
                'hadir' => $g->where('status', 'hadir')->count(),
                'tidak_hadir' => $g->where('status', '!=', 'hadir')->count(),
            ]);

        return response()->json($rekap);
    }

    private function isi(Request $request, Guru $guru, DokumenPendukung $dokumen): DokumenPendukung
    {
        $v = $request->validate([
            'jenis' => [$dokumen->exists ? 'nullable' : 'required', Rule::in(array_keys(StrukturDokumenPendukung::JENIS))],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajaran,id'],
            'kelas_id' => ['required', 'integer'],
            'mata_pelajaran_id' => ['required', 'integer'],
            'semester' => ['required', 'in:ganjil,genap'],
            'data' => ['present', 'array'],
        ], [
            'tahun_ajaran_id.required' => 'Pilih tahun ajaran.',
            'kelas_id.required' => 'Pilih kelas.',
            'mata_pelajaran_id.required' => 'Pilih mata pelajaran.',
        ]);
        $jenis = $dokumen->exists ? $dokumen->jenis : $v['jenis'];

        if (! JadwalPelajaran::diajarOleh($guru->id, (int) $v['kelas_id'], (int) $v['mata_pelajaran_id'])) {
            throw ValidationException::withMessages(['kelas_id' => 'Pilih kelas dan mata pelajaran sesuai jadwal mengajar Anda.']);
        }

        $ganda = DokumenPendukung::where('guru_id', $guru->id)
            ->where('jenis', $jenis)
            ->where('tahun_ajaran_id', $v['tahun_ajaran_id'])
            ->where('kelas_id', $v['kelas_id'])
            ->where('mata_pelajaran_id', $v['mata_pelajaran_id'])
            ->where('semester', $v['semester'])
            ->when($dokumen->exists, fn ($q) => $q->whereKeyNot($dokumen->id))
            ->exists();
        if ($ganda) {
            throw ValidationException::withMessages(['kelas_id' => StrukturDokumenPendukung::JENIS[$jenis].' untuk kelas, mata pelajaran, semester, dan tahun ajaran ini sudah ada. Buka dokumen tersebut untuk mengubahnya.']);
        }

        $dokumen->fill([
            'jenis' => $jenis,
            'tahun_ajaran_id' => $v['tahun_ajaran_id'],
            'kelas_id' => $v['kelas_id'],
            'mata_pelajaran_id' => $v['mata_pelajaran_id'],
            'semester' => $v['semester'],
            // Isi `data` diambil utuh lalu dibersihkan sesuai struktur jenisnya.
            'data' => StrukturDokumenPendukung::bersihkan($jenis, (array) $request->input('data', [])),
        ]);

        return $dokumen;
    }

    private function muat(DokumenPendukung $dokumen): DokumenPendukung
    {
        return $dokumen->fresh(['tahunAjaran:id,nama', 'kelas:id,nama_kelas,tingkat', 'mataPelajaran:id,nama_mapel']);
    }

    /* --------------------------- usulan dari modul ajar --------------------------- */

    /** Satu baris silabus per modul ajar (satu topik/unit). */
    private function silabusDariModul(Collection $modul): array
    {
        $baris = [];
        foreach ($modul as $m) {
            $d = $m->data ?? [];
            $cp = collect($d['cp'] ?? []);
            $tp = array_values(array_filter(array_map(fn ($t) => $t['deskripsi'] ?? null, $d['tp_master'] ?? [])));
            $pertemuan = array_values(array_filter(array_map(
                fn ($p, $i) => filled($p['topik'] ?? null) ? 'Pertemuan '.($i + 1).': '.$p['topik'] : null,
                $d['pertemuan'] ?? [], array_keys($d['pertemuan'] ?? []),
            )));
            $metode = implode(', ', array_filter([...((array) ($d['metode'] ?? [])), $d['metode_lain'] ?? null]));
            $alokasi = $d['alokasi'] ?? [];

            $baris[] = [
                'elemen' => $cp->pluck('elemen')->filter()->unique()->implode(', '),
                'cp' => $cp->pluck('deskripsi')->filter()->implode("\n"),
                'tp' => $this->bernomor($tp),
                'profil' => (array) ($d['profil_pelajar'] ?? []),
                'materi' => implode("\n", array_filter([
                    filled($d['bab_tema'] ?? null) ? $d['bab_tema'] : $m->judul,
                    Str::limit(HtmlAman::teksPolos($d['materi_inti'] ?? ''), 400),
                ])),
                'kegiatan' => implode("\n", array_filter([
                    filled($d['model_pembelajaran'] ?? null) ? 'Model: '.$d['model_pembelajaran'] : null,
                    $metode !== '' ? 'Metode: '.$metode : null,
                    ...$pertemuan,
                ])),
                'asesmen' => implode("\n", array_filter([
                    $this->ringkasAsesmen('Diagnostik', $d['asesmen_diagnostik'] ?? ''),
                    $this->ringkasAsesmen('Formatif', $d['asesmen_formatif'] ?? ''),
                    $this->ringkasAsesmen('Sumatif', $d['asesmen_sumatif'] ?? ''),
                ])),
                'alokasi' => ($alokasi['pertemuan'] ?? null) && ($alokasi['jp'] ?? null)
                    ? ($alokasi['pertemuan'] * $alokasi['jp']).' JP ('.$alokasi['pertemuan'].' pertemuan)'
                    : (string) ($d['alokasi_waktu'] ?? ''),
                'media' => Str::limit(HtmlAman::teksPolos($d['sarana_prasarana'] ?? ''), 400),
            ];
        }

        $cpUmum = $modul->map(fn ($m) => HtmlAman::teksPolos($m->data['cp_umum'] ?? ''))->first(fn ($t) => $t !== '');

        return ['cp_umum' => $cpUmum ?? '', 'baris' => $baris];
    }

    /**
     * Satu baris per ATP; nomor pertemuan dari keterangan waktu ATP
     * ("Pertemuan 2", "Minggu 1") dan berlanjut dari modul sebelumnya.
     */
    private function pemetaanDariModul(Collection $modul): array
    {
        $baris = [];
        $geser = 0;
        foreach ($modul as $m) {
            $d = $m->data ?? [];
            $jumlah = max(1, count($d['pertemuan'] ?? []), (int) ($d['alokasi']['pertemuan'] ?? 0));
            $tp = $this->bernomor(array_values(array_filter(array_map(fn ($t) => $t['deskripsi'] ?? null, $d['tp_master'] ?? []))));
            $elemen = collect($d['cp'] ?? [])->pluck('elemen')->filter()->unique()->implode(', ');
            $pertama = true;
            foreach (StrukturPerangkatAjar::atpLengkap($d) as $a) {
                $n = preg_match('/\d+/', (string) ($a['waktu'] ?? ''), $cocok) ? (int) $cocok[0] : null;
                if ($n) {
                    $jumlah = max($jumlah, $n);
                }
                $baris[] = [
                    'elemen' => $pertama ? $elemen : '',
                    'tp' => $pertama ? $tp : '',
                    'atp' => StrukturPerangkatAjar::kalimatAtp($a['kegiatan'], $a['kemampuan']),
                    'alokasi_jp' => $d['alokasi']['jp'] ?? null,
                    'pertemuan' => $n ? [$geser + $n] : [],
                ];
                $pertama = false;
            }
            $geser += $jumlah;
        }

        return ['jumlah_pertemuan' => max(1, $geser), 'baris' => $baris];
    }

    /** Satu baris jurnal per pertemuan modul ajar; tanggal & kehadiran diisi guru saat pelaksanaan. */
    private function jurnalDariModul(Collection $modul): array
    {
        $baris = [];
        $ke = 0;
        foreach ($modul as $m) {
            $d = $m->data ?? [];
            $atp = [];
            foreach (StrukturPerangkatAjar::atpLengkap($d) as $a) {
                $n = preg_match('/\d+/', (string) ($a['waktu'] ?? ''), $cocok) ? (int) $cocok[0] : 0;
                $atp[$n][] = StrukturPerangkatAjar::kalimatAtp($a['kegiatan'], $a['kemampuan']);
            }
            $formatif = Str::limit(HtmlAman::teksPolos($d['asesmen_formatif'] ?? ''), 200);
            foreach ($d['pertemuan'] ?? [] as $i => $p) {
                $baris[] = [
                    'tanggal' => null,
                    'pertemuan_ke' => ++$ke,
                    'atp' => implode("\n", $atp[$i + 1] ?? []),
                    'materi' => filled($p['topik'] ?? null) ? $p['topik'] : $m->judul,
                    'asesmen' => $formatif !== '' ? 'Formatif: '.$formatif : '',
                ];
            }
        }

        return ['baris' => $baris];
    }

    /** Usulan dari CP/TP Kurikulum bila guru belum punya modul ajar. */
    private function dariMaster(string $jenis, Collection $cp): array
    {
        $baris = [];
        foreach ($cp as $c) {
            $tp = $c->tujuanPembelajaran;
            if ($tp->isEmpty()) {
                continue;
            }
            if ($jenis === 'silabus') {
                $baris[] = ['elemen' => $c->elemen, 'cp' => $c->deskripsi, 'tp' => $this->bernomor($tp->pluck('deskripsi')->all()), 'alokasi' => $tp->sum('alokasi_waktu') ? $tp->sum('alokasi_waktu').' JP' : ''];

                continue;
            }
            foreach ($tp as $t) {
                $baris[] = match ($jenis) {
                    'pemetaan_atp' => ['elemen' => $c->elemen, 'tp' => $t->deskripsi, 'atp' => '', 'alokasi_jp' => $t->alokasi_waktu],
                    'jurnal' => ['atp' => $t->deskripsi, 'materi' => (string) ($t->materi_terkait ?? '')],
                };
            }
        }

        return match ($jenis) {
            'silabus' => ['cp_umum' => '', 'baris' => $baris],
            'pemetaan_atp' => ['jumlah_pertemuan' => max(1, count($baris)), 'baris' => $baris],
            'jurnal' => ['baris' => array_map(fn ($b, $i) => $b + ['pertemuan_ke' => $i + 1], $baris, array_keys($baris))],
        };
    }

    private function bernomor(array $daftar): string
    {
        return count($daftar) <= 1
            ? (string) ($daftar[0] ?? '')
            : implode("\n", array_map(fn ($t, $i) => ($i + 1).'. '.$t, $daftar, array_keys($daftar)));
    }

    private function ringkasAsesmen(string $label, string $html): ?string
    {
        $teks = Str::limit(HtmlAman::teksPolos($html), 200);

        return $teks !== '' ? "{$label}: {$teks}" : null;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CapaianPembelajaran;
use App\Models\KkmKktp;
use App\Models\MataPelajaran;
use App\Models\ProgramSemester;
use App\Models\ProgramTahunan;
use App\Models\StrukturKurikulum;
use App\Models\TahunAjaran;
use App\Models\TujuanPembelajaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Ringkasan untuk Dashboard Kurikulum: seluruh angka dihitung dari data
 * asli yang sudah ada (Mata Pelajaran, Struktur Kurikulum, Capaian
 * Pembelajaran, Tujuan Pembelajaran, KKM/KKTP, Program Semester, Program
 * Tahunan) — bukan angka contoh. Modul yang belum dibangun ditandai
 * eksplisit lewat modul_belum_tersedia, bukan diisi status palsu.
 */
class KurikulumDashboardController extends Controller
{
    private const MODUL_TERSEDIA = ['struktur-kurikulum', 'capaian-pembelajaran', 'tujuan-pembelajaran'];

    /**
     * Daftar tahun ajaran read-only untuk form-form Kurikulum. Resource
     * /tahun-ajaran khusus admin (pengguna.manage), jadi role Kurikulum
     * butuh lookup sendiri untuk memilih tahun ajaran.
     */
    public function tahunAjaran(): JsonResponse
    {
        return response()->json(TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']));
    }

    public function summary(Request $request): JsonResponse
    {
        $tahunAjaranOptions = TahunAjaran::orderByDesc('id')->get(['id', 'nama', 'is_active']);
        $tahunAjaranId = $request->integer('tahun_ajaran_id') ?: null;
        if (! $tahunAjaranId || ! $tahunAjaranOptions->contains('id', $tahunAjaranId)) {
            $tahunAjaranId = $tahunAjaranOptions->firstWhere('is_active', true)?->id ?? $tahunAjaranOptions->first()?->id;
        }

        $semester = $request->filled('semester') ? $request->string('semester')->value() : null;

        $struktur = StrukturKurikulum::when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))->get(['is_aktif']);
        $kkm = KkmKktp::when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))->get(['status']);
        $cp = CapaianPembelajaran::when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))->get(['status']);

        $tpQuery = TujuanPembelajaran::whereHas(
            'capaianPembelajaran',
            fn ($q) => $q->when($tahunAjaranId, fn ($qq) => $qq->where('tahun_ajaran_id', $tahunAjaranId))
        )->when($semester, fn ($q) => $q->where('semester', $semester));

        $tpByProgres = $tpQuery->get(['progres'])->countBy('progres');
        $totalTp = $tpByProgres->sum();

        $kelompokDistribusi = MataPelajaran::get(['kelompok'])
            ->countBy(fn (MataPelajaran $m) => $m->kelompok ?: 'Belum Dikelompokkan')
            ->sortDesc()
            ->map(fn ($jumlah, $kelompok) => ['kelompok' => $kelompok, 'jumlah' => $jumlah])
            ->values();

        $dokumenTerbaru = collect()
            ->concat(
                StrukturKurikulum::with('tahunAjaran:id,nama')
                    ->when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
                    ->latest('updated_at')->limit(5)->get()
                    ->map(fn (StrukturKurikulum $s) => [
                        'jenis' => 'Struktur Kurikulum',
                        'label' => 'Tingkat '.$s->tingkat.($s->fase ? " Fase {$s->fase}" : ''),
                        'tahun_ajaran' => $s->tahunAjaran?->nama,
                        'status' => $s->is_aktif ? 'aktif' : 'draft',
                        'updated_at' => $s->updated_at,
                    ])
            )
            ->concat(
                CapaianPembelajaran::with('mataPelajaran:id,nama_mapel')
                    ->when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
                    ->latest('updated_at')->limit(5)->get()
                    ->map(fn (CapaianPembelajaran $c) => [
                        'jenis' => 'Capaian Pembelajaran',
                        'label' => ($c->mataPelajaran?->nama_mapel ?? '-')." — Fase {$c->fase}",
                        'tahun_ajaran' => null,
                        'status' => $c->status,
                        'updated_at' => $c->updated_at,
                    ])
            )
            ->concat(
                TujuanPembelajaran::with('capaianPembelajaran.mataPelajaran:id,nama_mapel')
                    ->whereHas('capaianPembelajaran', fn ($q) => $q->when($tahunAjaranId, fn ($qq) => $qq->where('tahun_ajaran_id', $tahunAjaranId)))
                    ->latest('updated_at')->limit(5)->get()
                    ->map(fn (TujuanPembelajaran $t) => [
                        'jenis' => 'Tujuan Pembelajaran',
                        'label' => ($t->capaianPembelajaran?->mataPelajaran?->nama_mapel ?? '-')." — Tingkat {$t->tingkat}",
                        'tahun_ajaran' => null,
                        'status' => $t->status,
                        'updated_at' => $t->updated_at,
                    ])
            )
            ->sortByDesc('updated_at')
            ->take(6)
            ->values();

        $moduleBelumTersedia = [];

        return response()->json([
            'tahun_ajaran_options' => $tahunAjaranOptions,
            'tahun_ajaran_id' => $tahunAjaranId,
            'semester' => $semester,
            'jenjang' => tenant()->jenjang,
            'total_mata_pelajaran' => MataPelajaran::count(),
            'struktur_kurikulum' => [
                'total' => $struktur->count(),
                'aktif' => $struktur->where('is_aktif', true)->count(),
            ],
            'program_tahunan' => [
                'total' => ProgramTahunan::when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))->count(),
            ],
            'program_semester' => [
                'total' => ProgramSemester::when($tahunAjaranId, fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaranId))
                    ->when($semester, fn ($q) => $q->where('semester', $semester))
                    ->count(),
            ],
            'kkm_kktp' => [
                'total' => $kkm->count(),
                'aktif' => $kkm->where('status', 'aktif')->count(),
            ],
            'capaian_pembelajaran' => [
                'total' => $cp->count(),
                'aktif' => $cp->where('status', 'aktif')->count(),
                'draft' => $cp->where('status', 'draft')->count(),
            ],
            'tujuan_pembelajaran' => [
                'total' => $totalTp,
                'selesai' => $tpByProgres->get('selesai', 0),
                'berlangsung' => $tpByProgres->get('berlangsung', 0),
                'belum_diajarkan' => $tpByProgres->get('belum_diajarkan', 0),
                'persen_selesai' => $totalTp > 0 ? round(($tpByProgres->get('selesai', 0) / $totalTp) * 100) : 0,
            ],
            'distribusi_kelompok_mapel' => $kelompokDistribusi,
            'dokumen_terbaru' => $dokumenTerbaru,
            'modul_belum_tersedia' => collect($moduleBelumTersedia)->map(fn ($m) => ['key' => $m[0], 'label' => $m[1]])->values(),
        ]);
    }
}

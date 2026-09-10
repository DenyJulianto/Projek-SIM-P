<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class RaporController extends Controller
{
    public function show(Request $request, Siswa $siswa): Response
    {
        $data = $request->validate([
            'semester' => ['required', 'string', 'max:10'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
        ]);

        $this->authorizeAccess($request, $siswa);

        $nilai = $siswa->nilai()
            ->with('mataPelajaran')
            ->where('semester', $data['semester'])
            ->where('tahun_ajaran', $data['tahun_ajaran'])
            ->get()
            ->groupBy('mata_pelajaran_id')
            ->map(function ($items) {
                return [
                    'mata_pelajaran' => $items->first()->mataPelajaran->nama_mapel,
                    'rata_rata' => round($items->avg('nilai'), 2),
                    'rincian' => $items->pluck('nilai', 'jenis_nilai'),
                ];
            })
            ->values();

        $rekapAbsensi = $siswa->absensi()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $pdf = Pdf::loadView('rapor.pdf', [
            'siswa' => $siswa->load('kelas'),
            'nilai' => $nilai,
            'rekapAbsensi' => $rekapAbsensi,
            'semester' => $data['semester'],
            'tahunAjaran' => $data['tahun_ajaran'],
        ]);

        $tahunAjaranSlug = str_replace('/', '-', $data['tahun_ajaran']);

        return $pdf->download("rapor-{$siswa->nis}-{$data['semester']}-{$tahunAjaranSlug}.pdf");
    }

    private function authorizeAccess(Request $request, Siswa $siswa): void
    {
        $user = $request->user();

        $isStaff = $user->can('rapor.publish') || $user->can('rapor-kelas.manage') || $user->can('rapor.approve');
        $isOwnStudent = $siswa->user_id === $user->id;
        $isParent = $siswa->walis()->where('user_id', $user->id)->exists();

        Gate::allowIf(fn () => $isStaff || $isOwnStudent || $isParent);
    }
}

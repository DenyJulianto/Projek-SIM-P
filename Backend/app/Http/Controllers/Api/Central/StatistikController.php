<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\GuruDirectory;
use App\Models\Central\SiswaDirectory;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Statistik & analitik nasional untuk Super Admin: jumlah sekolah/guru/
 * siswa per wilayah, distribusi jenjang, rasio guru-siswa, dan data sebaran
 * lokasi sekolah untuk peta. Semua dihitung langsung dari tabel central
 * (tenants + guru_direktori_nasional + siswa_direktori_nasional) — beda
 * dengan fitur Audit/Sinkronisasi yang harus membuka tiap database tenant,
 * di sini datanya sudah tersedia sebagai salinan central (lihat
 * GuruObserver/SiswaObserver), jadi tidak perlu $sekolah->run() sama sekali.
 */
class StatistikController extends Controller
{
    public function ringkasan(): JsonResponse
    {
        $totalGuru = GuruDirectory::count();
        $totalSiswa = SiswaDirectory::count();

        return response()->json([
            'total_sekolah' => Sekolah::count(),
            'total_guru' => $totalGuru,
            'total_siswa' => $totalSiswa,
            'jumlah_provinsi' => Sekolah::whereNotNull('provinsi')->where('provinsi', '!=', '')->distinct()->count('provinsi'),
            'rasio_nasional' => $totalGuru > 0 ? round($totalSiswa / $totalGuru, 1) : null,
        ]);
    }

    /**
     * Jumlah sekolah/guru/siswa per provinsi, atau per kabupaten/kota kalau
     * ?group_by=kabupaten_kota (opsional disaring ke satu ?provinsi= untuk
     * "drill-down" dari tabel provinsi ke kabupaten/kota di dalamnya).
     */
    public function wilayah(Request $request): JsonResponse
    {
        $groupBy = $request->string('group_by', 'provinsi')->value();
        $column = $groupBy === 'kabupaten_kota' ? 'kabupaten_kota' : 'provinsi';
        $provinsiFilter = $groupBy === 'kabupaten_kota' ? $request->string('provinsi')->value() : '';

        $sekolahCounts = Sekolah::query()
            ->when($provinsiFilter !== '', fn ($q) => $q->where('provinsi', $provinsiFilter))
            ->selectRaw("COALESCE({$column}, 'Tidak diketahui') as wilayah, COUNT(*) as jumlah")
            ->groupBy('wilayah')
            ->pluck('jumlah', 'wilayah');

        $guruCounts = GuruDirectory::query()
            ->join('tenants', 'tenants.id', '=', 'guru_direktori_nasional.sekolah_id')
            ->when($provinsiFilter !== '', fn ($q) => $q->where('tenants.provinsi', $provinsiFilter))
            ->selectRaw("COALESCE(tenants.{$column}, 'Tidak diketahui') as wilayah, COUNT(*) as jumlah")
            ->groupBy('wilayah')
            ->pluck('jumlah', 'wilayah');

        $siswaCounts = SiswaDirectory::query()
            ->join('tenants', 'tenants.id', '=', 'siswa_direktori_nasional.sekolah_id')
            ->when($provinsiFilter !== '', fn ($q) => $q->where('tenants.provinsi', $provinsiFilter))
            ->selectRaw("COALESCE(tenants.{$column}, 'Tidak diketahui') as wilayah, COUNT(*) as jumlah")
            ->groupBy('wilayah')
            ->pluck('jumlah', 'wilayah');

        $rows = $this->mergeCounts($sekolahCounts, $guruCounts, $siswaCounts, 'wilayah');

        return response()->json($rows);
    }

    /**
     * Distribusi sekolah/guru/siswa per jenjang pendidikan (SD/SMP/SMA/SMK,
     * dst.) — sekolah yang belum mengisi jenjang dikelompokkan sebagai
     * "Belum diisi" supaya tetap ikut terhitung, bukan hilang dari laporan.
     */
    public function jenjang(): JsonResponse
    {
        $sekolahCounts = Sekolah::query()
            ->selectRaw("COALESCE(jenjang, 'Belum diisi') as jenjang, COUNT(*) as jumlah")
            ->groupBy('jenjang')
            ->pluck('jumlah', 'jenjang');

        $guruCounts = GuruDirectory::query()
            ->join('tenants', 'tenants.id', '=', 'guru_direktori_nasional.sekolah_id')
            ->selectRaw("COALESCE(tenants.jenjang, 'Belum diisi') as jenjang, COUNT(*) as jumlah")
            ->groupBy('jenjang')
            ->pluck('jumlah', 'jenjang');

        $siswaCounts = SiswaDirectory::query()
            ->join('tenants', 'tenants.id', '=', 'siswa_direktori_nasional.sekolah_id')
            ->selectRaw("COALESCE(tenants.jenjang, 'Belum diisi') as jenjang, COUNT(*) as jumlah")
            ->groupBy('jenjang')
            ->pluck('jumlah', 'jenjang');

        $rows = $this->mergeCounts($sekolahCounts, $guruCounts, $siswaCounts, 'jenjang');

        return response()->json($rows);
    }

    /**
     * Data untuk peta sebaran sekolah: sekolah yang sudah punya koordinat
     * (latitude & longitude terisi, lewat menu Edit Profil sekolah atau
     * Data Sekolah) dipisah dari yang belum, supaya Super Admin tahu mana
     * yang koordinatnya masih perlu dilengkapi.
     */
    public function peta(): JsonResponse
    {
        $sekolah = Sekolah::withCount(['guruDirectory as jumlah_guru', 'siswaDirectory as jumlah_siswa'])->get();

        $markers = $sekolah
            ->filter(fn (Sekolah $s) => $s->latitude !== null && $s->longitude !== null)
            ->map(fn (Sekolah $s) => [
                'sekolah_id' => $s->id,
                'nama_sekolah' => $s->nama_sekolah,
                'npsn' => $s->npsn,
                'jenjang' => $s->jenjang,
                'provinsi' => $s->provinsi,
                'latitude' => (float) $s->latitude,
                'longitude' => (float) $s->longitude,
                'jumlah_guru' => $s->jumlah_guru,
                'jumlah_siswa' => $s->jumlah_siswa,
            ])
            ->values();

        $tanpaKoordinat = $sekolah
            ->filter(fn (Sekolah $s) => $s->latitude === null || $s->longitude === null)
            ->map(fn (Sekolah $s) => [
                'sekolah_id' => $s->id,
                'nama_sekolah' => $s->nama_sekolah,
                'provinsi' => $s->provinsi,
            ])
            ->values();

        return response()->json([
            'markers' => $markers,
            'tanpa_koordinat' => $tanpaKoordinat,
        ]);
    }

    /**
     * Gabungkan tiga peta [label => jumlah] (sekolah, guru, siswa) jadi satu
     * daftar baris {label, jumlah_sekolah, jumlah_guru, jumlah_siswa,
     * rasio}, diurutkan dari jumlah sekolah terbanyak.
     */
    private function mergeCounts(Collection $sekolahCounts, Collection $guruCounts, Collection $siswaCounts, string $labelKey): Collection
    {
        return $sekolahCounts->keys()
            ->map(function (string $label) use ($sekolahCounts, $guruCounts, $siswaCounts, $labelKey) {
                $jumlahGuru = (int) ($guruCounts[$label] ?? 0);
                $jumlahSiswa = (int) ($siswaCounts[$label] ?? 0);

                return [
                    $labelKey => $label,
                    'jumlah_sekolah' => (int) $sekolahCounts[$label],
                    'jumlah_guru' => $jumlahGuru,
                    'jumlah_siswa' => $jumlahSiswa,
                    'rasio' => $jumlahGuru > 0 ? round($jumlahSiswa / $jumlahGuru, 1) : null,
                ];
            })
            ->sortByDesc('jumlah_sekolah')
            ->values();
    }
}

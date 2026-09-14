<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Audit trail & monitoring lintas sekolah untuk Super Admin. Tidak ada
 * salinan central dari activity_log (tabel itu cuma ada per-tenant, lihat
 * Backend/database/migrations/tenant/..._create_activity_log_table.php) —
 * jadi setiap endpoint di sini membuka database tiap sekolah sebentar lewat
 * $sekolah->run(), mengambil baris yang relevan, lalu menutupnya lagi.
 * Cukup untuk jumlah sekolah saat ini; kalau nanti sekolahnya sudah sangat
 * banyak, pola ini perlu diganti jadi salinan central yang disinkronkan
 * (seperti GuruDirectory/SiswaDirectory), sama seperti disebutkan di
 * DirectorySyncService.
 */
class AuditController extends Controller
{
    /** Berapa baris terbaru yang diambil dari SETIAP sekolah sebelum digabung & diurutkan ulang secara keseluruhan. */
    private const PER_SEKOLAH_LIMIT = 200;

    /** Ambang & jendela waktu untuk mendeteksi "penghapusan data massal": N aksi hapus oleh orang yang sama dalam X detik. */
    private const MASS_DELETE_THRESHOLD = 5;

    private const MASS_DELETE_WINDOW_SECONDS = 600;

    public function index(Request $request): JsonResponse
    {
        $sekolahs = $this->resolveSekolahs($request);
        $page = max(1, $request->integer('page', 1));
        $perPage = $request->integer('per_page', 20);

        $rows = [];
        foreach ($sekolahs as $sekolah) {
            $rows = [...$rows, ...$this->fetchActivities($sekolah, $request)];
        }

        usort($rows, fn ($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));

        return response()->json($this->paginate($rows, $page, $perPage));
    }

    /**
     * "Dashboard notifikasi" untuk aksi sensitif: reset password (oleh
     * admin, lewat menu Kelola Pengguna sekolah) dan penghapusan data.
     * Karena sistem ini belum punya fitur "hapus massal" tersendiri, deteksi
     * massal dilakukan lewat pola: satu orang melakukan >= 5 aksi hapus
     * dalam rentang 10 menit — baris yang termasuk pola itu ditandai
     * `is_mass_delete`.
     */
    public function sensitive(Request $request): JsonResponse
    {
        $sekolahs = $this->resolveSekolahs($request);
        $page = max(1, $request->integer('page', 1));
        $perPage = $request->integer('per_page', 20);

        $rows = [];
        foreach ($sekolahs as $sekolah) {
            $rows = [...$rows, ...$this->fetchSensitiveActivities($sekolah)];
        }

        foreach ($rows as &$row) {
            $row['type'] = str_contains($row['description'], 'Mereset password') ? 'reset_password' : 'delete';
        }
        unset($row);

        $rows = $this->flagMassDeletes($rows);

        usort($rows, fn ($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));

        return response()->json($this->paginate($rows, $page, $perPage));
    }

    /**
     * Laporan berkala jumlah aktivitas per wilayah (provinsi) atau per
     * sekolah, dalam rentang tanggal tertentu (default 30 hari terakhir).
     */
    public function laporanWilayah(Request $request): JsonResponse
    {
        return response()->json($this->buildLaporanWilayah($request));
    }

    public function exportLaporanWilayah(Request $request): StreamedResponse
    {
        $groupBy = $request->string('group_by', 'provinsi')->value();
        $rows = $this->buildLaporanWilayah($request);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Aktivitas');

        if ($groupBy === 'sekolah') {
            $headers = ['Sekolah', 'NPSN', 'Provinsi', 'Kabupaten/Kota', 'Jumlah Aktivitas'];
            $sheet->fromArray($headers, null, 'A1');
            $sheet->getStyle('A1:E1')->getFont()->setBold(true);
            $sheet->fromArray($rows->map(fn ($r) => [
                $r['nama_sekolah'], $r['npsn'], $r['provinsi'], $r['kabupaten_kota'], $r['jumlah_aktivitas'],
            ])->all(), null, 'A2');
            foreach (range('A', 'E') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
        } else {
            $headers = ['Provinsi', 'Jumlah Sekolah', 'Jumlah Aktivitas'];
            $sheet->fromArray($headers, null, 'A1');
            $sheet->getStyle('A1:C1')->getFont()->setBold(true);
            $sheet->fromArray($rows->map(fn ($r) => [
                $r['provinsi'], $r['jumlah_sekolah'], $r['jumlah_aktivitas'],
            ])->all(), null, 'A2');
            foreach (range('A', 'C') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'laporan-aktivitas-' . now()->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function buildLaporanWilayah(Request $request): \Illuminate\Support\Collection
    {
        $groupBy = $request->string('group_by', 'provinsi')->value();
        $from = $request->filled('from') ? Carbon::parse($request->string('from')->value())->startOfDay() : now()->subDays(30)->startOfDay();
        $until = $request->filled('until') ? Carbon::parse($request->string('until')->value())->endOfDay() : now()->endOfDay();

        $perSekolah = collect(Sekolah::all())->map(function (Sekolah $sekolah) use ($from, $until) {
            $count = $sekolah->run(fn () => Activity::whereBetween('created_at', [$from, $until])->count());

            return [
                'sekolah_id' => $sekolah->id,
                'nama_sekolah' => $sekolah->nama_sekolah,
                'npsn' => $sekolah->npsn,
                'provinsi' => $sekolah->provinsi ?: 'Tidak diketahui',
                'kabupaten_kota' => $sekolah->kabupaten_kota,
                'jumlah_aktivitas' => $count,
            ];
        });

        if ($groupBy === 'sekolah') {
            return $perSekolah->sortByDesc('jumlah_aktivitas')->values();
        }

        return $perSekolah
            ->groupBy('provinsi')
            ->map(fn ($group, $provinsi) => [
                'provinsi' => $provinsi,
                'jumlah_sekolah' => $group->count(),
                'jumlah_aktivitas' => $group->sum('jumlah_aktivitas'),
            ])
            ->sortByDesc('jumlah_aktivitas')
            ->values();
    }

    /**
     * @return array<int, Sekolah>
     */
    private function resolveSekolahs(Request $request): array
    {
        if ($request->filled('sekolah_id')) {
            $sekolah = Sekolah::find($request->string('sekolah_id')->value());

            return $sekolah ? [$sekolah] : [];
        }

        return Sekolah::all()->all();
    }

    private function fetchActivities(Sekolah $sekolah, Request $request): array
    {
        $search = $request->string('search')->value();
        $from = $request->string('from')->value();
        $until = $request->string('until')->value();

        return $sekolah->run(function () use ($sekolah, $search, $from, $until) {
            $activities = Activity::query()
                ->with('causer:id,name')
                ->when($search !== '', fn ($q) => $q->where('description', 'like', "%{$search}%"))
                ->when($from !== '', fn ($q) => $q->whereDate('created_at', '>=', $from))
                ->when($until !== '', fn ($q) => $q->whereDate('created_at', '<=', $until))
                ->orderByDesc('created_at')
                ->limit(self::PER_SEKOLAH_LIMIT)
                ->get();

            return $this->presentActivities($activities, $sekolah);
        });
    }

    private function fetchSensitiveActivities(Sekolah $sekolah): array
    {
        return $sekolah->run(function () use ($sekolah) {
            $activities = Activity::query()
                ->with('causer:id,name')
                ->where(function ($q) {
                    $q->where('description', 'like', '%Menghapus%')
                        ->orWhere('description', 'like', '%Mereset password%');
                })
                ->orderByDesc('created_at')
                ->limit(self::PER_SEKOLAH_LIMIT * 2)
                ->get();

            return $this->presentActivities($activities, $sekolah);
        });
    }

    /**
     * Ubah hasil query jadi array biasa SEBELUM keluar dari $sekolah->run() —
     * model yang di-fetch selagi tenancy aktif membawa nama koneksi yang
     * cuma valid selama closure ini berjalan (lihat catatan yang sama di
     * SchoolAccessController/SchoolSyncController).
     */
    private function presentActivities($activities, Sekolah $sekolah): array
    {
        return $activities->map(fn (Activity $a) => [
            'id' => $a->id,
            'log_name' => $a->log_name,
            'description' => $a->description,
            'event' => $a->event,
            'causer_name' => $a->causer?->name,
            'causer_id' => $a->causer_id,
            'created_at' => (string) $a->created_at,
            'sekolah_id' => $sekolah->id,
            'nama_sekolah' => $sekolah->nama_sekolah,
        ])->all();
    }

    /**
     * Tandai baris hapus (per sekolah + pelaku yang sama) yang berkelompok
     * >= MASS_DELETE_THRESHOLD kejadian dalam jendela
     * MASS_DELETE_WINDOW_SECONDS — pola ini yang dianggap "penghapusan data
     * massal" karena sistem belum punya endpoint hapus-massal tersendiri.
     */
    private function flagMassDeletes(array $rows): array
    {
        $groups = [];
        foreach ($rows as $i => $row) {
            if ($row['type'] !== 'delete') {
                continue;
            }
            $key = $row['sekolah_id'] . '|' . $row['causer_id'];
            $groups[$key][] = $i;
        }

        foreach ($groups as $indexes) {
            $sorted = collect($indexes)->sortBy(fn ($i) => strtotime($rows[$i]['created_at']))->values()->all();

            for ($start = 0; $start < count($sorted); $start++) {
                $windowIndexes = [$sorted[$start]];
                $startTime = strtotime($rows[$sorted[$start]]['created_at']);

                for ($j = $start + 1; $j < count($sorted); $j++) {
                    $time = strtotime($rows[$sorted[$j]]['created_at']);
                    if ($time - $startTime > self::MASS_DELETE_WINDOW_SECONDS) {
                        break;
                    }
                    $windowIndexes[] = $sorted[$j];
                }

                if (count($windowIndexes) >= self::MASS_DELETE_THRESHOLD) {
                    foreach ($windowIndexes as $idx) {
                        $rows[$idx]['type'] = 'mass_delete';
                        $rows[$idx]['mass_delete_count'] = count($windowIndexes);
                    }
                }
            }
        }

        return $rows;
    }

    private function paginate(array $rows, int $page, int $perPage): array
    {
        $total = count($rows);
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = min($page, $lastPage);
        $offset = ($page - 1) * $perPage;

        return [
            'data' => array_values(array_slice($rows, $offset, $perPage)),
            'current_page' => $page,
            'last_page' => $lastPage,
            'total' => $total,
            'per_page' => $perPage,
        ];
    }
}

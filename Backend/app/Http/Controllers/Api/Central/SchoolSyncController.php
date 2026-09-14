<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\GuruDirectory;
use App\Models\Central\SiswaDirectory;
use App\Models\Central\SyncLog;
use App\Models\Guru;
use App\Models\Sekolah;
use App\Models\Siswa;
use App\Services\DirectorySyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * Sisi Super Admin dari fitur sinkronisasi data: riwayat sinkronisasi
 * lintas sekolah, aksi paksa-sinkron untuk sekolah tertentu (mis. dari menu
 * Tarik Data / API), dan deteksi konflik — sekolah yang datanya sendiri
 * tidak cocok lagi dengan direktori nasional (tanda sinkronisasi otomatis
 * pernah terlewat/gagal, bukan berarti ada dua versi data yang bertentangan).
 */
class SchoolSyncController extends Controller
{
    public function __construct(private readonly DirectorySyncService $syncService)
    {
    }

    public function log(Request $request): JsonResponse
    {
        $logs = QueryBuilder::for(SyncLog::class)
            ->allowedFilters('sekolah_id', 'status', 'triggered_by_role')
            ->allowedSorts('created_at')
            ->with('sekolah:id,nama_sekolah,npsn')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($logs);
    }

    public function sync(Request $request, Sekolah $sekolah): JsonResponse
    {
        $user = $request->user();

        try {
            $result = $sekolah->run(fn () => $this->syncService->syncAll($sekolah));

            SyncLog::create([
                'sekolah_id' => $sekolah->id,
                'triggered_by_name' => $user->name,
                'triggered_by_email' => $user->email,
                'triggered_by_role' => 'super_admin',
                'jumlah_guru' => $result['guru'],
                'jumlah_siswa' => $result['siswa'],
                'status' => 'berhasil',
            ]);

            return response()->json([
                'message' => 'Sinkronisasi berhasil.',
                'jumlah_guru' => $result['guru'],
                'jumlah_siswa' => $result['siswa'],
            ]);
        } catch (\Throwable $e) {
            report($e);

            SyncLog::create([
                'sekolah_id' => $sekolah->id,
                'triggered_by_name' => $user->name,
                'triggered_by_email' => $user->email,
                'triggered_by_role' => 'super_admin',
                'status' => 'gagal',
                'pesan_error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Sinkronisasi gagal: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bandingkan jumlah guru/siswa di database masing-masing sekolah dengan
     * jumlah salinannya di direktori nasional. Selisih menandakan
     * sinkronisasi otomatis pernah terlewat (mis. queue gagal, atau data
     * dihapus lewat cara yang tidak memicu observer — lihat catatan di
     * GuruObserver/SiswaObserver).
     */
    public function conflicts(): JsonResponse
    {
        $conflicts = [];

        foreach (Sekolah::all() as $sekolah) {
            $local = $sekolah->run(fn () => [
                'guru' => Guru::count(),
                'siswa' => Siswa::count(),
            ]);

            $directoryGuru = GuruDirectory::where('sekolah_id', $sekolah->id)->count();
            $directorySiswa = SiswaDirectory::where('sekolah_id', $sekolah->id)->count();

            if ($local['guru'] === $directoryGuru && $local['siswa'] === $directorySiswa) {
                continue;
            }

            $lastSync = SyncLog::where('sekolah_id', $sekolah->id)
                ->orderByDesc('created_at')
                ->first(['created_at', 'status']);

            $conflicts[] = [
                'sekolah_id' => $sekolah->id,
                'nama_sekolah' => $sekolah->nama_sekolah,
                'npsn' => $sekolah->npsn,
                'jumlah_guru_lokal' => $local['guru'],
                'jumlah_guru_direktori' => $directoryGuru,
                'jumlah_siswa_lokal' => $local['siswa'],
                'jumlah_siswa_direktori' => $directorySiswa,
                'terakhir_sinkron' => $lastSync?->created_at,
                'status_sinkron_terakhir' => $lastSync?->status,
            ];
        }

        return response()->json($conflicts);
    }
}

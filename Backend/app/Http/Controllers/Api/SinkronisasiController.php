<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Central\SyncLog;
use App\Models\Sekolah;
use App\Services\DirectorySyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Sisi sekolah dari fitur sinkronisasi data: tombol "Tarik Data Sekarang"
 * yang dipakai Admin Sekolah untuk memastikan data guru & siswa sekolahnya
 * sudah tercermin di direktori nasional (dikelola Super Admin), plus
 * riwayat sinkronisasi milik sekolah itu sendiri. SyncLog selalu ditulis ke
 * database central (lihat SyncLog::getConnectionName()) supaya Super Admin
 * bisa memantau seluruh sekolah dari satu tempat.
 */
class SinkronisasiController extends Controller
{
    public function __construct(private readonly DirectorySyncService $syncService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Sekolah $sekolah */
        $sekolah = tenant();
        $user = $request->user();

        try {
            $result = $this->syncService->syncAll($sekolah);

            SyncLog::create([
                'sekolah_id' => $sekolah->id,
                'triggered_by_name' => $user->name,
                'triggered_by_email' => $user->email,
                'triggered_by_role' => 'admin_sekolah',
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
                'triggered_by_role' => 'admin_sekolah',
                'status' => 'gagal',
                'pesan_error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Sinkronisasi gagal: ' . $e->getMessage()], 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Sekolah $sekolah */
        $sekolah = tenant();

        $logs = SyncLog::where('sekolah_id', $sekolah->id)
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 10));

        return response()->json($logs);
    }
}

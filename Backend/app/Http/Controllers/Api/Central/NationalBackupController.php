<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\GuruDirectory;
use App\Models\Central\SiswaDirectory;
use App\Models\Central\SyncLog;
use App\Models\Sekolah;
use App\Services\CentralBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Backup & restore database CENTRAL (tabel tenants/sekolah, direktori guru
 * & siswa nasional, log sinkronisasi, akun Super Admin) — beda dari
 * BackupController (tenant) yang mencadangkan satu sekolah saja. Pola
 * penyimpanan file backup sama persis (salin file .sqlite mentah ke disk
 * 'local'), lihat CentralBackupService.
 */
class NationalBackupController extends Controller
{
    public function __construct(private readonly CentralBackupService $backups)
    {
    }

    public function index(): JsonResponse
    {
        $files = collect(Storage::disk('local')->files(CentralBackupService::DIR))
            ->filter(fn ($path) => str_ends_with($path, '.sqlite'))
            ->map(function ($path) {
                $name = basename($path);

                return [
                    'name' => $name,
                    'size' => Storage::disk('local')->size($path),
                    'created_at' => Storage::disk('local')->lastModified($path),
                ];
            })
            ->sortByDesc('created_at')
            ->values();

        return response()->json($files);
    }

    public function store(): JsonResponse
    {
        $result = $this->backups->create('manual');

        return response()->json($result, 201);
    }

    public function download(string $name): StreamedResponse
    {
        $this->assertValidBackup($name);

        return Storage::disk('local')->download(CentralBackupService::DIR.'/'.$name);
    }

    public function destroy(string $name): JsonResponse
    {
        $this->assertValidBackup($name);

        Storage::disk('local')->delete(CentralBackupService::DIR.'/'.$name);

        return response()->json(['message' => 'Backup berhasil dihapus.']);
    }

    /**
     * Pulihkan database central dari salah satu file backup. Berdampak ke
     * SEMUA sekolah sekaligus (bukan cuma satu tenant), jadi kondisi saat
     * ini otomatis dicadangkan dulu sebelum ditimpa — sama seperti restore
     * di sisi sekolah.
     */
    public function restore(string $name): JsonResponse
    {
        $this->assertValidBackup($name);

        $safety = $this->backups->create('sebelum-pemulihan');

        $backupContent = Storage::disk('local')->get(CentralBackupService::DIR.'/'.$name);
        file_put_contents($this->backups->databasePath(), $backupContent);

        return response()->json([
            'message' => 'Data nasional berhasil dipulihkan.',
            'safety_backup' => $safety['name'],
        ]);
    }

    /**
     * Info versi platform & sistem untuk panel "Manajemen Versi/Update
     * Sistem". Satu basis kode dipakai semua sekolah — tidak ada versi
     * terpisah per sekolah — jadi ini murni informasi, bukan pemicu update
     * otomatis (proses deploy/update tetap dilakukan manual oleh tim
     * teknis, bukan lewat tombol di dashboard).
     */
    public function systemInfo(): JsonResponse
    {
        return response()->json([
            'app_version' => config('sim.app_version'),
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
            'database_driver' => config('database.connections.'.config('tenancy.database.central_connection').'.driver'),
            'database_size' => @filesize($this->backups->databasePath()) ?: null,
            'total_sekolah' => Sekolah::count(),
            'total_guru' => GuruDirectory::count(),
            'total_siswa' => SiswaDirectory::count(),
            'total_sinkronisasi' => SyncLog::count(),
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    private function assertValidBackup(string $name): void
    {
        if (! preg_match('/^[A-Za-z0-9_\-]+\.sqlite$/', $name)
            || ! Storage::disk('local')->exists(CentralBackupService::DIR.'/'.$name)) {
            throw ValidationException::withMessages([
                'name' => ['Backup tidak ditemukan.'],
            ]);
        }
    }
}

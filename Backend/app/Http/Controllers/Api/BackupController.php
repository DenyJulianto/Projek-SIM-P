<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use App\Settings\BackupScheduleSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BackupController extends Controller
{
    public function __construct(private BackupService $backups)
    {
    }

    public function index(): JsonResponse
    {
        $files = collect(Storage::disk('local')->files(BackupService::DIR))
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

    public function store(Request $request): JsonResponse
    {
        $result = $this->backups->create('manual');

        activity()
            ->causedBy($request->user())
            ->useLog('backup')
            ->log("Membuat backup data \"{$result['name']}\".");

        return response()->json($result, 201);
    }

    public function download(string $name): Response
    {
        $this->assertValidBackup($name);

        return Storage::disk('local')->download(BackupService::DIR.'/'.$name);
    }

    public function destroy(Request $request, string $name): JsonResponse
    {
        $this->assertValidBackup($name);

        Storage::disk('local')->delete(BackupService::DIR.'/'.$name);

        activity()
            ->causedBy($request->user())
            ->useLog('backup')
            ->log("Menghapus backup \"{$name}\".");

        return response()->json(['message' => 'Backup berhasil dihapus.']);
    }

    /**
     * Pulihkan database tenant dari salah satu file backup. Demi keamanan,
     * kondisi database saat ini otomatis dicadangkan dulu sebelum ditimpa,
     * sehingga proses ini tetap bisa "dibatalkan" dengan memulihkan backup
     * otomatis tersebut.
     */
    public function restore(Request $request, string $name): JsonResponse
    {
        $this->assertValidBackup($name);

        $safety = $this->backups->create('sebelum-pemulihan');

        $backupContent = Storage::disk('local')->get(BackupService::DIR.'/'.$name);
        file_put_contents($this->backups->databasePath(), $backupContent);

        activity()
            ->causedBy($request->user())
            ->useLog('backup')
            ->log("Memulihkan data dari backup \"{$name}\" (kondisi sebelumnya disimpan sebagai \"{$safety['name']}\").");

        return response()->json([
            'message' => 'Data berhasil dipulihkan.',
            'safety_backup' => $safety['name'],
        ]);
    }

    public function schedule(): JsonResponse
    {
        $settings = app(BackupScheduleSettings::class);

        return response()->json([
            'frequency' => $settings->frequency,
            'time' => $settings->time,
            'last_run_at' => $settings->last_run_at,
        ]);
    }

    public function updateSchedule(Request $request): JsonResponse
    {
        $data = $request->validate([
            'frequency' => ['required', 'in:off,harian,mingguan'],
            'time' => ['required', 'date_format:H:i'],
        ]);

        $settings = app(BackupScheduleSettings::class);
        $settings->frequency = $data['frequency'];
        $settings->time = $data['time'];
        $settings->save();

        activity()
            ->causedBy($request->user())
            ->useLog('backup')
            ->log("Mengubah jadwal backup otomatis menjadi \"{$data['frequency']}\" jam {$data['time']}.");

        return response()->json([
            'frequency' => $settings->frequency,
            'time' => $settings->time,
            'last_run_at' => $settings->last_run_at,
        ]);
    }

    private function assertValidBackup(string $name): void
    {
        if (! preg_match('/^[A-Za-z0-9_\-]+\.sqlite$/', $name)
            || ! Storage::disk('local')->exists(BackupService::DIR.'/'.$name)) {
            throw ValidationException::withMessages([
                'name' => ['Backup tidak ditemukan.'],
            ]);
        }
    }
}

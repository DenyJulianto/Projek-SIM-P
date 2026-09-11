<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationConfig;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Services\BackupService;
use App\Settings\BackupScheduleSettings;
use App\Settings\NotificationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    private const CATEGORY_LABELS = [
        'pengguna' => 'Pengguna',
        'hak-akses' => 'Hak Akses',
        'konfigurasi' => 'Konfigurasi',
        'integrasi' => 'Integrasi',
        'backup' => 'Backup',
    ];

    /**
     * Ringkasan untuk widget admin di Dashboard: jumlah pengguna, status
     * sistem, status backup terakhir, aktivitas terbaru, dan peringatan
     * yang dihitung dari data asli (bukan data contoh).
     */
    public function summary(Request $request): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $inactiveUsers = $totalUsers - $activeUsers;
        $usersWithoutRole = User::doesntHave('roles')->count();

        $recentActivity = Activity::with('causer.roles:id,name')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn (Activity $a) => [
                'id' => $a->id,
                'description' => $a->description,
                'causer_name' => $a->causer?->name,
                'causer_role' => $a->causer?->roles->first()?->name,
                'category' => self::CATEGORY_LABELS[$a->log_name] ?? null,
                'created_at' => $a->created_at,
            ]);

        $recentUsers = User::with('roles:id,name')
            ->latest()
            ->take(4)
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->roles->first()?->name,
                'is_active' => $u->is_active,
                'last_login_at' => $u->last_login_at,
            ]);

        $notif = app(NotificationSettings::class);
        $lastBackupAt = $this->lastBackupAt();

        $alerts = [];
        if ($notif->peringatan_akun_nonaktif && $inactiveUsers > 0) {
            $alerts[] = [
                'type' => 'akun',
                'level' => 'warning',
                'message' => "{$inactiveUsers} akun berstatus nonaktif.",
            ];
        }
        if ($notif->peringatan_tanpa_peran && $usersWithoutRole > 0) {
            $alerts[] = [
                'type' => 'peran',
                'level' => 'warning',
                'message' => "{$usersWithoutRole} akun belum memiliki peran.",
            ];
        }
        if ($notif->peringatan_backup_belum_pernah && ! $lastBackupAt) {
            $alerts[] = [
                'type' => 'backup',
                'level' => 'warning',
                'message' => 'Belum pernah backup data. Segera buat backup di menu Backup & Pemulihan.',
            ];
        }

        $startOfMonth = now()->startOfMonth();
        $totalUsersLastMonth = User::where('created_at', '<', $startOfMonth)->count();
        $activeUsersLastMonth = User::where('is_active', true)->where('created_at', '<', $startOfMonth)->count();

        $tahunAjaranAktif = TahunAjaran::where('is_active', true)->first();
        $semesterAktif = Semester::where('is_active', true)->first();

        $days = (int) $request->query('days', 7);
        $days = in_array($days, [7, 14, 30], true) ? $days : 7;

        return response()->json([
            'total_users' => $totalUsers,
            'total_users_trend_percent' => $this->percentChange($totalUsersLastMonth, $totalUsers),
            'active_users' => $activeUsers,
            'active_users_trend_percent' => $this->percentChange($activeUsersLastMonth, $activeUsers),
            'inactive_users' => $inactiveUsers,
            'users_without_role' => $usersWithoutRole,
            'system_status' => $this->systemStatus($lastBackupAt),
            'last_backup_at' => $lastBackupAt,
            'backup_schedule' => app(BackupScheduleSettings::class)->frequency,
            'recent_activity' => $recentActivity,
            'recent_users' => $recentUsers,
            'alerts' => $alerts,
            'activity_trend' => $this->activityTrend($days),
            'activity_trend_days' => $days,
            'today_activity_count' => Activity::whereDate('created_at', now()->toDateString())->count(),
            'today_activity_trend_percent' => $this->percentChange(
                Activity::whereDate('created_at', now()->subDay()->toDateString())->count(),
                Activity::whereDate('created_at', now()->toDateString())->count(),
            ),
            'tahun_ajaran_aktif' => $tahunAjaranAktif?->nama,
            'semester_aktif' => $semesterAktif?->nama,
        ]);
    }

    private function percentChange(int $before, int $after): float
    {
        if ($before === 0) {
            return $after > 0 ? 100.0 : 0.0;
        }

        return round((($after - $before) / $before) * 100, 1);
    }

    private function systemStatus(?int $lastBackupAt): array
    {
        $backupHealthy = $lastBackupAt && Carbon::createFromTimestamp($lastBackupAt)->diffInDays(now()) <= 14;
        $integrationActive = IntegrationConfig::where('enabled', true)->exists();

        return [
            'server' => 'normal',
            'database' => 'normal',
            'backup' => $backupHealthy ? 'normal' : 'perhatian',
            'integrasi' => $integrationActive ? 'aktif' : 'nonaktif',
        ];
    }

    private function activityTrend(int $days): array
    {
        $counts = Activity::query()
            ->where('created_at', '>=', now()->subDays($days - 1)->startOfDay())
            ->selectRaw('date(created_at) as tanggal, count(*) as total')
            ->groupBy('tanggal')
            ->pluck('total', 'tanggal');

        $result = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $key = $date->toDateString();
            $result[] = [
                'tanggal' => $key,
                'label' => $date->translatedFormat('d M'),
                'total' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $result;
    }

    private function lastBackupAt(): ?int
    {
        $files = Storage::disk('local')->files(BackupService::DIR);

        if ($files === []) {
            return null;
        }

        return collect($files)
            ->map(fn ($path) => Storage::disk('local')->lastModified($path))
            ->max();
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

/**
 * Katalog role/permission standar yang dipakai semua sekolah (bersumber
 * dari RolePermissionSeeder — identik untuk setiap tenant baru), digabung
 * dengan jumlah pengguna nyata yang memegang tiap role secara nasional.
 * Baca-saja: untuk mengUBAH permission satu role di sekolah tertentu,
 * pakai SchoolAccessController::updateRolePermissions() (menu Hak Akses &
 * Permission) — halaman ini untuk melihat gambaran besar seluruh hierarki
 * role di platform, bukan mengedit satu sekolah.
 */
class RoleCatalogController extends Controller
{
    public function index(): JsonResponse
    {
        $map = RolePermissionSeeder::rolePermissionMap();
        $usage = $this->nationalUsage();

        $rows = collect($map)
            ->map(fn (array $permissions, string $roleName) => [
                'role' => $roleName,
                'jumlah_permission' => count($permissions),
                'permissions' => array_values($permissions),
                'jumlah_pengguna' => $usage[$roleName] ?? 0,
            ])
            ->sortByDesc('jumlah_permission')
            ->values();

        return response()->json($rows);
    }

    /**
     * @return array<string, int> nama role => jumlah pengguna di seluruh sekolah
     */
    private function nationalUsage(): array
    {
        $totals = [];

        foreach (Sekolah::all() as $sekolah) {
            $counts = $sekolah->run(function () {
                $userCounts = DB::table('model_has_roles')
                    ->select('role_id', DB::raw('count(*) as total'))
                    ->groupBy('role_id')
                    ->pluck('total', 'role_id');

                return Role::all(['id', 'name'])
                    ->mapWithKeys(fn (Role $role) => [$role->name => (int) ($userCounts[$role->id] ?? 0)])
                    ->all();
            });

            foreach ($counts as $roleName => $count) {
                $totals[$roleName] = ($totals[$roleName] ?? 0) + $count;
            }
        }

        return $totals;
    }
}

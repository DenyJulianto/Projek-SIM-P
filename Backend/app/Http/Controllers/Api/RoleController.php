<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions:id,name')->orderBy('name')->get(['id', 'name']);

        $userCounts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('count(*) as total'))
            ->groupBy('role_id')
            ->pluck('total', 'role_id');

        $roles->each(function (Role $role) use ($userCounts) {
            $role->setAttribute('users_count', $userCounts[$role->id] ?? 0);
        });

        return response()->json($roles);
    }

    /**
     * Daftar semua permission yang terdaftar di sistem, dipakai untuk
     * membangun form "atur hak akses" per role.
     */
    public function permissions(): JsonResponse
    {
        return response()->json(
            Permission::orderBy('name')->get(['id', 'name'])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->where('guard_name', 'web')],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->syncPermissions($data['permissions'] ?? []);

        activity()
            ->causedBy($request->user())
            ->performedOn($role)
            ->useLog('hak-akses')
            ->log("Membuat role \"{$role->name}\".");

        return response()->json($role->load('permissions:id,name'), 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->where('guard_name', 'web')->ignore($role->id)],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->name = $data['name'];
        $role->save();
        $role->syncPermissions($data['permissions'] ?? []);

        activity()
            ->causedBy($request->user())
            ->performedOn($role)
            ->useLog('hak-akses')
            ->log("Memperbarui hak akses role \"{$role->name}\".");

        return response()->json($role->load('permissions:id,name'));
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        if (DB::table('model_has_roles')->where('role_id', $role->id)->exists()) {
            return response()->json([
                'message' => 'Role masih dipakai oleh pengguna. Pindahkan pengguna ke role lain dahulu.',
            ], 422);
        }

        $name = $role->name;
        $role->delete();

        activity()
            ->causedBy($request->user())
            ->useLog('hak-akses')
            ->log("Menghapus role \"{$name}\".");

        return response()->json(['message' => 'Role berhasil dihapus.']);
    }
}

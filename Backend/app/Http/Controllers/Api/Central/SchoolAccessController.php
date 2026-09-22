<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Manajemen akses & hak sekolah untuk Super Admin: aktivasi/nonaktifkan
 * akun sekolah, assign/lepas admin sekolah, dan atur hak akses (permission)
 * per role di sekolah tertentu — semuanya dari sisi central, membuka
 * konteks tenant sekolah yang dituju lewat $sekolah->run() (pola yang sama
 * dengan GuruDirectoryController/SiswaDirectoryController::import()).
 */
class SchoolAccessController extends Controller
{
    private const ADMIN_ROLE = 'Admin Sekolah';

    /**
     * Aktifkan/nonaktifkan akun sekolah. Sekolah berstatus 'inactive' tidak
     * bisa lagi login (lihat AuthController::login) — dipakai untuk
     * menangguhkan sekolah tanpa menghapus datanya.
     */
    public function updateStatus(Request $request, Sekolah $sekolah): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $sekolah->update(['status' => $data['status']]);

        return response()->json($sekolah->load('domains'));
    }

    /**
     * Daftar akun dengan role 'Admin Sekolah' di sekolah tertentu. Satu
     * sekolah bisa punya lebih dari satu admin.
     */
    public function admins(Sekolah $sekolah): JsonResponse
    {
        // Model yang di-fetch selagi tenancy aktif membawa nama koneksi
        // 'tenant' yang cuma valid selama closure ini berjalan — begitu
        // $sekolah->run() selesai dan tenancy di-revert, koneksi itu tidak
        // terdaftar lagi. Makanya hasilnya WAJIB di-toArray() di dalam
        // closure, sebelum di-return, supaya yang keluar cuma array biasa.
        $admins = $sekolah->run(function () {
            return User::role(self::ADMIN_ROLE)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'is_active', 'last_login_at', 'created_at'])
                ->toArray();
        });

        return response()->json($admins);
    }

    /**
     * Buat akun admin sekolah baru langsung di database tenant yang dituju.
     * Password dibuat acak dan dikembalikan sekali di response (tidak ada
     * sistem pengiriman email khusus untuk ini) — Super Admin perlu
     * membagikannya secara manual & aman ke pihak sekolah.
     */
    public function storeAdmin(Request $request, Sekolah $sekolah): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $result = $sekolah->run(function () use ($data) {
            if (User::where('email', $data['email'])->exists()) {
                return ['error' => 'Email tersebut sudah terdaftar di sekolah ini.'];
            }

            $password = Str::password(10, symbols: false);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $password,
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();
            $user->assignRole(self::ADMIN_ROLE);

            return ['user' => $user->toArray(), 'password' => $password];
        });

        if (isset($result['error'])) {
            throw ValidationException::withMessages(['email' => [$result['error']]]);
        }

        return response()->json([
            'user' => $result['user'],
            'password' => $result['password'],
        ], 201);
    }

    /**
     * Daftar akun Admin Sekolah lintas SEMUA sekolah (atau satu sekolah
     * lewat ?sekolah_id=), dipakai menu Kelola Pengguna — beda dari
     * admins() di atas yang selalu perlu satu sekolah spesifik dulu.
     * Sama seperti AuditController::index(), ini agregasi langsung dari
     * tiap database tenant (belum ada salinan central untuk data akun),
     * jadi cukup untuk jumlah sekolah saat ini.
     */
    public function nationalAdmins(Request $request): JsonResponse
    {
        $search = $request->string('search')->value();
        $status = $request->string('status')->value();

        $sekolahs = $request->filled('sekolah_id')
            ? Sekolah::where('id', $request->string('sekolah_id')->value())->get()
            : Sekolah::all();

        $page = max(1, $request->integer('page', 1));
        $perPage = $request->integer('per_page', 20);

        $rows = [];
        foreach ($sekolahs as $sekolah) {
            $admins = $sekolah->run(function () use ($search, $status) {
                return User::role(self::ADMIN_ROLE)
                    ->when($search !== '', fn ($q) => $q->where(function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
                    }))
                    ->when($status === 'aktif', fn ($q) => $q->where('is_active', true))
                    ->when($status === 'nonaktif', fn ($q) => $q->where('is_active', false))
                    ->orderBy('name')
                    ->get(['id', 'name', 'email', 'is_active', 'last_login_at', 'created_at'])
                    ->toArray();
            });

            foreach ($admins as $admin) {
                $rows[] = [...$admin, 'sekolah_id' => $sekolah->id, 'nama_sekolah' => $sekolah->nama_sekolah];
            }
        }

        usort($rows, fn ($a, $b) => strcmp($a['name'], $b['name']));

        $total = count($rows);
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = min($page, $lastPage);

        return response()->json([
            'data' => array_values(array_slice($rows, ($page - 1) * $perPage, $perPage)),
            'current_page' => $page,
            'last_page' => $lastPage,
            'total' => $total,
            'per_page' => $perPage,
        ]);
    }

    /**
     * Reset password akun admin sekolah tersebut ke password acak baru.
     * Dipakai kalau admin sekolah lupa password dan tidak bisa memakai
     * alur lupa password mandiri (mis. email sudah tidak aktif).
     */
    public function resetAdminPassword(Sekolah $sekolah, int $userId): JsonResponse
    {
        $result = $sekolah->run(function () use ($userId) {
            $user = User::find($userId);

            if (! $user) {
                return ['error' => 'Akun tidak ditemukan di sekolah ini.'];
            }

            $password = Str::password(10, symbols: false);
            $user->password = $password;
            $user->tokens()->delete();
            $user->save();

            return ['password' => $password];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], 404);
        }

        return response()->json(['password' => $result['password']]);
    }

    /**
     * Aktifkan/nonaktifkan akun admin sekolah tertentu — dipakai untuk
     * menangguhkan akun yang bermasalah tanpa menghapusnya. Akun nonaktif
     * langsung ditolak saat login (lihat AuthController::login).
     */
    public function toggleAdminActive(Request $request, Sekolah $sekolah, int $userId): JsonResponse
    {
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $result = $sekolah->run(function () use ($userId, $data) {
            $user = User::find($userId);

            if (! $user) {
                return ['error' => 'Akun tidak ditemukan di sekolah ini.'];
            }

            $user->is_active = $data['is_active'];
            $user->save();

            if (! $data['is_active']) {
                $user->tokens()->delete();
            }

            return ['user' => $user->toArray()];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], 404);
        }

        return response()->json($result['user']);
    }

    /**
     * Lepas peran 'Admin Sekolah' dari akun tersebut di database tenant
     * yang dituju. Akunnya sendiri tidak dihapus — hanya perannya sebagai
     * admin sekolah yang dicabut, supaya bisa dikelola lebih lanjut (mis.
     * diberi role lain) lewat menu Kelola Pengguna di sekolah itu sendiri.
     */
    public function destroyAdmin(Sekolah $sekolah, int $userId): JsonResponse
    {
        $result = $sekolah->run(function () use ($userId) {
            $user = User::find($userId);

            if (! $user) {
                return ['error' => 'Akun tidak ditemukan di sekolah ini.'];
            }

            $user->removeRole(self::ADMIN_ROLE);

            return ['ok' => true];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], 404);
        }

        return response()->json(['message' => 'Admin sekolah berhasil dilepas dari sekolah ini.']);
    }

    /**
     * Katalog semua nama permission yang dikenal sistem, dipakai untuk
     * membangun form "atur hak akses" tanpa perlu membuka koneksi ke
     * database tenant mana pun (isinya identik di semua sekolah).
     */
    public function permissionCatalog(): JsonResponse
    {
        return response()->json(RolePermissionSeeder::allPermissionNames());
    }

    /**
     * Daftar role & permission yang dimiliki masing-masing di sekolah
     * tertentu — dipakai Super Admin untuk memeriksa/menyesuaikan hak akses
     * granular sekolah tersebut (mis. memastikan role tertentu hanya bisa
     * mengelola data miliknya sendiri).
     */
    public function roles(Sekolah $sekolah): JsonResponse
    {
        $roles = $sekolah->run(function () {
            return Role::with('permissions:id,name')->orderBy('name')->get(['id', 'name'])->toArray();
        });

        return response()->json($roles);
    }

    /**
     * Ganti daftar permission milik satu role di sekolah tertentu. Berbeda
     * dari RoleController::update (sisi sekolah), endpoint ini tidak
     * memblokir perubahan pada role 'Super Admin' tenant — karena yang
     * memanggil sudah pasti Super Admin platform (dijamin middleware
     * super_admin), bukan Admin Sekolah biasa yang perlu dibatasi.
     */
    public function updateRolePermissions(Request $request, Sekolah $sekolah, int $roleId): JsonResponse
    {
        $data = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string'],
        ]);

        $result = $sekolah->run(function () use ($roleId, $data) {
            $role = Role::find($roleId);

            if (! $role) {
                return ['error' => 'Role tidak ditemukan di sekolah ini.'];
            }

            $permissionModels = collect($data['permissions'] ?? [])
                ->unique()
                ->map(fn (string $name) => Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']));

            $role->syncPermissions($permissionModels);

            return ['role' => $role->load('permissions:id,name')->toArray()];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], 404);
        }

        return response()->json($result['role']);
    }
}

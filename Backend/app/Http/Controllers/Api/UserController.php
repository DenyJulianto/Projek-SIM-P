<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with([
                'roles' => fn ($q) => $q->select('id', 'name')->with('permissions:id,name'),
                'guru:id,user_id,nip',
                'siswa:id,user_id,nis',
            ])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('role'), function ($query) use ($request) {
                $query->whereHas('roles', fn ($q) => $q->where('name', $request->string('role')));
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('is_active', $request->string('status') === 'aktif');
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        $users->getCollection()->each(function (User $user) {
            $user->setAttribute('nip_nis', $user->guru?->nip ?? $user->siswa?->nis);
            $user->setAttribute('identitas_type', $user->guru ? 'guru' : ($user->siswa ? 'siswa' : null));
            $user->unsetRelation('guru')->unsetRelation('siswa');
        });

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'roles' => ['array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->syncRoles($data['roles'] ?? []);

        activity()
            ->causedBy($request->user())
            ->performedOn($user)
            ->useLog('pengguna')
            ->log("Menambahkan pengguna \"{$user->name}\".");

        return response()->json($this->presentSingleUser($user), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['nullable', 'boolean'],
            'nip_nis' => ['nullable', 'string', 'max:30'],
            'roles' => ['array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        if ($user->is($request->user()) && array_key_exists('is_active', $data) && ! $data['is_active']) {
            throw ValidationException::withMessages([
                'is_active' => ['Tidak bisa menonaktifkan akun sendiri.'],
            ]);
        }

        $statusChanged = array_key_exists('is_active', $data) && $data['is_active'] !== $user->is_active;

        $user->name = $data['name'];
        $user->email = $data['email'];

        if (array_key_exists('is_active', $data)) {
            $user->is_active = $data['is_active'];
        }

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();
        $user->syncRoles($data['roles'] ?? []);

        if (array_key_exists('nip_nis', $data)) {
            $this->updateNipNis($user, $data['nip_nis']);
        }

        if ($statusChanged) {
            activity()
                ->causedBy($request->user())
                ->performedOn($user)
                ->useLog('pengguna')
                ->log($data['is_active']
                    ? "Mengaktifkan akun \"{$user->name}\"."
                    : "Menonaktifkan akun \"{$user->name}\".");
        } else {
            activity()
                ->causedBy($request->user())
                ->performedOn($user)
                ->useLog('pengguna')
                ->log("Memperbarui data pengguna \"{$user->name}\".");
        }

        return response()->json($this->presentSingleUser($user));
    }

    /**
     * Tulis NIP/NIS ke profil Guru atau Siswa yang sudah ditautkan ke akun
     * ini (lewat kolom users_id di tabel guru/siswa). Kolom NIP/NIS tidak
     * ada di tabel users — akun tanpa profil guru/siswa yang ditautkan
     * belum bisa diisi NIP/NIS lewat form ini, harus lewat menu Data
     * Guru/Data Siswa terlebih dahulu.
     */
    private function updateNipNis(User $user, ?string $value): void
    {
        $guru = $user->guru()->first();
        $siswa = $guru ? null : $user->siswa()->first();

        if (! $guru && ! $siswa) {
            throw ValidationException::withMessages([
                'nip_nis' => ['Pengguna ini belum ditautkan ke profil Guru/Siswa. Tautkan lewat menu Data Guru/Data Siswa terlebih dahulu.'],
            ]);
        }

        if ($guru) {
            $guru->nip = $value;
            $guru->save();
        } else {
            $siswa->nis = $value;
            $siswa->save();
        }
    }

    private function presentSingleUser(User $user): User
    {
        $user->load(['roles' => fn ($q) => $q->select('id', 'name')->with('permissions:id,name'), 'guru:id,user_id,nip', 'siswa:id,user_id,nis']);
        $user->setAttribute('nip_nis', $user->guru?->nip ?? $user->siswa?->nis);
        $user->setAttribute('identitas_type', $user->guru ? 'guru' : ($user->siswa ? 'siswa' : null));
        $user->unsetRelation('guru')->unsetRelation('siswa');

        return $user;
    }

    /**
     * Reset password akun ke password acak, dilakukan oleh admin lewat
     * halaman Kelola Pengguna. Password baru ditampilkan sekali ke admin
     * (tidak ada sistem email di aplikasi ini untuk mengirimkannya).
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $newPassword = Str::password(10, symbols: false);
        $user->password = $newPassword;
        $user->save();

        activity()
            ->causedBy($request->user())
            ->performedOn($user)
            ->useLog('pengguna')
            ->log("Mereset password pengguna \"{$user->name}\".");

        return response()->json(['password' => $newPassword]);
    }

    /**
     * Daftar sesi (personal access token) aktif milik user — dipakai admin
     * untuk memantau/mengakhiri sesi login di perangkat tertentu.
     */
    public function sessions(User $user): JsonResponse
    {
        $tokens = $user->tokens()
            ->orderByDesc('last_used_at')
            ->get(['id', 'name', 'last_used_at', 'created_at']);

        return response()->json($tokens);
    }

    public function revokeSession(Request $request, User $user, int $tokenId): JsonResponse
    {
        $user->tokens()->where('id', $tokenId)->delete();

        activity()
            ->causedBy($request->user())
            ->performedOn($user)
            ->useLog('pengguna')
            ->log("Mengakhiri sesi login pengguna \"{$user->name}\".");

        return response()->json(['message' => 'Sesi berhasil diakhiri.']);
    }
}

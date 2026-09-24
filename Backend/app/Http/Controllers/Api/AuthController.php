<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrasi akun mandiri (mis. siswa/orang tua/pengunjung).
     * Akun baru tidak diberi role/permission apa pun — akses ke fitur
     * internal (data siswa, nilai, dsb.) baru diberikan setelah staf
     * sekolah menetapkan role yang sesuai.
     *
     * Cukup email + password — nama lengkap belum ditanyakan di sini
     * (kolom 'name' diisi string kosong sebagai penanda "belum
     * dilengkapi"), baru diminta sekali lewat updateMe() setelah kode
     * verifikasi dikonfirmasi.
     *
     * Akun dibuat dalam status belum terverifikasi (email_verified_at
     * null) dan tidak langsung diberi token. Kode verifikasi 6 digit
     * dikirim ke email; token API baru diterbitkan setelah kode itu
     * dikonfirmasi lewat endpoint verifyEmail().
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => '',
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $this->issueAndSendVerificationCode($user);

        return response()->json([
            'message' => 'Registrasi berhasil. Kode verifikasi telah dikirim ke email Anda.',
            'email' => $user->email,
        ], 201);
    }

    /**
     * Konfirmasi kode verifikasi yang dikirim saat registrasi. Kalau
     * cocok dan belum kedaluwarsa, akun ditandai terverifikasi dan
     * langsung diberi token API — pengguna tidak perlu login ulang
     * secara terpisah.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || $user->verification_code !== $data['code']) {
            throw ValidationException::withMessages([
                'code' => ['Kode verifikasi salah.'],
            ]);
        }

        if (! $user->verification_code_expires_at || $user->verification_code_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['Kode verifikasi sudah kedaluwarsa. Silakan minta kode baru.'],
            ]);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'verification_code' => null,
            'verification_code_expires_at' => null,
        ])->save();

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $this->presentUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Kirim ulang kode verifikasi. Selalu balas dengan pesan generik
     * (tidak membocorkan apakah email terdaftar) kecuali akunnya memang
     * ditemukan dan belum terverifikasi.
     */
    public function resendVerificationCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if ($user && ! $user->email_verified_at) {
            $this->issueAndSendVerificationCode($user);
        }

        return response()->json([
            'message' => 'Jika email terdaftar dan belum diverifikasi, kode baru telah dikirim.',
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Auth::guard('web')->validate($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (Schema::hasColumn('users', 'email_verified_at') && ! $user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Akun belum diverifikasi. Silakan cek email Anda untuk kode verifikasi.'],
            ]);
        }

        if (Schema::hasColumn('users', 'is_active') && ! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun ini telah dinonaktifkan.'],
            ]);
        }

        if (Schema::hasColumn('users', 'last_login_at')) {
            $user->forceFill(['last_login_at' => now()])->save();
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $this->presentUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Kirim kode verifikasi lewat mailer default aplikasi (dikonfigurasi
     * di .env — MAIL_MAILER, MAIL_HOST, dst.), bukan lewat integrasi SMTP
     * yang diatur admin per-sekolah di menu Integrasi. Ini supaya alur
     * verifikasi akun selalu bisa mengirim email tanpa syarat admin
     * mengisi form Integrasi dulu.
     */
    private function issueAndSendVerificationCode(User $user): void
    {
        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'verification_code' => $code,
            'verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        try {
            Mail::raw(
                "Kode verifikasi akun SIM Pendidikan Anda: {$code}\n\nKode berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.",
                fn ($message) => $message->to($user->email)->subject('Kode Verifikasi Akun SIM Pendidikan')
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->presentUser($request->user()));
    }

    /**
     * Update profil akun sendiri (nama, email, ganti password). Terpisah
     * dari UserController::update yang butuh permission pengguna.manage —
     * ini bisa dipakai siapa pun yang sudah login untuk akunnya sendiri.
     */
    public function updateMe(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string', 'max:1000'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
            'current_password' => ['required_with:password', 'string'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (! empty($data['password'])) {
            if (! Auth::guard('web')->validate(['email' => $user->email, 'password' => $data['current_password']])) {
                throw ValidationException::withMessages([
                    'current_password' => ['Password saat ini salah.'],
                ]);
            }

            $user->password = $data['password'];
        }

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->phone = $data['phone'] ?? null;

        // Alamat & jenis kelamin hanya diubah kalau memang dikirim — form ganti
        // password tidak menyertakannya dan tidak boleh mengosongkannya.
        if (array_key_exists('alamat', $data)) {
            $user->alamat = $data['alamat'];
        }
        if (array_key_exists('jenis_kelamin', $data)) {
            $user->jenis_kelamin = $data['jenis_kelamin'];
        }
        $user->save();

        // Siswa/Guru punya kolom nama/alamat/jenis_kelamin sendiri yang terpisah
        // dari users; sinkronkan supaya nama di dashboard ikut berubah.
        $profileSync = ['nama' => $data['name']];
        foreach (['alamat', 'jenis_kelamin'] as $field) {
            if (array_key_exists($field, $data)) {
                $profileSync[$field] = $data[$field];
            }
        }
        Siswa::where('user_id', $user->id)->update($profileSync);
        Guru::where('user_id', $user->id)->update($profileSync);

        return response()->json($this->presentUser($user));
    }

    /**
     * Ganti foto profil akun sendiri. Disimpan di disk 'public' tenant
     * (bukan lewat symlink `public/storage` bawaan Laravel, karena tiap
     * tenant punya direktori storage terpisah) dan disajikan lewat route
     * AvatarController::show.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->avatar = $request->file('avatar')->store('avatars', 'public');
        $user->save();

        return response()->json($this->presentUser($user));
    }

    /**
     * Sertakan daftar nama permission efektif (langsung + via role) supaya
     * frontend bisa menentukan menu/aksi apa saja yang boleh ditampilkan
     * tanpa perlu memanggil endpoint tambahan.
     */
    private function presentUser(User $user): User
    {
        if (Schema::hasTable('roles')) {
            $user->load('roles');
            $user->setAttribute('all_permissions', $user->getAllPermissions()->pluck('name')->values());
        }

        if (Schema::hasColumn('users', 'avatar')) {
            $user->setAttribute('avatar_url', $user->avatar ? "/avatar/{$user->avatar}" : null);
        }

        return $user;
    }
}

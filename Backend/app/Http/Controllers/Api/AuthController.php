<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordChangedMail;
use App\Mail\ResetPasswordMail;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use App\Http\Middleware\EnsureTwoFactorEnabled;
use App\Support\AuditAuth;
use App\Support\KirimEmail;
use App\Support\PeranAktif;
use App\Support\Recaptcha;
use App\Support\SelisihJamTotp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Hash bcrypt acak, dipakai menyamakan waktu respons login untuk akun yang tidak ada. */
    private const HASH_PALSU = '$2y$12$7topMPKzN2f/B2ZjxgOdQ./hl9TuTkGz.AWCYgzyP/MoKQjqmlbku';

    /** Rincian alamat profil; kolom yang sama ada di users, guru, dan siswa. */
    private const KOLOM_ALAMAT = ['alamat', 'rt_rw', 'kelurahan', 'kecamatan', 'kota', 'kode_pos'];

    /**
     * Minta link reset password. Selalu balas dengan pesan generik (tidak
     * membocorkan apakah email terdaftar) — hanya benar-benar mengirim link
     * kalau akunnya ditemukan dan kolom password_reset_token tersedia
     * (fitur ini saat ini hanya berlaku untuk akun per-sekolah, bukan akun
     * Super Admin di database central).
     *
     * Rate limit (3x/jam per email) selalu dihitung terlebih dulu — terlepas
     * dari apakah akunnya benar-benar ada — supaya perilaku endpoint ini
     * tidak jadi celah untuk menebak email mana yang terdaftar.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'recaptcha_token' => ['nullable', 'string'],
        ]);

        $email = mb_strtolower(trim($data['email']));

        if (! Recaptcha::lolos($request->string('recaptcha_token')->toString())) {
            throw ValidationException::withMessages([
                'recaptcha_token' => ['Verifikasi keamanan gagal. Silakan muat ulang halaman dan coba lagi.'],
            ]);
        }

        $limitKey = $this->forgotPasswordAttemptKey($email);

        if (! RateLimiter::tooManyAttempts($limitKey, 3)) {
            RateLimiter::hit($limitKey, 3600);

            if (Schema::hasColumn('users', 'password_reset_token')) {
                $user = User::where('email', $email)->first();

                if ($user) {
                    $this->issueAndSendPasswordResetLink($user);
                }
            }
        }

        return response()->json([
            'message' => 'Jika email terdaftar, link reset password telah dikirim.',
        ]);
    }

    /**
     * Ganti password lewat link reset — tidak pernah menanyakan password
     * lama. Token dicocokkan lewat hash (timing-safe), sekali pakai, dan
     * kedaluwarsa 60 menit. Setelah berhasil: semua sesi login (Sanctum
     * token) dihapus dan notifikasi "password baru saja diganti" dikirim.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->uncompromised()],
        ]);

        $email = mb_strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        if (
            ! $user
            || ! Schema::hasColumn('users', 'password_reset_token')
            || ! is_string($user->password_reset_token)
            || ! hash_equals($user->password_reset_token, hash('sha256', $data['token']))
        ) {
            throw ValidationException::withMessages([
                'token' => ['Link reset password tidak valid. Silakan minta link baru.'],
            ]);
        }

        if (! $user->password_reset_expires_at || $user->password_reset_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'token' => ['Link reset password sudah kedaluwarsa. Silakan minta link baru.'],
            ]);
        }

        $user->forceFill([
            'password' => $data['password'],
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
        ])->save();

        // Ganti password lewat jalur ini = anggap perangkat lain berpotensi
        // sudah tidak dipercaya — keluarkan semua sesi login yang aktif.
        $user->tokens()->delete();

        $this->sendPasswordChangedNotice($user, (string) $request->ip());
        AuditAuth::catat('Password direset lewat link lupa password.', $user);

        return response()->json([
            'message' => 'Password berhasil diubah. Silakan masuk dengan password baru Anda.',
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => ['required_without:email', 'nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        // Satu kolom untuk email, NIP, atau NISN: ada "@" = email, selain itu
        // username. Domain central (Super Admin) tidak punya kolom username.
        $identitas = trim((string) ($data['login'] ?? $data['email']));
        $pakaiEmail = str_contains($identitas, '@') || ! Schema::hasColumn('users', 'username');

        $kunciGagal = 'login-gagal:'.(tenant('id') ?? 'central').':'.mb_strtolower($identitas).'|'.$request->ip();
        $maksGagal = config('sim.keamanan.login_maks_gagal');

        if (RateLimiter::tooManyAttempts($kunciGagal, $maksGagal)) {
            $menit = (int) ceil(RateLimiter::availableIn($kunciGagal) / 60);
            throw ValidationException::withMessages([
                'login' => ["Terlalu banyak percobaan login yang gagal. Coba lagi dalam {$menit} menit."],
            ])->status(429);
        }

        $user = User::where($pakaiEmail ? 'email' : 'username', $identitas)->first();

        // Hash tetap dicek walau akun tidak ada, supaya waktu respons tidak
        // membocorkan apakah sebuah email/NIP/NISN terdaftar.
        $passwordBenar = Hash::check($data['password'], $user?->password ?? self::HASH_PALSU);

        if (! $user || ! $passwordBenar) {
            RateLimiter::hit($kunciGagal, config('sim.keamanan.login_kunci_menit') * 60);
            $terkunci = RateLimiter::tooManyAttempts($kunciGagal, $maksGagal);

            AuditAuth::catat(
                $terkunci ? 'Login dikunci karena terlalu banyak percobaan gagal.' : 'Login gagal: password salah atau akun tidak ditemukan.',
                $user,
                ['identitas' => $identitas],
            );

            throw ValidationException::withMessages([
                'login' => ['Email/NIP/NISN atau password salah.'],
            ]);
        }

        RateLimiter::clear($kunciGagal);

        // tenant() bernilai null di domain central (Super Admin) — cek ini
        // hanya relevan untuk login lewat domain sekolah, ditolak sebelum
        // memeriksa apa pun tentang akun user itu sendiri.
        if (tenant('status') !== null && tenant('status') !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Sekolah ini sedang dinonaktifkan. Hubungi Super Admin untuk informasi lebih lanjut.'],
            ]);
        }

        if (Schema::hasColumn('users', 'email_verified_at') && ! $user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Akun belum diaktifkan. Buka link undangan di email Anda, atau hubungi admin sekolah.'],
            ]);
        }

        if (Schema::hasColumn('users', 'is_active') && ! $user->is_active) {
            AuditAuth::catat('Login ditolak: akun nonaktif.', $user);
            throw ValidationException::withMessages([
                'email' => ['Akun ini telah dinonaktifkan.'],
            ]);
        }

        // Akun dengan 2FA aktif belum langsung dapat token; harus lewat
        // verifyTwoFactor() dengan kode TOTP/pemulihan. Challenge diikat ke
        // sekolah supaya tidak bisa dipakai ulang di domain sekolah lain.
        if (Schema::hasColumn('users', 'two_factor_confirmed_at') && $user->two_factor_confirmed_at) {
            $challenge = encrypt([
                'user_id' => $user->id,
                'tenant' => tenant('id'),
                'expires' => now()->addMinutes(5)->timestamp,
            ]);

            return response()->json([
                'requires_2fa' => true,
                'challenge' => $challenge,
            ]);
        }

        if (Schema::hasColumn('users', 'last_login_at')) {
            $user->forceFill(['last_login_at' => now()])->save();
        }

        $token = $user->createToken('api-token')->plainTextToken;

        if (tenant()) {
            PeranAktif::terapkan($user, null);
        }

        AuditAuth::catat('Login berhasil.', $user);

        return response()->json([
            'user' => $this->presentUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Langkah kedua login untuk akun dengan 2FA aktif — menyelesaikan
     * "challenge" dari login() dengan kode TOTP dari aplikasi authenticator
     * ATAU salah satu kode pemulihan (dipakai sekali, langsung dicoret dari
     * daftar begitu terpakai).
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $data = $request->validate([
            'challenge' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        try {
            $payload = decrypt($data['challenge']);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'code' => ['Sesi verifikasi tidak valid. Silakan login ulang.'],
            ]);
        }

        if (! is_array($payload) || ($payload['expires'] ?? 0) < now()->timestamp) {
            throw ValidationException::withMessages([
                'code' => ['Sesi verifikasi sudah kedaluwarsa. Silakan login ulang.'],
            ]);
        }

        if (($payload['tenant'] ?? null) !== tenant('id')) {
            throw ValidationException::withMessages([
                'code' => ['Sesi verifikasi tidak valid. Silakan login ulang.'],
            ]);
        }

        $user = User::find($payload['user_id']);

        if (! $user || ! $user->two_factor_confirmed_at) {
            throw ValidationException::withMessages([
                'code' => ['Akun tidak ditemukan.'],
            ]);
        }

        // Kode TOTP cuma 6 digit: batasi tebakan per akun.
        $kunci2fa = '2fa-gagal:'.(tenant('id') ?? 'central').':'.$user->id;
        if (RateLimiter::tooManyAttempts($kunci2fa, 5)) {
            throw ValidationException::withMessages([
                'code' => ['Terlalu banyak kode yang salah. Silakan login ulang beberapa menit lagi.'],
            ])->status(429);
        }

        if (! $this->verifyTwoFactorCode($user, $data['code'])) {
            RateLimiter::hit($kunci2fa, 15 * 60);
            $selisih = SelisihJamTotp::cari($user->two_factor_secret, $data['code']);
            AuditAuth::catat('Verifikasi 2FA gagal: kode salah.', $user, ['selisih_jam_detik' => $selisih]);
            throw ValidationException::withMessages([
                'code' => [$selisih !== null ? SelisihJamTotp::pesan($selisih) : 'Kode verifikasi salah.'],
            ]);
        }

        RateLimiter::clear($kunci2fa);

        if (Schema::hasColumn('users', 'last_login_at')) {
            $user->forceFill(['last_login_at' => now()])->save();
        }

        $token = $user->createToken('api-token')->plainTextToken;

        if (tenant()) {
            PeranAktif::terapkan($user, null);
        }

        AuditAuth::catat('Login berhasil.', $user);

        return response()->json([
            'user' => $this->presentUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Coba cocokkan kode 6-digit TOTP dulu; kalau tidak cocok, coba sebagai
     * kode pemulihan (case-insensitive) — kalau cocok, kode itu langsung
     * dihapus dari daftar supaya tidak bisa dipakai ulang.
     */
    private function verifyTwoFactorCode(User $user, string $code): bool
    {
        $google2fa = new \PragmaRX\Google2FA\Google2FA();

        if ($google2fa->verifyKey($user->two_factor_secret, $code)) {
            return true;
        }

        $recoveryCodes = $user->two_factor_recovery_codes ?? [];
        $normalizedInput = strtoupper(trim($code));
        $matchIndex = array_search($normalizedInput, array_map('strtoupper', $recoveryCodes), true);

        if ($matchIndex === false) {
            return false;
        }

        unset($recoveryCodes[$matchIndex]);
        $user->forceFill(['two_factor_recovery_codes' => array_values($recoveryCodes)])->save();

        return true;
    }


    /**
     * Generate token acak 64 karakter, simpan HASH-nya saja dengan
     * kedaluwarsa 60 menit (jauh lebih pendek dari link verifikasi email,
     * karena reset password lebih sensitif), lalu kirim link lewat queue
     * berikut info IP & waktu peminta supaya pemilik akun bisa menyadari
     * kalau bukan dia yang meminta.
     */
    private function issueAndSendPasswordResetLink(User $user): void
    {
        $token = bin2hex(random_bytes(32));

        $user->forceFill([
            'password_reset_token' => hash('sha256', $token),
            'password_reset_expires_at' => now()->addMinutes(60),
        ])->save();

        $url = $this->buildPasswordResetUrl($user->email, $token);
        $namaSekolah = tenant() ? (tenant('nama_sekolah') ?: 'SIM Pendidikan') : 'SIM Pendidikan';

        KirimEmail::segera($user->email, new ResetPasswordMail(
            $namaSekolah,
            $url,
            (string) request()->ip(),
            now()->translatedFormat('d F Y H:i').' WIB',
        ));
    }

    private function sendPasswordChangedNotice(User $user, string $ip): void
    {
        $namaSekolah = tenant() ? (tenant('nama_sekolah') ?: 'SIM Pendidikan') : 'SIM Pendidikan';

        KirimEmail::segera($user->email, new PasswordChangedMail(
            $namaSekolah,
            now()->translatedFormat('d F Y H:i').' WIB',
            $ip,
        ));
    }

    /**
     * Link menunjuk ke FRONTEND, bukan
     * langsung ke API, supaya token tidak "termakan" pemindai email.
     */
    private function buildPasswordResetUrl(string $email, string $token): string
    {
        $scheme = request()->getScheme();
        $host = request()->getHost();
        $port = env('FRONTEND_PORT');
        $base = $scheme.'://'.$host.($port ? ":{$port}" : '');

        return $base.'/reset-password?'.http_build_query(['token' => $token, 'email' => $email]);
    }

    private function forgotPasswordAttemptKey(string $email): string
    {
        return 'forgot-password-email:'.tenant('id').':'.$email;
    }

    /**
     * Ganti peran aktif untuk sesi login ini. Hanya peran yang benar-benar
     * dimiliki akun yang bisa dipilih.
     */
    public function setActiveRole(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'role' => ['required', 'string', Rule::in($user->peranTersedia ?? [])],
        ], [
            'role.in' => 'Anda tidak memiliki peran tersebut.',
        ]);

        $user->currentAccessToken()->forceFill(['active_role' => $data['role']])->save();
        PeranAktif::terapkan($user, $data['role']);

        activity()->causedBy($user)->performedOn($user)->useLog('pengguna')
            ->withProperties(['peran' => $data['role']])
            ->log("Beralih ke peran \"{$data['role']}\".");

        return response()->json(['user' => $this->presentUser($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        AuditAuth::catat('Logout.', $request->user());

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
            'rt_rw' => ['nullable', 'string', 'max:20'],
            'kelurahan' => ['nullable', 'string', 'max:255'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'kota' => ['nullable', 'string', 'max:255'],
            'kode_pos' => ['nullable', 'regex:/^[0-9]{5}$/'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
            'current_password' => ['required_with:password', 'string'],
            'password' => [
                'nullable', 'string', 'different:current_password',
                Password::min(8)->mixedCase()->numbers()->uncompromised(),
            ],
        ], [
            'kode_pos.regex' => 'Kode pos harus 5 digit angka.',
        ]);

        $gantiPassword = ! empty($data['password']);

        if ($gantiPassword) {
            if (! Hash::check($data['current_password'], $user->password)) {
                AuditAuth::catat('Ganti password gagal: password saat ini salah.', $user);
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
        foreach (self::KOLOM_ALAMAT as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = $data[$field];
            }
        }
        if (array_key_exists('jenis_kelamin', $data)) {
            $user->jenis_kelamin = $data['jenis_kelamin'];
        }
        $user->save();

        if ($gantiPassword) {
            $this->setelahGantiPasswordSendiri($request, $user);
        }

        // Siswa/Guru punya kolom nama/alamat/jenis_kelamin sendiri yang terpisah
        // dari users; sinkronkan supaya nama di dashboard ikut berubah. Sama
        // seperti di atas, alamat/jenis_kelamin hanya ikut disinkron kalau dikirim.
        // jenis_kelamin di tabel guru/siswa wajib terisi, jadi nilai kosong
        // tidak disinkron (data di sana tetap seperti semula).
        $profileSync = ['nama' => $data['name']];
        foreach (self::KOLOM_ALAMAT as $field) {
            if (array_key_exists($field, $data)) {
                $profileSync[$field] = $data[$field];
            }
        }
        if (! empty($data['jenis_kelamin'])) {
            $profileSync['jenis_kelamin'] = $data['jenis_kelamin'];
        }
        Siswa::where('user_id', $user->id)->update($profileSync);
        Guru::where('user_id', $user->id)->update($profileSync);

        return response()->json($this->presentUser($user));
    }

    /**
     * Ganti password sendiri — satu-satunya aksi (selain lihat profil &
     * logout) yang boleh dilakukan akun yang wajib ganti password. Sesi di
     * perangkat lain dikeluarkan; sesi yang sedang dipakai tetap aktif.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required', 'string', 'confirmed', 'different:current_password',
                Password::min(8)->mixedCase()->numbers()->uncompromised(),
            ],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            AuditAuth::catat('Ganti password gagal: password saat ini salah.', $user);
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini salah.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();

        $this->setelahGantiPasswordSendiri($request, $user);

        return response()->json([
            'message' => 'Password berhasil diganti.',
            'user' => $this->presentUser($user),
        ]);
    }

    /**
     * Setelah pemilik akun mengganti passwordnya sendiri: sesi di perangkat
     * lain dikeluarkan (sesi saat ini tetap), dicatat di audit, dan pemilik
     * akun diberi tahu lewat email.
     */
    private function setelahGantiPasswordSendiri(Request $request, User $user): void
    {
        $user->tokens()->whereKeyNot($user->currentAccessToken()->id)->delete();
        AuditAuth::catat('Password diganti oleh pemilik akun.', $user);
        $this->sendPasswordChangedNotice($user, (string) $request->ip());
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
            // Relasi roles mungkin sudah dibatasi ke peran aktif oleh
            // PeranAktif — jangan dimuat ulang dari database.
            $user->loadMissing('roles');
            $user->setAttribute('all_permissions', $user->getAllPermissions()->pluck('name')->values());
            $user->setAttribute('available_roles', $user->peranTersedia ?? $user->roles->pluck('name')->values()->all());
            $user->setAttribute('active_role', $user->peranDipilih);
        }

        if (tenant() && Schema::hasColumn('users', 'two_factor_confirmed_at')) {
            $wajib = config('sim.keamanan.wajib_2fa_admin')
                && array_intersect(EnsureTwoFactorEnabled::PERAN_WAJIB, $user->peranTersedia ?? $user->getRoleNames()->all());
            $user->setAttribute('two_factor_required', (bool) $wajib && ! $user->two_factor_confirmed_at);
        }

        if (Schema::hasColumn('users', 'avatar')) {
            $user->setAttribute('avatar_url', $user->avatar ? "/avatar/{$user->avatar}" : null);
        }

        // tenant() null di domain central (Super Admin) — modul opsional
        // cuma relevan buat akun sekolah, dipakai frontend untuk
        // menyembunyikan menu yang dinonaktifkan Super Admin.
        if (tenant()) {
            $user->setAttribute('enabled_modules', tenant()->resolvedModuleSettings());
        }

        return $user;
    }
}

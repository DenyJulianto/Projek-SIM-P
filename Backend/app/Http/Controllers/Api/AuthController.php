<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordChangedMail;
use App\Mail\ResetPasswordMail;
use App\Mail\VerifyEmailMail;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrasi akun mandiri (mis. siswa/orang tua/pengunjung). Akun baru
     * tidak diberi role/permission apa pun — akses ke fitur internal baru
     * diberikan setelah staf sekolah menetapkan role yang sesuai.
     *
     * Akun dibuat berstatus belum terverifikasi dan TIDAK langsung diberi
     * token (tidak auto-login). Link verifikasi (bukan kode) dikirim lewat
     * queue supaya permintaan ini tidak menunggu SMTP; token disimpan
     * sebagai hash, kedaluwarsa 24 jam, sekali pakai.
     */
    public function register(Request $request): JsonResponse
    {
        $ip = (string) $request->ip();
        $emailMentah = mb_strtolower(trim((string) $request->input('email', '')));

        $ipKey = $this->registerAttemptKey('ip', $ip);
        $emailKey = $this->registerAttemptKey('email', $emailMentah);

        if (RateLimiter::tooManyAttempts($ipKey, 5) || ($emailMentah !== '' && RateLimiter::tooManyAttempts($emailKey, 5))) {
            $this->logRegistrasi($ip, $emailMentah, 'diblokir', 'Melebihi batas percobaan registrasi.');

            abort(429, 'Terlalu banyak percobaan registrasi. Silakan coba lagi dalam 1 jam.');
        }

        RateLimiter::hit($ipKey, 3600);
        if ($emailMentah !== '') {
            RateLimiter::hit($emailKey, 3600);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->uncompromised()],
            'recaptcha_token' => ['nullable', 'string'],
        ]);

        if (! $this->verifyRecaptcha($request->string('recaptcha_token')->toString())) {
            $this->logRegistrasi($ip, $emailMentah, 'gagal', 'Verifikasi captcha gagal.');

            throw ValidationException::withMessages([
                'recaptcha_token' => ['Verifikasi keamanan gagal. Silakan muat ulang halaman dan coba lagi.'],
            ]);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->forceFill(['ip_address' => $ip])->save();

        $this->issueAndSendVerificationLink($user);

        $this->logRegistrasi($ip, $user->email, 'berhasil', null);

        return response()->json([
            'message' => 'Registrasi berhasil. Silakan cek email Anda untuk link verifikasi (berlaku 24 jam).',
            'email' => $user->email,
        ], 201);
    }

    /**
     * Konfirmasi link verifikasi yang dikirim saat registrasi. Token dari
     * URL di-hash lalu dicocokkan dengan hash di database (token asli
     * tidak pernah disimpan). Kalau cocok dan belum kedaluwarsa, akun
     * ditandai terverifikasi dan tokennya dihapus (sekali pakai) — TIDAK
     * ada auto-login, pengguna diarahkan ke halaman login secara terpisah.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();
        $hashToken = hash('sha256', $data['token']);

        if (! $user || ! $user->email_verification_token || ! hash_equals($user->email_verification_token, $hashToken)) {
            throw ValidationException::withMessages([
                'token' => ['Link verifikasi tidak valid.'],
            ]);
        }

        if (! $user->email_verification_expires_at || $user->email_verification_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'token' => ['Link verifikasi sudah kedaluwarsa. Silakan minta link baru.'],
            ]);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'email_verification_token' => null,
            'email_verification_expires_at' => null,
        ])->save();

        return response()->json([
            'message' => 'Email berhasil diverifikasi. Silakan masuk dengan akun Anda.',
        ]);
    }

    /**
     * Kirim ulang link verifikasi. Selalu balas dengan pesan generik (tidak
     * membocorkan apakah email terdaftar), dan dibatasi 60 detik antar
     * permintaan serta maksimal 5x per jam per email.
     */
    public function resendVerificationCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = mb_strtolower(trim($data['email']));
        $cooldownKey = 'resend-verifikasi-cooldown:'.tenant('id').':'.$email;
        $hourlyKey = 'resend-verifikasi-jam:'.tenant('id').':'.$email;

        if (RateLimiter::tooManyAttempts($cooldownKey, 1)) {
            throw ValidationException::withMessages([
                'email' => ['Mohon tunggu sebentar sebelum meminta link baru.'],
            ]);
        }

        if (RateLimiter::tooManyAttempts($hourlyKey, 5)) {
            throw ValidationException::withMessages([
                'email' => ['Terlalu banyak permintaan. Silakan coba lagi dalam 1 jam.'],
            ]);
        }

        RateLimiter::hit($cooldownKey, 60);
        RateLimiter::hit($hourlyKey, 3600);

        $user = User::where('email', $data['email'])->first();

        if ($user && ! $user->email_verified_at) {
            $this->issueAndSendVerificationLink($user);
        }

        return response()->json([
            'message' => 'Jika email terdaftar dan belum diverifikasi, link baru telah dikirim.',
        ]);
    }

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

        if (! $this->verifyRecaptcha($request->string('recaptcha_token')->toString())) {
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

        return response()->json([
            'message' => 'Password berhasil diubah. Silakan masuk dengan password baru Anda.',
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
                'email' => ['Akun belum diverifikasi. Silakan cek email Anda untuk link verifikasi.'],
            ]);
        }

        if (Schema::hasColumn('users', 'is_active') && ! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun ini telah dinonaktifkan.'],
            ]);
        }

        // 2FA cuma pernah bisa aktif untuk akun Super Admin (kolomnya cuma
        // ada di database central) — kalau aktif, belum langsung dapat
        // token; harus lewat verifyTwoFactor() dulu dengan kode TOTP/
        // pemulihan yang valid.
        if (Schema::hasColumn('users', 'two_factor_confirmed_at') && $user->two_factor_confirmed_at) {
            $challenge = encrypt(['user_id' => $user->id, 'expires' => now()->addMinutes(5)->timestamp]);

            return response()->json([
                'requires_2fa' => true,
                'challenge' => $challenge,
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

        $user = User::find($payload['user_id']);

        if (! $user || ! $user->two_factor_confirmed_at) {
            throw ValidationException::withMessages([
                'code' => ['Akun tidak ditemukan.'],
            ]);
        }

        if (! $this->verifyTwoFactorCode($user, $data['code'])) {
            throw ValidationException::withMessages([
                'code' => ['Kode verifikasi salah.'],
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
     * Generate token acak 64 karakter, simpan HASH-nya saja (bukan token
     * asli) dengan kedaluwarsa 24 jam, lalu kirim link berisi token asli
     * lewat queue (dikonfigurasi lewat mailer default aplikasi di .env,
     * bukan integrasi SMTP per-sekolah, supaya verifikasi akun selalu bisa
     * mengirim email tanpa syarat admin mengisi form Integrasi dulu).
     */
    private function issueAndSendVerificationLink(User $user): void
    {
        $token = bin2hex(random_bytes(32));

        $user->forceFill([
            'email_verification_token' => hash('sha256', $token),
            'email_verification_expires_at' => now()->addHours(24),
        ])->save();

        $url = $this->buildVerificationUrl($user->email, $token);
        $namaSekolah = tenant() ? (tenant('nama_sekolah') ?: 'SIM Pendidikan') : 'SIM Pendidikan';

        try {
            Mail::to($user->email)->queue(new VerifyEmailMail($namaSekolah, $url));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Link verifikasi menunjuk ke FRONTEND (bukan langsung ke API) supaya
     * token tidak "termakan" oleh pemindai/antivirus email yang membuka
     * link secara otomatis — halaman frontend baru mengonfirmasi token
     * lewat POST ke verifyEmail() saat pengguna benar-benar membukanya.
     */
    private function buildVerificationUrl(string $email, string $token): string
    {
        $scheme = request()->getScheme();
        $host = request()->getHost();
        $port = env('FRONTEND_PORT');
        $base = $scheme.'://'.$host.($port ? ":{$port}" : '');

        return $base.'/verify?'.http_build_query(['token' => $token, 'email' => $email]);
    }

    /**
     * Verifikasi reCAPTCHA v3. Kalau secret belum dikonfigurasi (dev/test),
     * verifikasi dilewati otomatis. Kalau sudah dikonfigurasi tapi token
     * tidak dikirim atau score di bawah 0.5, dianggap gagal.
     */
    private function verifyRecaptcha(?string $token): bool
    {
        $secret = config('services.recaptcha.secret');

        if (! $secret) {
            return true;
        }

        if (! $token) {
            return false;
        }

        try {
            $response = Http::asForm()->timeout(5)->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secret,
                'response' => $token,
                'remoteip' => request()->ip(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return false;
        }

        $result = $response->json() ?? [];

        return ($result['success'] ?? false) === true && (float) ($result['score'] ?? 0) >= 0.5;
    }

    private function registerAttemptKey(string $type, string $value): string
    {
        return 'register-'.$type.':'.tenant('id').':'.$value;
    }

    /**
     * Catat setiap percobaan registrasi (berhasil, gagal, atau diblokir
     * rate limit) ke activity log untuk audit — tanpa causer karena
     * pengguna belum login saat ini terjadi.
     */
    private function logRegistrasi(string $ip, string $email, string $hasil, ?string $alasan): void
    {
        try {
            activity('registrasi')
                ->withProperties(array_filter([
                    'ip' => $ip,
                    'email' => $email ?: null,
                    'hasil' => $hasil,
                    'alasan' => $alasan,
                ]))
                ->log("Percobaan registrasi: {$hasil}");
        } catch (\Throwable $e) {
            report($e);
        }
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

        try {
            Mail::to($user->email)->queue(new ResetPasswordMail(
                $namaSekolah,
                $url,
                (string) request()->ip(),
                now()->translatedFormat('d F Y H:i').' WIB',
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function sendPasswordChangedNotice(User $user, string $ip): void
    {
        $namaSekolah = tenant() ? (tenant('nama_sekolah') ?: 'SIM Pendidikan') : 'SIM Pendidikan';

        try {
            Mail::to($user->email)->queue(new PasswordChangedMail(
                $namaSekolah,
                now()->translatedFormat('d F Y H:i').' WIB',
                $ip,
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Sama seperti buildVerificationUrl(): link menunjuk ke FRONTEND, bukan
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
        // dari users; sinkronkan supaya nama di dashboard ikut berubah. Sama
        // seperti di atas, alamat/jenis_kelamin hanya ikut disinkron kalau dikirim.
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

        // tenant() null di domain central (Super Admin) — modul opsional
        // cuma relevan buat akun sekolah, dipakai frontend untuk
        // menyembunyikan menu yang dinonaktifkan Super Admin.
        if (tenant()) {
            $user->setAttribute('enabled_modules', tenant()->resolvedModuleSettings());
        }

        return $user;
    }
}

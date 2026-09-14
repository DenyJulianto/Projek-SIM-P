<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

/**
 * Two-factor authentication (TOTP) khusus akun Super Admin — diminta
 * karena aksesnya paling luas & kritikal di seluruh platform. Sengaja
 * tidak dipasang untuk akun sekolah (di luar cakupan permintaan ini).
 * Alur verifikasi saat login ada di AuthController::login()/verifyTwoFactor().
 */
class TwoFactorController extends Controller
{
    private const ISSUER = 'SIM Pendidikan';

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'enabled' => $user->two_factor_confirmed_at !== null,
            'confirmed_at' => $user->two_factor_confirmed_at,
        ]);
    }

    /**
     * Mulai pengaturan 2FA: buat secret baru (BELUM aktif sampai dikonfirmasi
     * lewat confirm() dengan kode yang benar-benar tervalidasi dari aplikasi
     * authenticator). Tidak ada gambar QR (tidak ada library QR di server) —
     * kunci ditampilkan sebagai teks untuk dimasukkan manual, cara yang tetap
     * didukung semua aplikasi authenticator standar.
     */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();
        $google2fa = new Google2FA();

        $secret = $google2fa->generateSecretKey();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json([
            'secret' => $secret,
            'manual_entry_key' => trim(chunk_split($secret, 4, ' ')),
            'otpauth_url' => $this->otpAuthUrl($user->email, $secret),
        ]);
    }

    /**
     * Konfirmasi pengaturan 2FA dengan kode 6-digit dari aplikasi
     * authenticator — baru setelah ini 2FA benar-benar aktif dan wajib
     * dipakai saat login berikutnya. Kode pemulihan dibuat sekali di sini.
     */
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'code' => ['Belum ada proses pengaturan 2FA yang dimulai.'],
            ]);
        }

        $google2fa = new Google2FA();

        if (! $google2fa->verifyKey($user->two_factor_secret, $data['code'])) {
            throw ValidationException::withMessages([
                'code' => ['Kode verifikasi salah. Pastikan waktu perangkat Anda akurat.'],
            ]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => $recoveryCodes,
            'two_factor_confirmed_at' => now(),
        ])->save();

        return response()->json([
            'message' => '2FA berhasil diaktifkan.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Matikan 2FA — wajib memasukkan ulang password saat ini sebagai
     * pengaman, supaya sesi yang sedang terbuka tidak bisa dipakai
     * mematikan 2FA begitu saja kalau perangkatnya diambil alih orang lain.
     */
    public function disable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Auth::guard('web')->validate(['email' => $user->email, 'password' => $data['password']])) {
            throw ValidationException::withMessages([
                'password' => ['Password salah.'],
            ]);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json(['message' => '2FA berhasil dimatikan.']);
    }

    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_confirmed_at) {
            throw ValidationException::withMessages([
                'password' => ['2FA belum aktif.'],
            ]);
        }

        if (! Auth::guard('web')->validate(['email' => $user->email, 'password' => $data['password']])) {
            throw ValidationException::withMessages([
                'password' => ['Password salah.'],
            ]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();
        $user->forceFill(['two_factor_recovery_codes' => $recoveryCodes])->save();

        return response()->json(['recovery_codes' => $recoveryCodes]);
    }

    private function otpAuthUrl(string $email, string $secret): string
    {
        $label = rawurlencode(self::ISSUER.':'.$email);
        $issuer = rawurlencode(self::ISSUER);

        return "otpauth://totp/{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * @return array<int, string>
     */
    private function generateRecoveryCodes(): array
    {
        return collect(range(1, 8))
            ->map(fn () => strtoupper(Str::random(4).'-'.Str::random(4)))
            ->all();
    }
}

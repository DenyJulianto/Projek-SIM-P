<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\UndanganStaf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Aktivasi akun staf lewat link undangan. Link = signed URL (tidak bisa
 * diubah, punya masa berlaku) + token sekali pakai yang dicocokkan dengan
 * hash di database.
 */
class UndanganController extends Controller
{
    public function show(Request $request, User $user): JsonResponse
    {
        $this->periksa($request, $user);

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'sekolah' => tenant('nama_sekolah'),
        ]);
    }

    public function terima(Request $request, User $user): JsonResponse
    {
        $this->periksa($request, $user);

        $data = $request->validate([
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->uncompromised()],
        ]);

        $diterima = User::whereKey($user->id)
            ->where('invitation_token', hash('sha256', (string) $request->query('token')))
            ->update(['invitation_token' => null, 'invitation_expires_at' => null]);

        if ($diterima === 0) {
            $this->tolak('Link undangan sudah dipakai.');
        }

        $user->forceFill([
            'password' => $data['password'],
            'email_verified_at' => $user->email_verified_at ?? now(),
            'is_active' => true,
            'must_change_password' => false,
        ])->save();

        activity()->causedBy($user)->performedOn($user)->useLog('pengguna')
            ->log('Mengaktifkan akun lewat undangan.');

        return response()->json(['message' => 'Akun berhasil diaktifkan. Silakan masuk dengan email dan password baru Anda.']);
    }

    /** Admin mengirim ulang undangan; link lama otomatis tidak berlaku. */
    public function kirimUlang(Request $request, User $user): JsonResponse
    {
        if ($user->email_verified_at && ! $user->invitation_token) {
            throw ValidationException::withMessages(['user' => ['Akun ini sudah aktif, tidak perlu undangan.']]);
        }

        try {
            $terkirim = UndanganStaf::kirim($user);
        } catch (\Throwable $e) {
            report($e);
            $terkirim = false;
        }

        if (! $terkirim) {
            abort(503, 'Email undangan tidak dapat dikirim saat ini. Periksa koneksi internet/pengaturan email, lalu coba lagi.');
        }

        activity()->causedBy($request->user())->performedOn($user)->useLog('pengguna')
            ->log("Mengirim ulang undangan akun ke \"{$user->name}\".");

        return response()->json(['message' => "Undangan dikirim ulang ke {$user->email}."]);
    }

    private function periksa(Request $request, User $user): void
    {
        if (! URL::hasCorrectSignature($request, absolute: false)) {
            $this->tolak('Link undangan tidak valid.');
        }

        if (! URL::signatureHasNotExpired($request)) {
            $this->tolak('Link undangan sudah kedaluwarsa. Minta admin sekolah mengirim ulang undangan.');
        }

        if (! $user->invitation_token) {
            $this->tolak($user->email_verified_at
                ? 'Akun ini sudah aktif. Silakan masuk.'
                : 'Link undangan tidak valid.');
        }

        if (! hash_equals($user->invitation_token, hash('sha256', (string) $request->query('token')))) {
            $this->tolak('Link undangan ini sudah digantikan undangan yang lebih baru. Gunakan email undangan terbaru.');
        }
    }

    private function tolak(string $pesan): never
    {
        throw ValidationException::withMessages(['undangan' => [$pesan]]);
    }
}

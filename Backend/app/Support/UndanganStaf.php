<?php

declare(strict_types=1);

namespace App\Support;

use App\Mail\UndanganStafMail;
use App\Models\User;
use Illuminate\Support\Facades\URL;

/**
 * Menerbitkan undangan aktivasi akun staf. Link berupa signed URL dengan
 * masa berlaku, ditambah token sekali pakai (hanya hash-nya disimpan) —
 * jadi link tidak bisa diubah, kedaluwarsa sendiri, dan langsung mati
 * begitu dipakai atau digantikan undangan baru.
 */
class UndanganStaf
{
    public const MASA_BERLAKU_JAM = 72;

    /** @return bool true bila email undangan sudah terkirim saat ini juga. */
    public static function kirim(User $user): bool
    {
        $token = bin2hex(random_bytes(32));
        $kedaluwarsa = now()->addHours(self::MASA_BERLAKU_JAM);

        $user->forceFill([
            'invitation_token' => hash('sha256', $token),
            'invitation_expires_at' => $kedaluwarsa,
        ])->save();

        $path = URL::temporarySignedRoute(
            'undangan.terima',
            $kedaluwarsa,
            ['user' => $user->id, 'token' => $token],
            absolute: false,
        );

        $url = self::frontendBase().'/aktivasi?u='.$user->id.'&'.parse_url($path, PHP_URL_QUERY);
        $namaSekolah = tenant() ? (tenant('nama_sekolah') ?: 'SIM Pendidikan') : 'SIM Pendidikan';

        return KirimEmail::segera($user->email, new UndanganStafMail(
            $namaSekolah,
            $user->name,
            $url,
            $kedaluwarsa->translatedFormat('d F Y H:i').' WIB',
        ));
    }

    public static function frontendBase(): string
    {
        $port = env('FRONTEND_PORT');

        return request()->getScheme().'://'.request()->getHost().($port ? ":{$port}" : '');
    }
}

<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;

/**
 * Pembuatan akun siswa (username = NISN) dan orang tua/wali (username =
 * ortu.NISN) dengan password sementara yang wajib diganti saat login pertama.
 * Dipakai pembuatan akun massal dan persetujuan pendaftaran siswa.
 */
class AkunSiswa
{
    private const HURUF_PASSWORD = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public static function buatAkun(string $nama, string $username, string $email, string $password, string $role): User
    {
        if (User::where('username', $username)->orWhere('email', $email)->exists()) {
            throw new \RuntimeException("username {$username} sudah dipakai akun lain");
        }

        $user = User::create(['name' => $nama, 'email' => $email, 'password' => $password]);
        $user->forceFill([
            'username' => $username,
            'email_verified_at' => now(),
            'is_active' => true,
            'must_change_password' => true,
            'temporary_password' => $password,
        ])->save();
        $user->assignRole($role);

        return $user;
    }

    /** Password sementara 8 karakter tanpa huruf/angka yang mirip (0/O, 1/l/I). */
    public static function passwordAcak(): string
    {
        $hasil = '';
        $max = strlen(self::HURUF_PASSWORD) - 1;
        for ($i = 0; $i < 8; $i++) {
            $hasil .= self::HURUF_PASSWORD[random_int(0, $max)];
        }

        return $hasil;
    }
}

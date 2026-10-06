<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;

/**
 * Akun dengan beberapa peran bekerja sebagai SATU peran pada satu waktu.
 * Relasi `roles` pada instance user dibatasi ke peran aktif, sehingga
 * semua pemeriksaan permission/role (middleware Spatie, hasRole di
 * controller, all_permissions untuk frontend) mengikuti peran aktif.
 */
class PeranAktif
{
    /** Urutan bawaan bila belum memilih — sama dengan urutan dasbor di frontend. */
    private const URUTAN = [
        'Super Admin', 'Admin Sekolah', 'Kepala Sekolah', 'Wakil Kepala Sekolah', 'Tata Usaha',
        'Kurikulum', 'Kesiswaan', 'Bendahara', 'Guru BK', 'Wali Kelas', 'Guru Mata Pelajaran',
        'Siswa', 'Orang Tua',
    ];

    public static function terapkan(User $user, ?string $dipilih): void
    {
        $semua = $user->roles()->get()
            ->sortBy(fn ($r) => array_search($r->name, self::URUTAN, true) === false ? 99 : array_search($r->name, self::URUTAN, true))
            ->values();

        $nama = $semua->pluck('name')->all();
        $valid = $dipilih !== null && in_array($dipilih, $nama, true);

        $user->peranTersedia = $nama;
        $user->peranDipilih = count($nama) > 1 && $valid ? $dipilih : null;

        if (count($nama) <= 1) {
            $user->setRelation('roles', $semua);

            return;
        }

        $aktif = $valid ? $dipilih : $nama[0];
        $user->setRelation('roles', $semua->where('name', $aktif)->values());
    }
}

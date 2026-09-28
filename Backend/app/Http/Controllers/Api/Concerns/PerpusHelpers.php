<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\AnggotaPerpustakaan;
use App\Models\PeminjamanBuku;
use App\Models\ReservasiBuku;

trait PerpusHelpers
{
    protected function nomorTransaksiPeminjaman(): string
    {
        $prefix = 'PJM/'.now()->format('Ym').'/';
        $urut = PeminjamanBuku::where('nomor_transaksi', 'like', "{$prefix}%")->count() + 1;
        do {
            $nomor = $prefix.str_pad((string) $urut++, 4, '0', STR_PAD_LEFT);
        } while (PeminjamanBuku::where('nomor_transaksi', $nomor)->exists());

        return $nomor;
    }

    protected function nomorReservasi(): string
    {
        $prefix = 'RSV/'.now()->format('Ym').'/';
        $urut = ReservasiBuku::where('nomor_reservasi', 'like', "{$prefix}%")->count() + 1;
        do {
            $nomor = $prefix.str_pad((string) $urut++, 4, '0', STR_PAD_LEFT);
        } while (ReservasiBuku::where('nomor_reservasi', $nomor)->exists());

        return $nomor;
    }

    protected function nomorKartuAnggota(string $jenis): string
    {
        $prefix = ['siswa' => 'SIS', 'guru' => 'GRU', 'pegawai' => 'PEG'][$jenis];
        $urut = AnggotaPerpustakaan::where('jenis_anggota', $jenis)->count() + 1;
        do {
            $nomor = $prefix.'-'.str_pad((string) $urut++, 5, '0', STR_PAD_LEFT);
        } while (AnggotaPerpustakaan::where('nomor_kartu', $nomor)->exists());

        return $nomor;
    }
}

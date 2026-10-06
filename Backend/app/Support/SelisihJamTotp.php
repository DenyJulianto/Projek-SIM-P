<?php

declare(strict_types=1);

namespace App\Support;

use PragmaRX\Google2FA\Google2FA;

/**
 * Diagnosis saja, tidak pernah meloloskan kode: bila kode 2FA ditolak tapi
 * cocok dengan kode beberapa menit sebelum/sesudahnya, penyebabnya hampir
 * pasti jam server atau ponsel yang tidak sinkron — beri tahu pengguna,
 * bukan sekadar "kode salah".
 */
class SelisihJamTotp
{
    private const RENTANG_LANGKAH = 20; // ±10 menit

    /** Selisih perkiraan dalam detik (positif = jam server tertinggal), atau null bila tidak cocok sama sekali. */
    public static function cari(string $secret, string $kode): ?int
    {
        $kode = preg_replace('/\s+/', '', $kode);
        if (! preg_match('/^\d{6}$/', $kode)) {
            return null;
        }

        $g = new Google2FA();
        $sekarang = $g->getTimestamp();

        for ($i = 1; $i <= self::RENTANG_LANGKAH; $i++) {
            foreach ([$i, -$i] as $langkah) {
                if (hash_equals($g->oathTotp($secret, $sekarang + $langkah), $kode)) {
                    return $langkah * 30;
                }
            }
        }

        return null;
    }

    public static function pesan(int $detik): string
    {
        $arah = $detik > 0 ? 'tertinggal' : 'lebih cepat';

        return 'Kode tidak diterima karena jam server '.$arah.' sekitar '.abs($detik).' detik dibanding ponsel Anda. '
            .'Sinkronkan jam komputer server (Pengaturan Waktu → "Sinkronkan sekarang") dan pastikan '
            .'waktu ponsel diatur otomatis, lalu coba lagi.';
    }
}

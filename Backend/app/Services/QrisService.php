<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Mengubah QRIS statis (didapat sekolah dari bank/penyedia QRIS-nya sendiri,
 * bukan dari payment gateway pihak ketiga yang kita integrasikan) menjadi
 * QRIS dinamis dengan nominal tagihan sudah tertanam di dalamnya, mengikuti
 * struktur TLV EMVCo yang menjadi dasar standar QRIS Bank Indonesia. Ini
 * murni manipulasi string sesuai spesifikasi publik, sehingga orang tua
 * tinggal memindai tanpa mengetik nominal secara manual — tidak ada
 * panggilan API ke pihak ketiga mana pun.
 */
class QrisService
{
    public static function withAmount(string $staticPayload, int $amountRupiah): string
    {
        $static = trim($staticPayload);

        // 8 karakter terakhir dari QRIS statis selalu tag CRC ("63" + panjang
        // "04" + 4 digit heksa checksum) — buang seluruhnya, akan dihitung ulang.
        $body = substr($static, 0, -8);

        // Point of Initiation Method: "11" (statis, bisa dipindai berkali-kali
        // dengan nominal bebas) diubah menjadi "12" (dinamis, nominal tetap).
        $body = str_replace('010211', '010212', $body);

        $amountStr = (string) $amountRupiah;
        $tagJumlah = '54'.str_pad((string) strlen($amountStr), 2, '0', STR_PAD_LEFT).$amountStr;

        $payload = $body.$tagJumlah.'6304';

        return $payload.self::crc16($payload);
    }

    private static function crc16(string $data): string
    {
        $crc = 0xFFFF;

        for ($i = 0, $len = strlen($data); $i < $len; $i++) {
            $crc ^= ord($data[$i]) << 8;
            for ($j = 0; $j < 8; $j++) {
                $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) & 0xFFFF : ($crc << 1) & 0xFFFF;
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }
}

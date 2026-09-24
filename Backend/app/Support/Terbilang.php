<?php

declare(strict_types=1);

namespace App\Support;

class Terbilang
{
    private const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

    private const SKALA = [
        1_000_000_000_000 => 'triliun',
        1_000_000_000 => 'miliar',
        1_000_000 => 'juta',
        1_000 => 'ribu',
    ];

    public static function rupiah(float|int|string $nilai): string
    {
        $n = (int) round((float) $nilai);
        $teks = $n === 0 ? 'nol' : self::bilang($n);

        return ucfirst($teks).' rupiah';
    }

    private static function bilang(int $n): string
    {
        if ($n < 12) {
            return self::SATUAN[$n];
        }
        if ($n < 20) {
            return self::bilang($n - 10).' belas';
        }
        if ($n < 100) {
            return self::bilang(intdiv($n, 10)).' puluh'.($n % 10 ? ' '.self::bilang($n % 10) : '');
        }
        if ($n < 200) {
            return 'seratus'.($n - 100 ? ' '.self::bilang($n - 100) : '');
        }
        if ($n < 1000) {
            return self::bilang(intdiv($n, 100)).' ratus'.($n % 100 ? ' '.self::bilang($n % 100) : '');
        }
        if ($n < 2000) {
            return 'seribu'.($n - 1000 ? ' '.self::bilang($n - 1000) : '');
        }

        foreach (self::SKALA as $ukuran => $nama) {
            if ($n >= $ukuran) {
                $sisa = $n % $ukuran;

                return self::bilang(intdiv($n, $ukuran)).' '.$nama.($sisa ? ' '.self::bilang($sisa) : '');
            }
        }

        return '';
    }
}

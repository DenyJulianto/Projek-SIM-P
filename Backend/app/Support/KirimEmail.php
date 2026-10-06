<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;

/**
 * Mengirim email penting (undangan, reset password, dsb.) saat itu juga
 * lewat SMTP, tanpa bergantung pada queue worker yang mungkin tidak
 * berjalan. Bila SMTP gagal, email dimasukkan ke antrean sebagai cadangan
 * supaya dicoba lagi begitu worker hidup.
 */
class KirimEmail
{
    /** @return bool true bila email sudah terkirim saat ini juga. */
    public static function segera(string $tujuan, Mailable $email): bool
    {
        try {
            Mail::to($tujuan)->sendNow($email);

            return true;
        } catch (\Throwable $e) {
            report($e);
        }

        try {
            Mail::to($tujuan)->queue($email);
        } catch (\Throwable $e) {
            report($e);
        }

        return false;
    }
}

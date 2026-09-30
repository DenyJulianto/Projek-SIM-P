<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Notifikasi keamanan setelah password berhasil diganti lewat lupa
 * password — supaya pemilik akun tahu kalau bukan dia yang menggantinya.
 */
class PasswordChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $namaSekolah,
        public string $changedAt,
        public string $ip,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Password Anda Baru Saja Diubah',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-changed',
            with: [
                'namaSekolah' => $this->namaSekolah,
                'changedAt' => $this->changedAt,
                'ip' => $this->ip,
            ],
        );
    }
}

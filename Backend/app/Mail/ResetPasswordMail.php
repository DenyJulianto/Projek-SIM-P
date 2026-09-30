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
 * Dikirim lewat queue supaya permintaan lupa password tidak menunggu SMTP.
 * Menyertakan IP & waktu peminta supaya pemilik akun bisa menyadari kalau
 * dia sendiri tidak pernah meminta reset ini.
 */
class ResetPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $namaSekolah,
        public string $resetUrl,
        public string $requestIp,
        public string $requestTime,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password SIM Pendidikan',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reset-password',
            with: [
                'namaSekolah' => $this->namaSekolah,
                'resetUrl' => $this->resetUrl,
                'requestIp' => $this->requestIp,
                'requestTime' => $this->requestTime,
            ],
        );
    }
}

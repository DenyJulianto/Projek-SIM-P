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
 * Dikirim lewat queue (bukan sinkron) supaya proses registrasi tidak
 * menunggu SMTP. Link verifikasi dibangun sebelum job di-queue (lihat
 * AuthController::register()), jadi Mailable ini tidak perlu akses tenant
 * apa pun saat diproses worker.
 */
class VerifyEmailMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $namaSekolah,
        public string $verificationUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verifikasi Akun SIM Pendidikan',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-email',
            with: [
                'namaSekolah' => $this->namaSekolah,
                'verificationUrl' => $this->verificationUrl,
            ],
        );
    }
}

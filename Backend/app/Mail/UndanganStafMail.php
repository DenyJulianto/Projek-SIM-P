<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UndanganStafMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $namaSekolah,
        public string $nama,
        public string $url,
        public string $berlakuSampai,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Undangan Akun {$this->namaSekolah} - SIM Pendidikan");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.undangan-staf');
    }
}

<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PendaftaranDitolakMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $namaSekolah,
        public string $nama,
        public string $alasan,
        public string $sebagai = 'pegawai',
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Pendaftaran '.ucfirst($this->sebagai)." {$this->namaSekolah}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.pendaftaran-ditolak');
    }
}

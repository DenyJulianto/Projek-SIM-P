<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Informasi login untuk siswa yang pendaftarannya disetujui (bila ia mengisi email). */
class PendaftaranSiswaDisetujuiMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $namaSekolah,
        public string $nama,
        public string $kelas,
        public string $loginUrl,
        public string $username,
        public string $password,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Pendaftaran Siswa Disetujui — {$this->namaSekolah}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.pendaftaran-siswa-disetujui');
    }
}

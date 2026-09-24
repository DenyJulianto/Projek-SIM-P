<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/** Notifikasi dalam aplikasi (database) tentang hasil verifikasi nilai. */
class VerifikasiNilaiNotification extends Notification
{
    public function __construct(
        private readonly string $judul,
        private readonly string $pesan,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['tipe' => 'verifikasi_nilai', 'judul' => $this->judul, 'pesan' => $this->pesan];
    }
}

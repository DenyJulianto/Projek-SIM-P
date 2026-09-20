<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/** Notifikasi dalam aplikasi (database) tentang penggantian guru. */
class GuruPenggantiNotification extends Notification
{
    public function __construct(
        private readonly int $guruPenggantiId,
        private readonly string $judul,
        private readonly string $pesan,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipe' => 'guru_pengganti',
            'guru_pengganti_id' => $this->guruPenggantiId,
            'judul' => $this->judul,
            'pesan' => $this->pesan,
        ];
    }
}

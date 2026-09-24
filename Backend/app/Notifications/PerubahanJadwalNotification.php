<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/** Notifikasi dalam aplikasi (database) tentang perubahan jadwal pelajaran. */
class PerubahanJadwalNotification extends Notification
{
    public function __construct(
        private readonly int $perubahanJadwalId,
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
            'tipe' => 'perubahan_jadwal',
            'perubahan_jadwal_id' => $this->perubahanJadwalId,
            'judul' => $this->judul,
            'pesan' => $this->pesan,
        ];
    }
}

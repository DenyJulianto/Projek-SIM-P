<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/** Pengingat agenda kalender akademik (notifikasi database). */
class KalenderPengingatNotification extends Notification
{
    public function __construct(private readonly string $judul, private readonly string $pesan) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['tipe' => 'kalender_pengingat', 'judul' => $this->judul, 'pesan' => $this->pesan];
    }
}

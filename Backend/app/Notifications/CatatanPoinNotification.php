<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\CatatanPoin;
use Illuminate\Notifications\Notification;

/**
 * Notifikasi dalam aplikasi (database) ke siswa & orang tua saat Kesiswaan
 * mencatat pengurangan atau penambahan poin kedisiplinan (menu "Poin Siswa").
 */
class CatatanPoinNotification extends Notification
{
    public function __construct(private readonly CatatanPoin $catatan, private readonly int $sisaPoin) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $kurang = $this->catatan->perubahan() < 0;

        return [
            'tipe' => 'catatan_poin',
            'catatan_poin_id' => $this->catatan->id,
            'judul' => $kurang ? 'Poin Kedisiplinan Dikurangi' : 'Poin Kedisiplinan Bertambah',
            'pesan' => "{$this->catatan->keterangan} — poin kedisiplinan ".($kurang ? 'dikurangi' : 'ditambah')
                ." {$this->catatan->poin} poin. Sisa poin: {$this->sisaPoin}.",
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Pelanggaran;
use Illuminate\Notifications\Notification;

/** Notifikasi dalam aplikasi (database) saat pelanggaran baru dicatat untuk siswa. */
class PelanggaranBaruNotification extends Notification
{
    public function __construct(private readonly Pelanggaran $pelanggaran) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipe' => 'pelanggaran_baru',
            'pelanggaran_id' => $this->pelanggaran->id,
            'judul' => 'Pelanggaran Tercatat',
            'pesan' => "Tercatat pelanggaran \"{$this->pelanggaran->jenis}\" (tingkat {$this->pelanggaran->tingkat}) pada {$this->pelanggaran->tanggal->format('d-m-Y')}.",
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PendaftaranSiswa;
use Illuminate\Notifications\Notification;

class PendaftaranSiswaBaruNotification extends Notification
{
    public function __construct(private readonly PendaftaranSiswa $pendaftaran) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipe' => 'pendaftaran_siswa',
            'pendaftaran_siswa_id' => $this->pendaftaran->id,
            'judul' => 'Pendaftaran Siswa Baru',
            'pesan' => "{$this->pendaftaran->nama_lengkap} (NISN {$this->pendaftaran->nisn}) mendaftar sebagai siswa dan menunggu persetujuan di menu Konfirmasi Pengguna.",
        ];
    }
}

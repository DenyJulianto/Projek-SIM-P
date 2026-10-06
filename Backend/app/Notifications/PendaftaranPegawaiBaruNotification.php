<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PendaftaranPegawai;
use Illuminate\Notifications\Notification;

class PendaftaranPegawaiBaruNotification extends Notification
{
    public function __construct(private readonly PendaftaranPegawai $pendaftaran) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipe' => 'pendaftaran_pegawai',
            'pendaftaran_id' => $this->pendaftaran->id,
            'judul' => 'Pendaftaran Pegawai Baru',
            'pesan' => "{$this->pendaftaran->nama_lengkap} ({$this->pendaftaran->jenis_pegawai}, {$this->pendaftaran->status_kepegawaian}) mendaftar dan menunggu persetujuan di menu Konfirmasi Pengguna.",
        ];
    }
}

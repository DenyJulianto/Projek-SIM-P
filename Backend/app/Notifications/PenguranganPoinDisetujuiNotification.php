<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PengajuanPenguranganPoin;
use Illuminate\Notifications\Notification;

/**
 * Notifikasi dalam aplikasi (database) saat Kesiswaan menyetujui pengajuan
 * pengurangan poin dari BK — dikirim setelah poin siswa benar-benar
 * berkurang, bukan saat BK baru mengajukan.
 */
class PenguranganPoinDisetujuiNotification extends Notification
{
    public function __construct(private readonly PengajuanPenguranganPoin $pengajuan) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $jenis = $this->pengajuan->pelanggaran->jenis;

        return [
            'tipe' => 'pengurangan_poin_disetujui',
            'pengajuan_id' => $this->pengajuan->id,
            'judul' => 'Poin Kedisiplinan Dikurangi',
            'pesan' => "Atas pelanggaran \"{$jenis}\", poin kedisiplinan dikurangi {$this->pengajuan->poin_diajukan} poin. Sisa poin: {$this->pengajuan->siswa->poin_disiplin}.",
        ];
    }
}

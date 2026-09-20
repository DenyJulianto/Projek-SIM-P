<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KalenderKegiatan;
use App\Models\User;
use App\Notifications\KalenderPengingatNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class KirimPengingatKalender extends Command
{
    protected $signature = 'kalender:pengingat';

    protected $description = 'Kirim notifikasi pengingat agenda kalender akademik yang sudah memasuki jendela pengingatnya (dijalankan per tenant).';

    public function handle(): int
    {
        $today = Carbon::today();
        $terkirim = 0;

        $agenda = KalenderKegiatan::with('penanggungJawabGuru.user')
            ->whereNotNull('pengingat_hari')->whereNull('pengingat_dikirim_at')->where('status', 'direncanakan')
            ->where('tanggal_mulai', '>=', $today->toDateString())->get()
            ->filter(fn (KalenderKegiatan $k) => $today->diffInDays(Carbon::parse($k->tanggal_mulai)) <= $k->pengingat_hari);

        if ($agenda->isEmpty()) {
            return self::SUCCESS;
        }
        $staf = User::permission('kurikulum.manage')->get();

        foreach ($agenda as $k) {
            $hariLagi = (int) $today->diffInDays(Carbon::parse($k->tanggal_mulai));
            $kapan = $hariLagi === 0 ? 'hari ini' : "{$hariLagi} hari lagi";
            $pesan = "{$k->judul} (".Carbon::parse($k->tanggal_mulai)->format('d-m-Y').") dimulai {$kapan}".($k->lokasi ? " di {$k->lokasi}" : '').'.';

            $penerima = $staf->concat(array_filter([$k->penanggungJawabGuru?->user]))->unique('id');
            foreach ($penerima as $user) {
                $user->notify(new KalenderPengingatNotification('Pengingat agenda kalender akademik', $pesan));
            }
            $k->update(['pengingat_dikirim_at' => now()]);
            $terkirim++;
        }

        $this->info("{$terkirim} pengingat agenda dikirim.");

        return self::SUCCESS;
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature\Support;

use App\Models\Kelas;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

/** Job uji: harus dijalankan di database sekolah tempat ia dikirim. */
class BuatKelasDariAntrean implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function handle(): void
    {
        Kelas::create(['nama_kelas' => 'Kelas Dari Antrean', 'tahun_ajaran' => '2026/2027']);
    }
}

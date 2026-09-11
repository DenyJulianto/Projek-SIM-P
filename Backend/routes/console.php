<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Backup Otomatis
|--------------------------------------------------------------------------
|
| Mengecek tiap menit apakah ada sekolah (tenant) yang jadwal backup-nya
| ("Backup & Pemulihan" > "Jadwal Backup") sudah waktunya jalan — logika
| harian/mingguan ditangani di dalam RunScheduledBackup. CATATAN: seperti
| semua scheduler Laravel, baris ini baru benar-benar jalan otomatis kalau
| cron server memanggil `php artisan schedule:run` tiap menit — itu bagian
| yang perlu disiapkan admin server (di luar jangkauan aplikasi).
|
*/
Schedule::command('tenants:run backup:scheduled')->everyMinute();

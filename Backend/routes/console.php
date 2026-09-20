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

/*
|--------------------------------------------------------------------------
| Pengingat Kalender Akademik
|--------------------------------------------------------------------------
|
| Tiap pagi mengirim notifikasi dalam aplikasi untuk agenda kalender
| akademik yang sudah memasuki jendela pengingatnya. Sama seperti backup,
| butuh cron `php artisan schedule:run` di server agar berjalan otomatis.
|
*/
Schedule::command('tenants:run kalender:pengingat')->dailyAt('06:00');

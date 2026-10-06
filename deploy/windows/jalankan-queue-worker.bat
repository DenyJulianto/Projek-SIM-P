@echo off
rem Menjalankan queue worker SIM Pendidikan secara terus-menerus. Dipakai di
rem Windows sebagai pengganti Supervisor. Jalankan jendela ini selama
rem aplikasi dipakai, atau daftarkan file ini di Task Scheduler (Start at log on)
rem atau NSSM agar otomatis hidup lagi setelah restart.
cd /d "%~dp0..\..\Backend"

:ulang
"C:\xampp\php\php.exe" artisan queue:work database --sleep=3 --tries=3 --timeout=60 --max-time=3600
echo [%date% %time%] queue worker berhenti, dijalankan ulang dalam 5 detik...
ping -n 6 127.0.0.1 >nul
goto ulang

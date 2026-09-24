<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Super Admin (central, cross-school platform account)
    |--------------------------------------------------------------------------
    */
    'super_admin' => [
        'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
        'email' => env('SUPER_ADMIN_EMAIL', 'superadmin@simpendidikan.local'),
        'password' => env('SUPER_ADMIN_PASSWORD', 'password'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Domain dasar untuk subdomain sekolah baru
    |--------------------------------------------------------------------------
    |
    | Dipakai saat sekolah dibuat lewat import massal (Sekolah::id akan
    | menjadi subdomain, mis. "sch-20223344.simpendidikan.test"). Untuk
    | pembuatan sekolah satu-satu lewat form, domain tetap diisi manual.
    */
    'tenant_base_domain' => env('TENANT_BASE_DOMAIN', 'simpendidikan.test'),

    /*
    |--------------------------------------------------------------------------
    | Versi platform
    |--------------------------------------------------------------------------
    |
    | Ditampilkan di panel "Manajemen Versi/Update Sistem" milik Super Admin.
    | Platform ini satu basis kode yang sama untuk semua sekolah (bukan
    | versi terpisah per sekolah), jadi cukup satu nilai di sini — naikkan
    | manual setiap kali ada rilis baru.
    */
    'app_version' => env('SIM_APP_VERSION', '1.0.0'),

    /*
    |--------------------------------------------------------------------------
    | Katalog modul yang bisa diaktifkan/nonaktifkan per sekolah
    |--------------------------------------------------------------------------
    |
    | Modul inti (data guru/siswa, kurikulum, kesiswaan, pengguna) tidak ada
    | di sini karena tidak boleh dimatikan — sekolah tidak bisa berjalan
    | tanpanya. Hanya modul opsional yang terdaftar. Key harus sama persis
    | dengan yang dicek App\Http\Middleware\EnsureModuleEnabled dan yang
    | dipakai di routes/tenant.php.
    */
    'modules' => [
        'keuangan' => 'Keuangan (tagihan, pembayaran, anggaran)',
        'sarpras' => 'Sarana & Prasarana',
        'persuratan' => 'Surat & Kearsipan',
        'bk' => 'Bimbingan Konseling',
        'kepegawaian' => 'Pengajuan Kepegawaian',
    ],

];

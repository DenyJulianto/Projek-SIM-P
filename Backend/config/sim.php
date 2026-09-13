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

];

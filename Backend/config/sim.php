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

];

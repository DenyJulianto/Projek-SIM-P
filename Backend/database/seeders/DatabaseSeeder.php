<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => config('sim.super_admin.email')],
            [
                'name' => config('sim.super_admin.name'),
                'password' => config('sim.super_admin.password'),
                'is_super_admin' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}

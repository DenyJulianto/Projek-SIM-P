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
<<<<<<< HEAD
        User::updateOrCreate(
            ['email' => config('sim.super_admin.email')],
            [
                'name' => config('sim.super_admin.name'),
                'password' => config('sim.super_admin.password'),
                'is_super_admin' => true,
                'email_verified_at' => now(),
            ]
        );
=======
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
>>>>>>> 036bf153b2c0c589dda724a12f6959d2a5c711c1
    }
}

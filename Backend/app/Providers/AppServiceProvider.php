<?php

namespace App\Providers;

use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use App\Observers\GuruObserver;
use App\Observers\SiswaObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(fn (User $user) => $user->is_super_admin ? true : null);

        Guru::observe(GuruObserver::class);
        Siswa::observe(SiswaObserver::class);
    }
}

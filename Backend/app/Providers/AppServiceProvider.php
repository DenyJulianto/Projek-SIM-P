<?php

namespace App\Providers;

<<<<<<< HEAD
use App\Models\User;
use Illuminate\Support\Facades\Gate;
=======
>>>>>>> 036bf153b2c0c589dda724a12f6959d2a5c711c1
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
<<<<<<< HEAD
        Gate::before(fn (User $user) => $user->is_super_admin ? true : null);
=======
        //
>>>>>>> 036bf153b2c0c589dda724a12f6959d2a5c711c1
    }
}

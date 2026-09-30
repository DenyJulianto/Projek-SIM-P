<?php

namespace App\Providers;

use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use App\Observers\GuruObserver;
use App\Observers\SiswaObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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

        // Limiter terpisah per endpoint lupa password — kalau pakai
        // throttle:x,y biasa, keduanya berbagi satu hitungan per IP sehingga
        // salah ketik kode beberapa kali ikut memblokir "Kirim Ulang".
        RateLimiter::for('forgot-password', fn (Request $request) => Limit::perMinute(5)->by('forgot-password|'.$request->ip()));
        RateLimiter::for('reset-password', fn (Request $request) => Limit::perMinute(10)->by('reset-password|'.$request->ip()));
    }
}

<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use App\Mail\Transports\ResendTransport;
use Illuminate\Mail\MailManager;

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
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        Route::middleware('web')
            ->group(base_path('routes/web.php'));

         $this->app->make(MailManager::class)->extend('resend', function (array $config = []) {
            return new ResendTransport(
                $config['key'] ?? config('services.resend.key')
            );
        });
    }
}

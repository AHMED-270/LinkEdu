<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Schema;
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
        // Compatibility fix for older MySQL/MariaDB index length limits.
        Schema::defaultStringLength(191);

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontendUrl = trim((string) config('app.frontend_url', ''));
            $origin = request()?->headers->get('origin');

            if (is_string($origin) && filter_var($origin, FILTER_VALIDATE_URL)) {
                $frontendUrl = $origin;
            }

            if ($frontendUrl === '' || !filter_var($frontendUrl, FILTER_VALIDATE_URL)) {
                $frontendUrl = 'http://localhost:5173';
            }

            $frontendUrl = rtrim($frontendUrl, '/');
            $email = urlencode((string) $notifiable->getEmailForPasswordReset());
            return "{$frontendUrl}/password-reset/{$token}?email={$email}";
        });
    }
}

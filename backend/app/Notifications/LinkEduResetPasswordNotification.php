<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LinkEduResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $fullName = trim((string) ($notifiable->prenom ?? '') . ' ' . (string) ($notifiable->nom ?? ''));
        $fallbackName = trim((string) ($notifiable->name ?? ''));
        $displayName = $fullName !== '' ? $fullName : ($fallbackName !== '' ? $fallbackName : 'Utilisateur');

        $broker = (string) config('auth.defaults.passwords', 'users');
        $expireMinutes = (int) config("auth.passwords.{$broker}.expire", 60);
        $resetUrl = $this->buildResetUrl($notifiable);

        return (new MailMessage)
            ->subject('Reinitialisation du mot de passe - LinkEdu')
            ->action('Reinitialiser le mot de passe', $resetUrl)
            ->view('emails.password-reset', [
                'appName' => (string) config('app.name', 'LinkEdu'),
                'displayName' => $displayName,
                'resetUrl' => $resetUrl,
                'expireMinutes' => $expireMinutes,
            ]);
    }

    private function buildResetUrl(object $notifiable): string
    {
        $frontendUrl = $this->resolveFrontendUrl();
        $email = urlencode((string) $notifiable->getEmailForPasswordReset());

        return $frontendUrl . '/password-reset/' . $this->token . '?email=' . $email;
    }

    private function resolveFrontendUrl(): string
    {
        $configured = trim((string) config('app.frontend_url', ''));
        $origin = request()?->headers->get('origin');

        if (is_string($origin) && filter_var($origin, FILTER_VALIDATE_URL)) {
            return rtrim($origin, '/');
        }

        if ($configured !== '' && filter_var($configured, FILTER_VALIDATE_URL)) {
            return rtrim($configured, '/');
        }

        $fallback = trim((string) config('app.url', 'http://localhost:8000'));
        if ($fallback === '' || !filter_var($fallback, FILTER_VALIDATE_URL)) {
            return 'http://localhost:5173';
        }

        return rtrim($fallback, '/');
    }
}

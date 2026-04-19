<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Vite;
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
        Vite::prefetch(concurrency: 3);

        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $locale = in_array($notifiable->language ?? '', ['ru', 'en'], true)
                ? $notifiable->language
                : (string) config('app.locale', 'ru');

            $tr = static fn (string $key, array $replace = []) => trans($key, $replace, $locale);

            $appName = (string) config('app.name');
            $email = $notifiable->getEmailForPasswordReset();
            $expire = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $email,
            ], false));

            $copy = [
                'url' => $url,
                'appName' => $appName,
                'title' => $tr('mail.password_reset.title'),
                'lead' => $tr('mail.password_reset.lead', ['email' => $email, 'app' => $appName]),
                'cta' => $tr('mail.password_reset.cta'),
                'expiry' => $tr('mail.password_reset.expiry', ['count' => $expire]),
                'ignore' => $tr('mail.password_reset.ignore'),
                'copyHint' => $tr('mail.password_reset.copy_hint'),
                'footerBrand' => $tr('mail.password_reset.footer_brand'),
            ];

            return (new MailMessage)
                ->subject($tr('mail.password_reset.subject', ['app' => $appName]))
                ->view('emails.auth.password-reset', $copy)
                ->text('emails.auth.password-reset-plain', $copy);
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $verificationUrl): MailMessage {
            $locale = in_array($notifiable->language ?? '', ['ru', 'en'], true)
                ? $notifiable->language
                : (string) config('app.locale', 'ru');

            $tr = static fn (string $key, array $replace = []) => trans($key, $replace, $locale);

            $appName = (string) config('app.name');
            $email = (string) $notifiable->getEmailForVerification();
            $expire = (int) config('auth.verification.expire', 60);

            $copy = [
                'url' => $verificationUrl,
                'appName' => $appName,
                'email' => $email,
                'title' => $tr('mail.verify_email.title'),
                'lead' => $tr('mail.verify_email.lead', ['email' => $email, 'app' => $appName]),
                'cta' => $tr('mail.verify_email.cta'),
                'expiry' => $tr('mail.verify_email.expiry', ['count' => $expire]),
                'ignore' => $tr('mail.verify_email.ignore'),
                'copyHint' => $tr('mail.verify_email.copy_hint'),
                'footerBrand' => $tr('mail.verify_email.footer_brand'),
            ];

            return (new MailMessage)
                ->subject($tr('mail.verify_email.subject', ['app' => $appName]))
                ->view('emails.auth.verify-email', $copy)
                ->text('emails.auth.verify-email-plain', $copy);
        });
    }
}

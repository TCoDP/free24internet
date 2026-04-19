<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Mailtrap\Helper\ResponseHelper;
use Mailtrap\MailtrapClient;
use Mailtrap\Mime\MailtrapEmail;
use Symfony\Component\Console\Command\Command as CommandAlias;
use Symfony\Component\Mime\Address;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('send-mail {email : Адрес получателя}', function (string $email) {
    $apiKey = (string) config('services.mailtrap-sdk.apiKey');
    if ($apiKey === '') {
        $this->error('Укажите MAILTRAP_API_KEY в .env и выполните php artisan config:clear.');

        return CommandAlias::FAILURE;
    }

    $email = trim($email);
    if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->error('Укажите корректный e-mail, например: php artisan send-mail user@gmail.com');

        return CommandAlias::FAILURE;
    }

    $this->line('Получатель: '.$email);

    $message = (new MailtrapEmail)
        ->from(new Address('hello@free24internet.vip', 'Mailtrap Test'))
        ->to(new Address($email))
        ->subject('You are awesome!')
        ->category('Integration Test')
        ->text('Congrats for sending test email with Mailtrap!');

    try {
        $response = MailtrapClient::initSendingEmails(
            apiKey: $apiKey,
        )->send($message);
    } catch (Throwable $e) {
        $this->error($e->getMessage());

        return CommandAlias::FAILURE;
    }

    dump(ResponseHelper::toArray($response));

    return CommandAlias::SUCCESS;
})->purpose('Send Mail (Mailtrap transactional API), php artisan send-mail email@example.com');

Schedule::command('subscriptions:send-expiry-reminders')->dailyAt('08:00');

Schedule::command('seo:generate')->weekly();

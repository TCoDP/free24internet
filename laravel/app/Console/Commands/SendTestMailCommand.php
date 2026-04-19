<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendTestMailCommand extends Command
{
    protected $signature = 'mail:test {email : Адрес получателя}';

    protected $description = 'Отправить тестовое письмо текущим mailer (SMTP, Mailtrap SDK и т.д.)';

    public function handle(): int
    {
        $to = (string) $this->argument('email');
        $mailer = (string) config('mail.default');

        $this->line('Mailer: '.$mailer);

        try {
            Mail::raw(
                'Проверка исходящей почты с '.config('app.url')."\nВремя: ".now()->toIso8601String(),
                function ($message) use ($to) {
                    $message->to($to)
                        ->subject('Тест почты — '.config('app.name'));
                }
            );
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('Сообщение передано транспорту без исключений (при queue — проверьте воркер).');

        return self::SUCCESS;
    }
}

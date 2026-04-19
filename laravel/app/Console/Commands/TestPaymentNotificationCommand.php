<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\PaymentSuccessNotificationService;
use Illuminate\Console\Command;

/**
 * Проверка e-mail + Telegram с имитацией «оплата прошла» (БД кроме user refresh не трогается для plan — см. dry run).
 */
class TestPaymentNotificationCommand extends Command
{
    protected $signature = 'payment:test-notify
                            {user_id=2 : ID пользователя в users}
                            {--purpose=plan : plan или balance}
                            {--amount=100 : Сумма в RUB (для текста уведомления)}
                            {--plan-months=1 : Месяцев тарифа (для purpose=plan)}
                            {--provider=platega : platega или moneta (для текста)}
                            {--ref=dry-run-test : Псевдо-номер операции}';

    protected $description = 'Отправить тестовые уведомления об «успешной» оплате (помечены [Тест], БД не меняется)';

    public function handle(PaymentSuccessNotificationService $notifier): int
    {
        $id = (int) $this->argument('user_id');
        if ($id < 1) {
            $this->error('user_id должен быть ≥ 1.');

            return self::FAILURE;
        }

        $user = User::query()->find($id);
        if (! $user) {
            $this->error("Пользователь id={$id} не найден.");

            return self::FAILURE;
        }

        $purpose = strtolower((string) $this->option('purpose'));
        if (! in_array($purpose, ['plan', 'balance'], true)) {
            $this->error('purpose: plan или balance.');

            return self::FAILURE;
        }

        $provider = strtolower((string) $this->option('provider'));
        if (! in_array($provider, ['platega', 'moneta'], true)) {
            $this->error('provider: platega или moneta.');

            return self::FAILURE;
        }

        $amount = (float) $this->option('amount');
        $planMonths = (int) $this->option('plan-months');
        $ref = (string) $this->option('ref');

        $this->line('User #'.$user->id.' — email: '.($user->email ?: '(пусто)').', tg_id: '.($user->tg_id ?: '(нет)'));
        $this->line('Режим: имитация (dry run) — письма/бот с префиксом [Тест]');

        $notifier->notify(
            $user,
            $provider,
            $amount,
            $purpose,
            $purpose === 'plan' ? $planMonths : 0,
            $ref,
            true
        );

        $this->info('Готово. Проверьте почту (если задана) и Telegram (если привязан tg_id).');

        return self::SUCCESS;
    }
}

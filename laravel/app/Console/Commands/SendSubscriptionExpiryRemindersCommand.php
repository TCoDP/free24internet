<?php

namespace App\Console\Commands;

use App\Services\SubscriptionExpiryReminderService;
use Illuminate\Console\Command;

class SendSubscriptionExpiryRemindersCommand extends Command
{
    protected $signature = 'subscriptions:send-expiry-reminders {--dry-run : Only log counts, do not send}';

    protected $description = 'Напоминания об окончании подписки/пробного периода (кабинет, e-mail, Telegram — см. config/subscription_reminders.php и cron schedule)';

    public function handle(SubscriptionExpiryReminderService $service): int
    {
        $dry = (bool) $this->option('dry-run');
        if ($dry) {
            $this->warn('Dry run: уведомления не отправляются.');
        }

        $result = $service->run($dry);

        if ($dry) {
            $this->info(sprintf(
                'Dry run: затронуло бы %d, уже отправляли (пропуск) %d, ошибок %d.',
                $result['sent'],
                $result['skipped'],
                $result['errors'],
            ));
        } else {
            $this->info(sprintf(
                'Готово: отправлено %d, пропущено (уже было) %d, ошибок %d.',
                $result['sent'],
                $result['skipped'],
                $result['errors'],
            ));
        }

        return self::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use App\Services\TelegramBotNotificationService;
use Illuminate\Console\Command;

class SendTestTelegramNotification extends Command
{
    protected $signature = 'notifications:test
        {telegram_user_id : Telegram numeric id (например 330221075)}
        {--message= : Текст уведомления (HTML допускается при необходимости)}
        {--plain : Отправить без parse_mode (сырой текст)}';

    protected $description = 'Отправить тестовое уведомление пользователю от имени Telegram-бота (TELEGRAM_BOT_TOKEN)';

    public function handle(TelegramBotNotificationService $notifier): int
    {
        $tgId = (int) $this->argument('telegram_user_id');
        if ($tgId < 1) {
            $this->error('Некорректный telegram_user_id.');

            return self::FAILURE;
        }

        $default = '<b>Свободный Интернет</b> — тест системы уведомлений. Если вы видите это сообщение, доставка работает.';
        $message = (string) ($this->option('message') ?: $default);
        $parseMode = $this->option('plain') ? null : 'HTML';

        $this->info('Отправка на chat_id='.$tgId.' …');

        $result = $notifier->sendToTelegramId($tgId, $message, 'test', $parseMode);

        if (! ($result['ok'] ?? false)) {
            $this->error('Не удалось: '.($result['error'] ?? 'unknown'));
            if (isset($result['log_id'])) {
                $this->line('log_id: '.$result['log_id']);
            }

            return self::FAILURE;
        }

        $this->info('Ок. message_id='.($result['message_id'] ?? '—').', log_id='.($result['log_id'] ?? '—'));

        return self::SUCCESS;
    }
}

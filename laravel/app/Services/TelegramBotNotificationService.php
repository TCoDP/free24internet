<?php

namespace App\Services;

use App\Models\TelegramNotificationLog;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Системные уведомления в Telegram тем же ботом, что и основной vpn_bot.
 * Токен: config('services.telegram.bot_token') = TELEGRAM_BOT_TOKEN или BOT_TOKEN; если пусто — читаем vpn_bot/.env.
 */
final class TelegramBotNotificationService
{
    public function token(): ?string
    {
        $c = config('services.telegram.bot_token');
        if (is_string($c) && $c !== '' && ($t = trim($c)) !== '') {
            return $t;
        }

        if (($from = $this->readBotTokenFile()) !== null) {
            return $from;
        }

        return null;
    }

    private function readBotTokenFile(): ?string
    {
        $candidates = [
            base_path('../vpn_bot/.env'),
        ];
        foreach ($candidates as $path) {
            $real = realpath($path);
            if (! $real || ! is_readable($real)) {
                continue;
            }
            $line = $this->parseKeyFromDotEnv($real, 'BOT_TOKEN');
            if ($line !== null) {
                return $line;
            }
        }

        return null;
    }

    private function parseKeyFromDotEnv(string $path, string $key): ?string
    {
        $h = @fopen($path, 'r');
        if (! $h) {
            return null;
        }
        while (($l = fgets($h)) !== false) {
            $l = trim($l, "\n\r\0");
            if ($l === '' || (isset($l[0]) && $l[0] === '#')) {
                continue;
            }
            $eq = strpos($l, '=');
            if ($eq === false) {
                continue;
            }
            if (trim(substr($l, 0, $eq)) !== $key) {
                continue;
            }
            fclose($h);
            $v = trim(substr($l, $eq + 1));
            if ($v === '') {
                return null;
            }
            if ((str_starts_with($v, "'") && str_ends_with($v, "'")) || (str_starts_with($v, '"') && str_ends_with($v, '"'))) {
                $v = mb_substr($v, 1, -1);
            }

            return $v;
        }
        fclose($h);

        return null;
    }

    /**
     * @return array{ok: bool, error?: string, message_id?: int, log_id?: int}
     */
    public function sendToTelegramId(int $telegramUserId, string $text, string $kind = 'system', ?string $parseMode = 'HTML'): array
    {
        $token = $this->token();
        if ($token === null) {
            return ['ok' => false, 'error' => 'no_bot_token: задайте TELEGRAM_BOT_TOKEN/BOT_TOKEN в .env Ларавеля либо BOT_TOKEN в vpn_bot/.env'];
        }

        $trimmed = trim($text);
        if ($trimmed === '') {
            return ['ok' => false, 'error' => 'empty_message'];
        }

        $user = User::query()->where('tg_id', $telegramUserId)->first();

        $payload = [
            'chat_id' => $telegramUserId,
            'text' => $trimmed,
            'disable_web_page_preview' => true,
        ];
        if ($parseMode !== null && $parseMode !== '') {
            $payload['parse_mode'] = $parseMode;
        }

        $url = 'https://api.telegram.org/bot'.$token.'/sendMessage';

        try {
            $response = Http::timeout(20)->asForm()->post($url, $payload);
        } catch (\Throwable $e) {
            Log::warning('telegram bot send failed', ['tg_id' => $telegramUserId, 'exception' => $e->getMessage()]);
            $log = $this->writeLog($telegramUserId, $user?->id, $kind, 'failed', $trimmed, $e->getMessage(), null, null);

            return ['ok' => false, 'error' => 'network: '.$e->getMessage(), 'log_id' => $log->id];
        }

        $json = $response->json();
        $ok = $response->successful() && ($json['ok'] ?? false) === true;
        $messageId = isset($json['result']['message_id']) ? (int) $json['result']['message_id'] : null;

        if (! $ok) {
            $desc = (string) ($json['description'] ?? $response->body());
            Log::warning('telegram bot send rejected', ['tg_id' => $telegramUserId, 'body' => $desc]);
            $log = $this->writeLog($telegramUserId, $user?->id, $kind, 'failed', $trimmed, $desc, null, $json);

            return ['ok' => false, 'error' => $desc, 'log_id' => $log->id];
        }

        $log = $this->writeLog($telegramUserId, $user?->id, $kind, 'sent', $trimmed, null, $messageId, $json);

        return ['ok' => true, 'message_id' => $messageId, 'log_id' => $log->id];
    }

    private function writeLog(
        int $tgId,
        ?int $userId,
        string $kind,
        string $status,
        string $body,
        ?string $error,
        ?int $telegramMessageId,
        ?array $telegramResponse,
    ): TelegramNotificationLog {
        return TelegramNotificationLog::query()->create([
            'tg_id' => $tgId,
            'user_id' => $userId,
            'kind' => $kind,
            'status' => $status,
            'body' => $body,
            'error' => $error,
            'telegram_message_id' => $telegramMessageId,
            'telegram_response' => $telegramResponse,
        ]);
    }
}

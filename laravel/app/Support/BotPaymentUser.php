<?php

namespace App\Support;

use App\Models\User;

/**
 * Пользователь для оплаты из Telegram: одна таблица users на сайте и в боте.
 * Не требует заранее открытого «аккаунта на сайте» — запись создаётся по tg_id.
 */
final class BotPaymentUser
{
    public static function resolveByTelegramId(int $telegramUserId): User
    {
        return User::query()->firstOrCreate(
            ['tg_id' => $telegramUserId],
            [
                'language' => 'ru',
            ]
        );
    }
}

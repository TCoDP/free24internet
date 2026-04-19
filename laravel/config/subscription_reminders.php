<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Напоминания об окончании подписки / пробного периода
    |--------------------------------------------------------------------------
    |
    | За сколько календарных дней до даты окончания (в часовом поясе APP_TIMEZONE)
    | отправлять уведомление. Например 7,3,1 — за семь, три и один календарный день.
    |
    */

    'enabled' => (bool) env('SUBSCRIPTION_EXPIRY_REMINDERS_ENABLED', true),

    'days_before' => array_values(array_filter(array_map(
        static fn (string $v): int => (int) trim($v),
        explode(',', (string) env('SUBSCRIPTION_EXPIRY_REMINDER_DAYS', '7,3,1'))
    ), static fn (int $d): bool => $d > 0)),

];

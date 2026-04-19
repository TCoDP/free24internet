<?php

namespace App\Support;

/**
 * Суммы пополнения баланса (бот и сайт, одна БД).
 * Переопределение: BALANCE_TOPUP_AMOUNTS_RUB=100,300,500,1000,3000 в .env
 */
final class BalanceTopupAmounts
{
    /**
     * @return list<int>
     */
    public static function rub(): array
    {
        $raw = trim((string) env('BALANCE_TOPUP_AMOUNTS_RUB', '100,300,500,1000,3000'));
        $parts = array_filter(array_map('intval', explode(',', $raw)));

        $out = array_values(array_unique($parts));

        return $out !== [] ? $out : [100, 300, 500, 1000, 3000];
    }
}

<?php

namespace App\Support;

use App\Models\User;
use App\Services\PlanPlategaCheckoutService;

final class SitePaymentOptions
{
    public static function monetaEnvConfigured(): bool
    {
        return trim((string) env('MONETA_ACCOUNT_ID')) !== ''
            && trim((string) env('MONETA_SECRET')) !== '';
    }

    public static function monetaForUser(User $user): bool
    {
        return self::monetaEnvConfigured() && (bool) $user->is_their;
    }

    public static function platega(): bool
    {
        return PlanPlategaCheckoutService::isConfigured();
    }

    /**
     * Отдельная кнопка «крипта» (метод 13), если основной способ Platega — не крипта.
     */
    public static function plategaCryptoAvailable(): bool
    {
        if (! self::platega()) {
            return false;
        }
        if (! filter_var(env('PLATEGA_ENABLE_CRYPTO', true), FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        return (int) env('PLATEGA_PAYMENT_METHOD', 2) !== 13;
    }

    public static function canPayOnSite(User $user): bool
    {
        return self::monetaForUser($user) || self::platega();
    }

    /**
     * @return array{moneta: bool, platega: bool, platega_crypto: bool}
     */
    public static function forUser(User $user): array
    {
        return [
            'moneta' => self::monetaForUser($user),
            'platega' => self::platega(),
            'platega_crypto' => self::plategaCryptoAvailable(),
        ];
    }
}

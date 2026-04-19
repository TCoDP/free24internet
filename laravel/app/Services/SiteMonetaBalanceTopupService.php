<?php

namespace App\Services;

use App\Models\MonetaCheckoutSession;
use App\Support\BalanceTopupAmounts;

/**
 * Пополнение баланса через Moneta из личного кабинета (веб).
 */
class SiteMonetaBalanceTopupService
{
    /**
     * @return array{ok: true, redirectUrl: string}|array{ok: false, reason: string}
     */
    public function start(User $user, int $amountRub, string $locale): array
    {
        if (! in_array($amountRub, BalanceTopupAmounts::rub(), true)) {
            return ['ok' => false, 'reason' => 'invalid_amount'];
        }

        $accountId = trim((string) env('MONETA_ACCOUNT_ID'));
        $secret = trim((string) env('MONETA_SECRET'));
        if ($accountId === '' || $secret === '') {
            return ['ok' => false, 'reason' => 'not_configured'];
        }

        $sessionId = $this->makeTransactionId('f24w', $user->id, $amountRub);

        MonetaCheckoutSession::query()->create([
            'mnt_transaction_id' => $sessionId,
            'user_id' => $user->id,
            'purpose' => 'balance',
            'plan_months' => 0,
            'referral_code' => null,
            'amount_rub' => $amountRub,
            'created_at' => now(),
        ]);

        $redirectUrl = $this->buildMonetaUrl([
            'accountId' => $accountId,
            'transactionId' => $sessionId,
            'amountRub' => $amountRub,
            'currencyCode' => 'RUB',
            'testMode' => $this->monetaDemoEnabled(),
            'useDemoHost' => $this->monetaDemoEnabled(),
            'secret' => $secret,
            'successUrl' => $this->authUrl().'/account/profile?payment=return&provider=moneta&topup=1',
            'description' => ($this->storeName()).' — пополнение баланса '.$amountRub.' ₽',
            'locale' => $locale === 'en' ? 'en' : 'ru',
            'custom1' => (string) $user->id,
        ]);

        return ['ok' => true, 'redirectUrl' => $redirectUrl];
    }

    private function makeTransactionId(string $prefix, int $userId, int $value): string
    {
        return substr($prefix.'_'.$userId.'_'.$value.'_'.now()->valueOf().'_'.bin2hex(random_bytes(6)), 0, 255);
    }

    private function authUrl(): string
    {
        return rtrim((string) env('AUTH_URL', config('app.url')), '/');
    }

    private function storeName(): string
    {
        $name = trim((string) env('MONETA_STORE_NAME'));
        if ($name !== '') {
            return $name;
        }

        return parse_url($this->authUrl(), PHP_URL_HOST) ?: 'free24internet.vip';
    }

    private function monetaDemoEnabled(): bool
    {
        $demo = strtolower(trim((string) env('MONETA_DEMO', '0')));

        return $demo === '1' || $demo === 'true';
    }

    private function buildMonetaUrl(array $params): string
    {
        $base = $params['useDemoHost'] ? 'https://demo.moneta.ru/assistant.htm' : 'https://moneta.ru/assistant.htm';
        $amount = number_format((float) $params['amountRub'], 2, '.', '');
        $query = http_build_query([
            'MNT_ID' => $params['accountId'],
            'MNT_TRANSACTION_ID' => $params['transactionId'],
            'MNT_AMOUNT' => $amount,
            'MNT_CURRENCY_CODE' => $params['currencyCode'],
            'MNT_TEST_MODE' => $params['testMode'] ? '1' : '0',
            'MNT_DESCRIPTION' => $params['description'],
            'MNT_SUCCESS_URL' => $params['successUrl'],
            'MNT_SIGNATURE' => $this->requestSignature($params['accountId'], $params['transactionId'], $amount, $params['currencyCode'], $params['testMode'], $params['secret']),
            'moneta.locale' => $params['locale'] === 'en' ? 'en' : 'ru',
        ]);

        if (! empty($params['custom1'])) {
            $query .= '&MNT_CUSTOM1='.urlencode((string) $params['custom1']);
        }

        return $base.'?'.$query;
    }

    private function requestSignature(string $accountId, string $transactionId, string $amount, string $currencyCode, bool $testMode, string $secret): string
    {
        return md5($accountId.$transactionId.$amount.$currencyCode.($testMode ? '1' : '0').$secret);
    }
}

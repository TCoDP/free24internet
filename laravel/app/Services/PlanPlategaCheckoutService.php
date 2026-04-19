<?php

namespace App\Services;

use App\Models\PlategaCheckoutSession;
use App\Models\User;
use App\Support\BalanceTopupAmounts;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Оплата тарифа через Platega.io (см. https://docs.platega.io/).
 */
class PlanPlategaCheckoutService
{
    private const ALLOWED_METHODS = [2, 3, 11, 12, 13];

    /**
     * @param  int|null  $paymentMethodOverride  null = из PLATEGA_PAYMENT_METHOD; 13 = крипто (Platega)
     * @return array{ok: true, redirectUrl: string}|array{ok: false, reason: string}
     */
    public function start(User $user, int $planMonths, ?string $referralCode, string $locale, ?int $paymentMethodOverride = null): array
    {
        $merchantId = trim((string) env('PLATEGA_MERCHANT_ID'));
        $secret = trim((string) env('PLATEGA_SECRET'));
        if ($merchantId === '' || $secret === '') {
            return ['ok' => false, 'reason' => 'not_configured'];
        }

        $pricing = $this->pricingTerms();
        if (! array_key_exists($planMonths, $pricing)) {
            return ['ok' => false, 'reason' => 'plan_unavailable'];
        }

        $authUrl = rtrim((string) env('AUTH_URL', config('app.url')), '/');
        if ($authUrl === '') {
            return ['ok' => false, 'reason' => 'no_auth_url'];
        }

        $amountRub = (float) $pricing[$planMonths];
        $paymentMethod = $paymentMethodOverride ?? (int) env('PLATEGA_PAYMENT_METHOD', 2);
        if (! in_array($paymentMethod, self::ALLOWED_METHODS, true)) {
            return ['ok' => false, 'reason' => 'invalid_payment_method'];
        }

        $crypto = $paymentMethod === 13;
        $successUrl = $authUrl.'/account/plans?payment=return&provider=platega'.($crypto ? '&kind=crypto' : '');
        $failedUrl = $authUrl.'/account/plans?payment=failed&provider=platega'.($crypto ? '&kind=crypto' : '');
        $description = $locale === 'en'
            ? $this->storeName().' — subscription '.$planMonths.' mo.'.($crypto ? ' (crypto)' : '')
            : $this->storeName().' — подписка '.$planMonths.' мес.'.($crypto ? ' (крипто)' : '');

        $body = [
            'paymentMethod' => $paymentMethod,
            'paymentDetails' => [
                'amount' => $amountRub,
                'currency' => 'RUB',
            ],
            'description' => $description,
            'return' => $successUrl,
            'failedUrl' => $failedUrl,
            'payload' => 'site_plan:'.$user->id.':'.$planMonths,
        ];

        $apiBase = rtrim((string) env('PLATEGA_API_BASE', 'https://app.platega.io'), '/');
        $url = $apiBase.'/transaction/process';

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-MerchantId' => $merchantId,
                    'X-Secret' => $secret,
                    'Accept' => 'application/json',
                ])
                ->asJson()
                ->post($url, $body);
        } catch (\Throwable) {
            return ['ok' => false, 'reason' => 'platega_unreachable'];
        }

        if (! $response->successful()) {
            return ['ok' => false, 'reason' => 'platega_error'];
        }

        $data = $response->json();
        $transactionId = (string) ($data['transactionId'] ?? '');
        $redirect = (string) ($data['redirect'] ?? '');
        if ($transactionId === '' || $redirect === '' || ! Str::isUuid($transactionId)) {
            return ['ok' => false, 'reason' => 'platega_invalid_response'];
        }

        PlategaCheckoutSession::query()->create([
            'platega_transaction_id' => $transactionId,
            'user_id' => $user->id,
            'purpose' => 'plan',
            'plan_months' => $planMonths,
            'referral_code' => $this->normalizeReferralCode($referralCode),
            'amount_rub' => $amountRub,
            'payment_method' => $paymentMethod,
            'created_at' => now(),
        ]);

        return ['ok' => true, 'redirectUrl' => $redirect];
    }

    /**
     * Пополнение баланса в кабинете (та же БД, что у бота).
     *
     * @return array{ok: true, redirectUrl: string}|array{ok: false, reason: string}
     */
    public function startBalanceTopup(User $user, int $amountRub, string $locale, ?int $paymentMethodOverride = null): array
    {
        if (! in_array($amountRub, BalanceTopupAmounts::rub(), true)) {
            return ['ok' => false, 'reason' => 'invalid_amount'];
        }

        $merchantId = trim((string) env('PLATEGA_MERCHANT_ID'));
        $secret = trim((string) env('PLATEGA_SECRET'));
        if ($merchantId === '' || $secret === '') {
            return ['ok' => false, 'reason' => 'not_configured'];
        }

        $authUrl = rtrim((string) env('AUTH_URL', config('app.url')), '/');
        if ($authUrl === '') {
            return ['ok' => false, 'reason' => 'no_auth_url'];
        }

        $amountFloat = (float) $amountRub;
        $paymentMethod = $paymentMethodOverride ?? (int) env('PLATEGA_PAYMENT_METHOD', 2);
        if (! in_array($paymentMethod, self::ALLOWED_METHODS, true)) {
            return ['ok' => false, 'reason' => 'invalid_payment_method'];
        }

        $crypto = $paymentMethod === 13;
        $description = $locale === 'en'
            ? $this->storeName().' — balance top-up '.$amountRub.' RUB'.($crypto ? ' (crypto)' : '')
            : $this->storeName().' — пополнение баланса '.$amountRub.' ₽'.($crypto ? ' (крипто)' : '');

        $body = [
            'paymentMethod' => $paymentMethod,
            'paymentDetails' => [
                'amount' => $amountFloat,
                'currency' => 'RUB',
            ],
            'description' => $description,
            'return' => $authUrl.'/account/profile?payment=return&provider=platega&topup=1'.($crypto ? '&kind=crypto' : ''),
            'failedUrl' => $authUrl.'/account/profile?payment=failed&provider=platega'.($crypto ? '&kind=crypto' : ''),
            'payload' => 'site_balance:'.$user->id.':'.$amountRub,
        ];

        $apiBase = rtrim((string) env('PLATEGA_API_BASE', 'https://app.platega.io'), '/');
        $url = $apiBase.'/transaction/process';

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-MerchantId' => $merchantId,
                    'X-Secret' => $secret,
                    'Accept' => 'application/json',
                ])
                ->asJson()
                ->post($url, $body);
        } catch (\Throwable) {
            return ['ok' => false, 'reason' => 'platega_unreachable'];
        }

        if (! $response->successful()) {
            return ['ok' => false, 'reason' => 'platega_error'];
        }

        $data = $response->json();
        $transactionId = (string) ($data['transactionId'] ?? '');
        $redirect = (string) ($data['redirect'] ?? '');
        if ($transactionId === '' || $redirect === '' || ! Str::isUuid($transactionId)) {
            return ['ok' => false, 'reason' => 'platega_invalid_response'];
        }

        PlategaCheckoutSession::query()->create([
            'platega_transaction_id' => $transactionId,
            'user_id' => $user->id,
            'purpose' => 'balance',
            'plan_months' => 0,
            'referral_code' => null,
            'amount_rub' => $amountFloat,
            'payment_method' => $paymentMethod,
            'created_at' => now(),
        ]);

        return ['ok' => true, 'redirectUrl' => $redirect];
    }

    /**
     * @return list<int>
     */
    public function allowedPlanMonths(): array
    {
        return array_keys($this->pricingTerms());
    }

    public static function isConfigured(): bool
    {
        return trim((string) env('PLATEGA_MERCHANT_ID')) !== ''
            && trim((string) env('PLATEGA_SECRET')) !== '';
    }

    /**
     * @return array<int, float>
     */
    private function pricingTerms(): array
    {
        $global = DB::table('pricing_global')->where('id', 1)->first();
        $terms = DB::table('pricing_plan_terms')->where('is_active', 1)->get();

        $out = [];
        foreach ($terms as $term) {
            $pay = round(((float) ($global->base_monthly_rub ?? 60)) * (int) $term->months * (1 - (float) $term->discount_rate));
            $out[(int) $term->months] = $pay;
        }

        return $out;
    }

    private function normalizeReferralCode(?string $raw): ?string
    {
        $code = strtoupper(trim((string) $raw));

        return $code === '' ? null : preg_replace('/\s+/', '', $code);
    }

    private function storeName(): string
    {
        $name = trim((string) env('MONETA_STORE_NAME'));
        if ($name !== '') {
            return $name;
        }

        $auth = rtrim((string) env('AUTH_URL', config('app.url')), '/');

        return parse_url($auth, PHP_URL_HOST) ?: 'free24internet.vip';
    }
}

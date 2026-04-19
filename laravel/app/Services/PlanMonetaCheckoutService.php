<?php

namespace App\Services;

use App\Http\Controllers\Api\MonetaController;
use App\Models\MonetaCheckoutSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Создание сессии оплаты тарифа через Moneta Assistant (веб-кабинет).
 * Логика согласована с {@see MonetaController} (бот).
 */
class PlanMonetaCheckoutService
{
    /**
     * @return array{ok: true, redirectUrl: string}|array{ok: false, reason: string}
     */
    public function start(User $user, int $planMonths, ?string $referralCode, string $locale): array
    {
        if (! (bool) $user->is_their) {
            return ['ok' => false, 'reason' => 'not_eligible'];
        }

        $accountId = trim((string) env('MONETA_ACCOUNT_ID'));
        $secret = trim((string) env('MONETA_SECRET'));
        if ($accountId === '' || $secret === '') {
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

        $amountRub = $pricing[$planMonths];
        $sessionId = $this->makeTransactionId('f24', $user->id, $planMonths);

        MonetaCheckoutSession::query()->create([
            'mnt_transaction_id' => $sessionId,
            'user_id' => $user->id,
            'purpose' => 'plan',
            'plan_months' => $planMonths,
            'referral_code' => $this->normalizeReferralCode($referralCode),
            'amount_rub' => $amountRub,
            'created_at' => now(),
        ]);

        $successUrl = $authUrl.'/account/plans?payment=return';
        $description = $locale === 'en'
            ? $this->storeName().' — subscription '.$planMonths.' mo.'
            : $this->storeName().' — подписка '.$planMonths.' мес.';

        $redirectUrl = $this->buildMonetaUrl([
            'accountId' => $accountId,
            'transactionId' => $sessionId,
            'amountRub' => $amountRub,
            'currencyCode' => 'RUB',
            'testMode' => $this->monetaDemoEnabled(),
            'useDemoHost' => $this->monetaDemoEnabled(),
            'secret' => $secret,
            'successUrl' => $successUrl,
            'description' => $description,
            'locale' => $locale === 'en' ? 'en' : 'ru',
            'custom1' => (string) $user->id,
        ]);

        return ['ok' => true, 'redirectUrl' => $redirectUrl];
    }

    /**
     * @return list<int>
     */
    public function allowedPlanMonths(): array
    {
        return array_keys($this->pricingTerms());
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

    private function makeTransactionId(string $prefix, int $userId, int $value): string
    {
        return substr($prefix.'_'.$userId.'_'.$value.'_'.now()->valueOf().'_'.bin2hex(random_bytes(6)), 0, 255);
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

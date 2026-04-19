<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonetaCheckoutSession;
use App\Models\User;
use App\Models\UserTransaction;
use App\Services\PaidCheckoutFulfillmentService;
use App\Services\PaymentSuccessNotificationService;
use App\Support\BalanceTopupAmounts;
use App\Support\BotPaymentUser;
use App\Support\SitePaymentOptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class MonetaController extends Controller
{
    public function __construct(
        private PaidCheckoutFulfillmentService $fulfillment,
        private PaymentSuccessNotificationService $paymentSuccessNotify,
    ) {}

    /**
     * Какие способы оплаты через сайт доступны пользователю с данным Telegram (для кнопок в боте).
     */
    public function capabilities(Request $request): JsonResponse
    {
        $expected = trim((string) env('BOT_PAYMENT_SESSION_SECRET'));
        if ($expected === '') {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        if ($request->header('X-Bot-Payment-Secret') !== $expected) {
            return response()->json(['ok' => false, 'reason' => 'forbidden'], 403);
        }

        $request->validate([
            'telegramUserId' => ['required', 'integer', 'min:1'],
        ]);

        $user = BotPaymentUser::resolveByTelegramId((int) $request->input('telegramUserId'));
        $providers = SitePaymentOptions::forUser($user);

        $planMonths = array_keys($this->fulfillment->pricingTerms());
        sort($planMonths);

        // Moneta — только при users.is_their (как в кабинете SitePaymentOptions::forUser).
        return response()->json([
            'ok' => true,
            'moneta' => $providers['moneta'],
            'platega' => $providers['platega'],
            'platega_crypto' => $providers['platega_crypto'],
            'balanceTopupAmountsRub' => BalanceTopupAmounts::rub(),
            'planMonthsAvailable' => $planMonths,
        ]);
    }

    public function createBotPlanSession(Request $request): JsonResponse
    {
        $expected = trim((string) env('BOT_PAYMENT_SESSION_SECRET'));
        if ($expected === '') {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        if ($request->header('X-Bot-Payment-Secret') !== $expected) {
            return response()->json(['ok' => false, 'reason' => 'forbidden'], 403);
        }

        $data = $request->validate([
            'telegramUserId' => ['required', 'integer', 'min:1'],
            'planMonths' => ['required', 'integer', 'min:1'],
            'referralCode' => ['nullable', 'string', 'max:64'],
            'locale' => ['nullable', 'in:ru,en'],
        ]);

        $user = BotPaymentUser::resolveByTelegramId((int) $data['telegramUserId']);

        if (! SitePaymentOptions::monetaForUser($user)) {
            return response()->json(['ok' => false, 'reason' => 'not_eligible'], 403);
        }

        $pricing = $this->fulfillment->pricingTerms();
        $planMonths = (int) $data['planMonths'];
        if (! array_key_exists($planMonths, $pricing)) {
            return response()->json(['ok' => false, 'reason' => 'validation'], 400);
        }

        $amountRub = $pricing[$planMonths];
        $sessionId = $this->makeTransactionId('f24', $user->id, $planMonths);

        MonetaCheckoutSession::query()->create([
            'mnt_transaction_id' => $sessionId,
            'user_id' => $user->id,
            'purpose' => 'plan',
            'plan_months' => $planMonths,
            'referral_code' => $this->fulfillment->normalizeReferralCode($data['referralCode'] ?? null),
            'amount_rub' => $amountRub,
            'created_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'redirectUrl' => $this->buildMonetaUrl([
                'accountId' => trim((string) env('MONETA_ACCOUNT_ID')),
                'transactionId' => $sessionId,
                'amountRub' => $amountRub,
                'currencyCode' => 'RUB',
                'testMode' => $this->monetaDemoEnabled(),
                'useDemoHost' => $this->monetaDemoEnabled(),
                'secret' => trim((string) env('MONETA_SECRET')),
                'successUrl' => $this->authUrl().'/account/plans?payment=return&from=telegram',
                'description' => ($this->storeName()).' — подписка '.$planMonths.' мес.',
                'locale' => $data['locale'] === 'en' ? 'en' : 'ru',
                'custom1' => (string) $user->id,
            ]),
        ]);
    }

    public function createBotBalanceSession(Request $request): JsonResponse
    {
        $expected = trim((string) env('BOT_PAYMENT_SESSION_SECRET'));
        if ($expected === '') {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        if ($request->header('X-Bot-Payment-Secret') !== $expected) {
            return response()->json(['ok' => false, 'reason' => 'forbidden'], 403);
        }

        $data = $request->validate([
            'telegramUserId' => ['required', 'integer', 'min:1'],
            'amountRub' => ['required', 'integer', 'min:1'],
            'locale' => ['nullable', 'in:ru,en'],
        ]);

        if (! in_array((int) $data['amountRub'], BalanceTopupAmounts::rub(), true)) {
            return response()->json(['ok' => false, 'reason' => 'validation'], 400);
        }

        $user = BotPaymentUser::resolveByTelegramId((int) $data['telegramUserId']);

        if (! SitePaymentOptions::monetaForUser($user)) {
            return response()->json(['ok' => false, 'reason' => 'not_eligible'], 403);
        }

        $sessionId = $this->makeTransactionId('f24b', $user->id, (int) $data['amountRub']);

        MonetaCheckoutSession::query()->create([
            'mnt_transaction_id' => $sessionId,
            'user_id' => $user->id,
            'purpose' => 'balance',
            'plan_months' => 0,
            'referral_code' => null,
            'amount_rub' => (int) $data['amountRub'],
            'created_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'redirectUrl' => $this->buildMonetaUrl([
                'accountId' => trim((string) env('MONETA_ACCOUNT_ID')),
                'transactionId' => $sessionId,
                'amountRub' => (int) $data['amountRub'],
                'currencyCode' => 'RUB',
                'testMode' => $this->monetaDemoEnabled(),
                'useDemoHost' => $this->monetaDemoEnabled(),
                'secret' => trim((string) env('MONETA_SECRET')),
                'successUrl' => $this->authUrl().'/account/profile?payment=return&from=telegram&topup=1',
                'description' => ($this->storeName()).' — пополнение баланса '.$data['amountRub'].' ₽',
                'locale' => $data['locale'] === 'en' ? 'en' : 'ru',
                'custom1' => (string) $user->id,
            ]),
        ]);
    }

    public function webhook(Request $request): Response
    {
        $monetaSecret = trim((string) env('MONETA_SECRET'));
        $accountId = trim((string) env('MONETA_ACCOUNT_ID'));
        if ($monetaSecret === '' || $accountId === '') {
            return response('FAIL', 503)->header('Content-Type', 'text/plain; charset=utf-8');
        }

        $params = $request->isMethod('get')
            ? $request->query()
            : ($request->all() ?: $this->parseUrlEncodedBody($request));

        $mntId = (string) ($params['MNT_ID'] ?? '');
        $mntTransactionId = (string) ($params['MNT_TRANSACTION_ID'] ?? '');
        $mntOperationId = (string) ($params['MNT_OPERATION_ID'] ?? '');
        $mntAmount = (string) ($params['MNT_AMOUNT'] ?? '');
        $mntCurrency = (string) ($params['MNT_CURRENCY_CODE'] ?? 'RUB');
        $mntTestMode = (string) ($params['MNT_TEST_MODE'] ?? '0');
        $mntSignature = strtolower((string) ($params['MNT_SIGNATURE'] ?? ''));

        if ($mntTransactionId === '' || $mntAmount === '') {
            return response('FAIL', 400)->header('Content-Type', 'text/plain; charset=utf-8');
        }
        if ($mntId !== '' && $mntId !== $accountId) {
            return response('FAIL', 403)->header('Content-Type', 'text/plain; charset=utf-8');
        }

        $expected = strtolower($this->notificationSignature([
            'accountId' => $mntId !== '' ? $mntId : $accountId,
            'transactionId' => $mntTransactionId,
            'operationId' => $mntOperationId,
            'amountStr' => $mntAmount,
            'currencyCode' => $mntCurrency,
            'testModeStr' => $mntTestMode,
            'secret' => $monetaSecret,
        ]));

        if ($mntSignature !== $expected) {
            return response('FAIL', 403)->header('Content-Type', 'text/plain; charset=utf-8');
        }

        $session = MonetaCheckoutSession::query()->where('mnt_transaction_id', $mntTransactionId)->first();
        if (! $session) {
            return response('FAIL', 404)->header('Content-Type', 'text/plain; charset=utf-8');
        }
        if ($session->completed_at) {
            return response('SUCCESS', 200)->header('Content-Type', 'text/plain; charset=utf-8');
        }

        if (abs(((float) $session->amount_rub) - ((float) $mntAmount)) > 0.02) {
            return response('FAIL', 400)->header('Content-Type', 'text/plain; charset=utf-8');
        }

        $externalId = trim($mntOperationId) !== '' ? trim($mntOperationId) : $mntTransactionId;
        if (UserTransaction::query()->where('external_payment_id', $externalId)->where('status', 'completed')->exists()) {
            $session->update(['completed_at' => now()]);

            return response('SUCCESS', 200)->header('Content-Type', 'text/plain; charset=utf-8');
        }

        $userId = (int) $session->user_id;
        $sessionPurpose = (string) $session->purpose;
        $sessionPlanMonths = (int) $session->plan_months;
        $paid = (float) $mntAmount;

        DB::transaction(function () use ($session, $externalId, $mntAmount) {
            $user = User::query()->lockForUpdate()->find($session->user_id);
            if (! $user) {
                abort(400, 'user_not_found');
            }

            if ($session->purpose === 'balance') {
                $this->fulfillment->applyBalanceTopup($user, (float) $mntAmount, $externalId, 'moneta');
                $session->update(['completed_at' => now()]);

                return;
            }

            $planMonths = (int) $session->plan_months;
            if ($planMonths <= 0) {
                abort(400, 'invalid_plan');
            }

            $this->fulfillment->applyPlanPurchase($user, $planMonths, $session->referral_code, (float) $mntAmount, $externalId, 'moneta');
            $session->update(['completed_at' => now()]);
        });

        try {
            if ($u = User::query()->find($userId)) {
                $this->paymentSuccessNotify->notify(
                    $u,
                    'moneta',
                    $paid,
                    $sessionPurpose === 'balance' ? 'balance' : 'plan',
                    $sessionPlanMonths,
                    $externalId
                );
            }
        } catch (\Throwable $e) {
            Log::error('moneta webhook: payment success notification', [
                'user_id' => $userId,
                'exception' => $e->getMessage(),
            ]);
        }

        return response('SUCCESS', 200)->header('Content-Type', 'text/plain; charset=utf-8');
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

    private function notificationSignature(array $data): string
    {
        return md5(
            $data['accountId'].
            $data['transactionId'].
            $data['operationId'].
            number_format((float) $data['amountStr'], 2, '.', '').
            $data['currencyCode'].
            $data['testModeStr'].
            $data['secret']
        );
    }

    private function parseUrlEncodedBody(Request $request): array
    {
        parse_str($request->getContent() ?? '', $parsed);

        return is_array($parsed) ? $parsed : [];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlategaCheckoutSession;
use App\Models\User;
use App\Models\UserTransaction;
use App\Services\PaidCheckoutFulfillmentService;
use App\Services\PaymentSuccessNotificationService;
use App\Services\PlanPlategaCheckoutService;
use App\Support\BalanceTopupAmounts;
use App\Support\BotPaymentUser;
use App\Support\SitePaymentOptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PlategaController extends Controller
{
    public function __construct(
        private PaidCheckoutFulfillmentService $fulfillment,
        private PaymentSuccessNotificationService $paymentSuccessNotify,
    ) {}

    public function createBotPlanSession(Request $request): JsonResponse
    {
        $expected = trim((string) env('BOT_PAYMENT_SESSION_SECRET'));
        if ($expected === '') {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        if ($request->header('X-Bot-Payment-Secret') !== $expected) {
            return response()->json(['ok' => false, 'reason' => 'forbidden'], 403);
        }

        if (! PlanPlategaCheckoutService::isConfigured()) {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        $data = $request->validate([
            'telegramUserId' => ['required', 'integer', 'min:1'],
            'planMonths' => ['required', 'integer', 'min:1'],
            'referralCode' => ['nullable', 'string', 'max:64'],
            'locale' => ['nullable', 'in:ru,en'],
            'useCrypto' => ['sometimes', 'boolean'],
        ]);

        $user = BotPaymentUser::resolveByTelegramId((int) $data['telegramUserId']);

        $pricing = $this->fulfillment->pricingTerms();
        $planMonths = (int) $data['planMonths'];
        if (! array_key_exists($planMonths, $pricing)) {
            return response()->json(['ok' => false, 'reason' => 'validation'], 400);
        }

        $useCrypto = filter_var($data['useCrypto'] ?? false, FILTER_VALIDATE_BOOLEAN);
        [$paymentMethod, $methodError] = $this->botPlategaPaymentMethod($useCrypto);
        if ($methodError instanceof JsonResponse) {
            return $methodError;
        }

        $amountRub = (float) $pricing[$planMonths];
        $merchantId = trim((string) env('PLATEGA_MERCHANT_ID'));
        $secret = trim((string) env('PLATEGA_SECRET'));
        $authUrl = rtrim((string) env('AUTH_URL', config('app.url')), '/');
        $locale = ($data['locale'] ?? 'ru') === 'en' ? 'en' : 'ru';
        $crypto = $paymentMethod === 13;
        $description = $locale === 'en'
            ? $this->storeName().' — subscription '.$planMonths.' mo. (Telegram)'.($crypto ? ' crypto' : '')
            : $this->storeName().' — подписка '.$planMonths.' мес. (Telegram)'.($crypto ? ', крипто' : '');

        $body = [
            'paymentMethod' => $paymentMethod,
            'paymentDetails' => [
                'amount' => $amountRub,
                'currency' => 'RUB',
            ],
            'description' => $description,
            'return' => $authUrl.'/account/plans?payment=return&provider=platega&from=telegram'.($crypto ? '&kind=crypto' : ''),
            'failedUrl' => $authUrl.'/account/plans?payment=failed&provider=platega&from=telegram'.($crypto ? '&kind=crypto' : ''),
            'payload' => 'bot_plan:'.$user->id.':'.$planMonths,
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
            return response()->json(['ok' => false, 'reason' => 'network'], 502);
        }

        if (! $response->successful()) {
            return response()->json(['ok' => false, 'reason' => 'platega_error'], 502);
        }

        $json = $response->json();
        $transactionId = (string) ($json['transactionId'] ?? '');
        $redirect = (string) ($json['redirect'] ?? '');
        if ($transactionId === '' || $redirect === '' || ! Str::isUuid($transactionId)) {
            return response()->json(['ok' => false, 'reason' => 'server'], 502);
        }

        PlategaCheckoutSession::query()->create([
            'platega_transaction_id' => $transactionId,
            'user_id' => $user->id,
            'purpose' => 'plan',
            'plan_months' => $planMonths,
            'referral_code' => $this->fulfillment->normalizeReferralCode($data['referralCode'] ?? null),
            'amount_rub' => $amountRub,
            'payment_method' => $paymentMethod,
            'created_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'redirectUrl' => $redirect,
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

        if (! PlanPlategaCheckoutService::isConfigured()) {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        $data = $request->validate([
            'telegramUserId' => ['required', 'integer', 'min:1'],
            'amountRub' => ['required', 'integer', 'min:1'],
            'locale' => ['nullable', 'in:ru,en'],
            'useCrypto' => ['sometimes', 'boolean'],
        ]);

        if (! in_array((int) $data['amountRub'], BalanceTopupAmounts::rub(), true)) {
            return response()->json(['ok' => false, 'reason' => 'validation'], 400);
        }

        $user = BotPaymentUser::resolveByTelegramId((int) $data['telegramUserId']);

        $useCrypto = filter_var($data['useCrypto'] ?? false, FILTER_VALIDATE_BOOLEAN);
        [$paymentMethod, $methodError] = $this->botPlategaPaymentMethod($useCrypto);
        if ($methodError instanceof JsonResponse) {
            return $methodError;
        }

        $amountRub = (float) (int) $data['amountRub'];
        $merchantId = trim((string) env('PLATEGA_MERCHANT_ID'));
        $secret = trim((string) env('PLATEGA_SECRET'));
        $authUrl = rtrim((string) env('AUTH_URL', config('app.url')), '/');
        $locale = ($data['locale'] ?? 'ru') === 'en' ? 'en' : 'ru';
        $crypto = $paymentMethod === 13;
        $description = $locale === 'en'
            ? $this->storeName().' — balance top-up '.(int) $data['amountRub'].' RUB (Telegram)'.($crypto ? ' crypto' : '')
            : $this->storeName().' — пополнение баланса '.(int) $data['amountRub'].' ₽ (Telegram)'.($crypto ? ', крипто' : '');

        $body = [
            'paymentMethod' => $paymentMethod,
            'paymentDetails' => [
                'amount' => $amountRub,
                'currency' => 'RUB',
            ],
            'description' => $description,
            'return' => $authUrl.'/account/profile?payment=return&provider=platega&from=telegram&topup=1'.($crypto ? '&kind=crypto' : ''),
            'failedUrl' => $authUrl.'/account/profile?payment=failed&provider=platega&from=telegram'.($crypto ? '&kind=crypto' : ''),
            'payload' => 'bot_balance:'.$user->id.':'.(int) $data['amountRub'],
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
            return response()->json(['ok' => false, 'reason' => 'network'], 502);
        }

        if (! $response->successful()) {
            return response()->json(['ok' => false, 'reason' => 'platega_error'], 502);
        }

        $json = $response->json();
        $transactionId = (string) ($json['transactionId'] ?? '');
        $redirect = (string) ($json['redirect'] ?? '');
        if ($transactionId === '' || $redirect === '' || ! Str::isUuid($transactionId)) {
            return response()->json(['ok' => false, 'reason' => 'server'], 502);
        }

        PlategaCheckoutSession::query()->create([
            'platega_transaction_id' => $transactionId,
            'user_id' => $user->id,
            'purpose' => 'balance',
            'plan_months' => 0,
            'referral_code' => null,
            'amount_rub' => $amountRub,
            'payment_method' => $paymentMethod,
            'created_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'redirectUrl' => $redirect,
        ]);
    }

    public function webhook(Request $request): Response
    {
        $merchantId = trim((string) env('PLATEGA_MERCHANT_ID'));
        $secret = trim((string) env('PLATEGA_SECRET'));
        if ($merchantId === '' || $secret === '') {
            return response()->json(['ok' => false], 503);
        }

        if ($request->header('X-MerchantId') !== $merchantId || $request->header('X-Secret') !== $secret) {
            return response()->json(['ok' => false], 403);
        }

        $payload = $request->json()->all();
        $id = (string) ($payload['id'] ?? '');
        $status = strtoupper((string) ($payload['status'] ?? ''));
        $amount = isset($payload['amount']) ? (float) $payload['amount'] : null;

        if ($id === '' || $amount === null || ! Str::isUuid($id)) {
            return response()->json(['ok' => false], 400);
        }

        if ($status !== 'CONFIRMED') {
            return response()->json(['ok' => true]);
        }

        $session = PlategaCheckoutSession::query()->where('platega_transaction_id', $id)->first();
        if (! $session) {
            return response()->json(['ok' => false], 404);
        }
        if ($session->completed_at) {
            return response()->json(['ok' => true]);
        }

        $expected = (float) $session->amount_rub;
        $paid = (float) $amount;
        // В callback может прийти сумма с наценкой способа (СБП +11% и т.д.), в сессии — та же база, что в transaction/process
        $minOk = $expected - 0.02;
        $maxOk = $expected * 1.12 + 0.10;
        if ($paid < $minOk || $paid > $maxOk) {
            return response()->json(['ok' => false], 400);
        }

        if (UserTransaction::query()->where('external_payment_id', $id)->where('status', 'completed')->exists()) {
            $session->update(['completed_at' => now()]);

            return response()->json(['ok' => true]);
        }

        $userId = (int) $session->user_id;
        $sessionPurpose = (string) $session->purpose;
        $sessionPlanMonths = (int) $session->plan_months;
        $paid = (float) $amount;

        DB::transaction(function () use ($session, $id, $amount) {
            $user = User::query()->lockForUpdate()->find($session->user_id);
            if (! $user) {
                abort(400, 'user_not_found');
            }

            if ($session->purpose === 'balance') {
                $this->fulfillment->applyBalanceTopup($user, $amount, $id, 'platega');
                $session->update(['completed_at' => now()]);

                return;
            }

            $planMonths = (int) $session->plan_months;
            if ($planMonths <= 0) {
                abort(400, 'invalid_plan');
            }

            $this->fulfillment->applyPlanPurchase(
                $user,
                $planMonths,
                $session->referral_code,
                $amount,
                $id,
                'platega',
            );
            $session->update(['completed_at' => now()]);
        });

        try {
            if ($u = User::query()->find($userId)) {
                $this->paymentSuccessNotify->notify(
                    $u,
                    'platega',
                    $paid,
                    $sessionPurpose === 'balance' ? 'balance' : 'plan',
                    $sessionPlanMonths,
                    $id
                );
            }
        } catch (\Throwable $e) {
            Log::error('platega webhook: payment success notification', [
                'user_id' => $userId,
                'exception' => $e->getMessage(),
            ]);
        }

        return response()->json(['ok' => true]);
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

    /**
     * @return array{0: int, 1: JsonResponse|null}
     */
    private function botPlategaPaymentMethod(bool $useCrypto): array
    {
        $main = (int) env('PLATEGA_PAYMENT_METHOD', 2);
        if ($useCrypto) {
            if ($main === 13) {
                return [13, null];
            }
            if (! SitePaymentOptions::plategaCryptoAvailable()) {
                return [0, response()->json(['ok' => false, 'reason' => 'validation'], 400)];
            }

            return [13, null];
        }

        return [$main, null];
    }
}

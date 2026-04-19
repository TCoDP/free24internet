<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Services\PlanPlategaCheckoutService;
use App\Services\SiteMonetaBalanceTopupService;
use App\Support\BalanceTopupAmounts;
use App\Support\SitePaymentOptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BalanceTopupController extends Controller
{
    public function pay(
        Request $request,
        SiteMonetaBalanceTopupService $monetaBalance,
        PlanPlategaCheckoutService $platega,
    ): JsonResponse {
        $user = $request->user();
        $allowedAmounts = BalanceTopupAmounts::rub();

        $validated = $request->validate([
            'amountRub' => ['required', 'integer', Rule::in($allowedAmounts)],
            'provider' => ['required', Rule::in(['moneta', 'platega', 'platega_crypto'])],
            'locale' => ['nullable', 'in:ru,en'],
        ]);

        $providers = SitePaymentOptions::forUser($user);
        $provider = $validated['provider'];
        if (! ($providers[$provider] ?? false)) {
            return response()->json(['ok' => false, 'reason' => 'provider_unavailable'], 422);
        }

        $locale = ($validated['locale'] ?? 'ru') === 'en' ? 'en' : 'ru';
        $amount = (int) $validated['amountRub'];

        $result = match ($provider) {
            'moneta' => $monetaBalance->start($user, $amount, $locale),
            'platega' => $platega->startBalanceTopup($user, $amount, $locale, null),
            'platega_crypto' => $platega->startBalanceTopup($user, $amount, $locale, 13),
            default => ['ok' => false, 'reason' => 'provider_unavailable'],
        };

        if (! $result['ok']) {
            $status = match ($result['reason'] ?? '') {
                'not_eligible' => 403,
                'not_configured', 'no_auth_url' => 503,
                'invalid_amount', 'invalid_payment_method', 'provider_unavailable' => 422,
                'platega_unreachable', 'platega_error', 'platega_invalid_response' => 502,
                default => 500,
            };

            return response()->json($result, $status);
        }

        return response()->json($result);
    }
}

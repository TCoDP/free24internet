<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\PricingGlobal;
use App\Models\PricingPlanTerm;
use App\Models\UserTransaction;
use App\Services\AccountVpnPresentationService;
use App\Services\PlanMonetaCheckoutService;
use App\Services\PlanPlategaCheckoutService;
use App\Services\SiteVpnTrialProvisionService;
use App\Services\VpnSubscriptionImportService;
use App\Support\SitePaymentOptions;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlansController extends Controller
{
    public function __construct(
        private readonly VpnSubscriptionImportService $vpnSubscriptionImport,
        private readonly AccountVpnPresentationService $accountVpnPresentation,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $pricing = PricingGlobal::query()->first();
        $terms = PricingPlanTerm::query()->where('is_active', true)->orderBy('sort_order')->get();
        $transactions = UserTransaction::query()->where('user_id', $user->id)->orderByDesc('created_at')->get();
        $vpnAccess = $this->accountVpnPresentation->vpnAccessSummary($user);

        return Inertia::render('Account/Plans', [
            'pricing' => [
                'base_monthly_rub' => $pricing?->base_monthly_rub ?? 60,
                'trial_days' => $pricing?->trial_days ?? 7,
                'terms' => $terms,
            ],
            'transactions' => $transactions,
            'canPayOnSite' => SitePaymentOptions::canPayOnSite($user),
            'paymentProviders' => SitePaymentOptions::forUser($user),
            'vpnAccess' => $vpnAccess,
            'subscriptionImportUrl' => $this->accountVpnPresentation->subscriptionImportUrlFor($user, $vpnAccess),
        ]);
    }

    public function rotateSubscriptionImport(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $this->vpnSubscriptionImport->rotateImportToken((int) $user->id);
        $vpnAccess = $this->accountVpnPresentation->vpnAccessSummary($user->fresh());
        $url = $this->accountVpnPresentation->subscriptionImportUrlFor($user->fresh(), $vpnAccess, $token);

        return response()->json([
            'ok' => true,
            'subscriptionImportUrl' => $url,
            'vpnAccess' => $vpnAccess,
        ]);
    }

    public function startTrial(Request $request, SiteVpnTrialProvisionService $provisioner): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            return response()->json(['ok' => false, 'reason' => 'email_unverified'], 422);
        }

        $pricing = PricingGlobal::query()->first();
        $trialDays = (int) ($pricing?->trial_days ?? 7);
        $trialDays = max(1, min(30, $trialDays));

        if ($this->userHasVpnKeyRow($user->id)) {
            $user = $user->fresh();
            if (Schema::hasColumn('users', 'expire_time')) {
                $expireMs = DB::table('users')->where('id', $user->id)->value('expire_time');
                if ($expireMs !== null && (int) $expireMs > 0) {
                    $user->trial_ends_at = Carbon::createFromTimestampMs((int) $expireMs);
                    $user->save();
                }
            }
            $u = $user->fresh();
            $vpnAccess = $this->accountVpnPresentation->vpnAccessSummary($u);

            return response()->json([
                'ok' => true,
                'already_active' => true,
                'vless_link' => (string) ($vpnAccess['vpn']['vlessLink'] ?? ''),
                'trial_ends_at' => $user->trial_ends_at?->toIso8601String(),
                'vpnAccess' => $vpnAccess,
                'subscriptionImportUrl' => $this->accountVpnPresentation->subscriptionImportUrlFor($u, $vpnAccess),
            ]);
        }

        $result = $provisioner->provisionTrial($user, $trialDays);

        if (! $result['ok']) {
            $reason = (string) ($result['reason'] ?? 'unknown');
            $status = match ($reason) {
                'trial_only_first', 'panel_port_foreign', 'shared_port_occupied', 'shared_inbound_full' => 422,
                'user_not_found' => 404,
                default => 503,
            };

            $payload = ['ok' => false, 'reason' => $reason];
            if (! empty($result['detail'])) {
                $payload['detail'] = $result['detail'];
            }

            return response()->json($payload, $status);
        }

        $expireMs = (int) ($result['expire_time_ms'] ?? 0);
        if ($expireMs > 0) {
            $user->trial_ends_at = Carbon::createFromTimestampMs($expireMs);
            $user->save();
        }

        // plan_months stores trial length in days for provider site_trial (same column as months for paid rows).
        UserTransaction::query()->create([
            'user_id' => $user->id,
            'amount_rub' => 0,
            'plan_months' => $trialDays,
            'status' => 'completed',
            'provider' => 'site_trial',
            'external_payment_id' => null,
            'completed_at' => now(),
            'created_at' => now(),
        ]);

        $u = $user->fresh();
        $vpnAccess = $this->accountVpnPresentation->vpnAccessSummary($u);

        return response()->json([
            'ok' => true,
            'vless_link' => (string) ($result['vless_link'] ?? ''),
            'trial_ends_at' => $user->trial_ends_at?->toIso8601String(),
            'vpnAccess' => $vpnAccess,
            'subscriptionImportUrl' => $this->accountVpnPresentation->subscriptionImportUrlFor($u, $vpnAccess),
        ]);
    }

    private function userHasVpnKeyRow(int $userId): bool
    {
        if (! Schema::hasColumn('users', 'uuid')) {
            return false;
        }
        $u = DB::table('users')->where('id', $userId)->value('uuid');
        if ($u === null) {
            return false;
        }

        return strlen(trim((string) $u)) > 0;
    }

    public function pay(
        Request $request,
        PlanMonetaCheckoutService $monetaCheckout,
        PlanPlategaCheckoutService $plategaCheckout,
    ): JsonResponse {
        $user = $request->user();
        $allowed = $monetaCheckout->allowedPlanMonths();
        if ($allowed === []) {
            return response()->json(['ok' => false, 'reason' => 'plan_unavailable'], 422);
        }

        $validated = $request->validate([
            'month' => ['required', 'integer', Rule::in($allowed)],
            'referralCode' => ['nullable', 'string', 'max:64'],
            'locale' => ['nullable', 'in:ru,en'],
            'provider' => ['required', Rule::in(['moneta', 'platega', 'platega_crypto'])],
        ]);

        $providers = SitePaymentOptions::forUser($user);
        $provider = $validated['provider'];
        if (! ($providers[$provider] ?? false)) {
            return response()->json(['ok' => false, 'reason' => 'provider_unavailable'], 422);
        }

        $locale = ($validated['locale'] ?? 'ru') === 'en' ? 'en' : 'ru';
        $result = match ($provider) {
            'platega' => $plategaCheckout->start(
                $user,
                (int) $validated['month'],
                $validated['referralCode'] ?? null,
                $locale,
                null,
            ),
            'platega_crypto' => $plategaCheckout->start(
                $user,
                (int) $validated['month'],
                $validated['referralCode'] ?? null,
                $locale,
                13,
            ),
            default => $monetaCheckout->start(
                $user,
                (int) $validated['month'],
                $validated['referralCode'] ?? null,
                $locale,
            ),
        };

        if (! $result['ok']) {
            $status = match ($result['reason']) {
                'not_eligible' => 403,
                'not_configured', 'no_auth_url' => 503,
                'plan_unavailable' => 422,
                'invalid_payment_method' => 422,
                'platega_unreachable', 'platega_error', 'platega_invalid_response' => 502,
                default => 500,
            };

            return response()->json($result, $status);
        }

        return response()->json($result);
    }
}

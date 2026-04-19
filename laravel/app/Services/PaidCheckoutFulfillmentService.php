<?php

namespace App\Services;

use App\Models\ReferralReward;
use App\Models\User;
use App\Models\UserTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Начисление подписки / баланса после успешной оплаты (Moneta, Platega и т.д.).
 */
class PaidCheckoutFulfillmentService
{
    public function applyPlanPurchase(User $user, int $planMonths, ?string $referralCode, float $paidAmount, string $externalId, string $provider): void
    {
        $pricing = $this->pricingTerms();
        if (! array_key_exists($planMonths, $pricing)) {
            abort(400, 'invalid_plan');
        }

        $now = now();
        $base = $user->subscription_until && $user->subscription_until->greaterThan($now)
            ? $user->subscription_until->copy()
            : ($user->trial_ends_at && $user->trial_ends_at->greaterThan($now) ? $user->trial_ends_at->copy() : $now->copy());

        $newSubUntil = $base->copy()->addMonths($planMonths);
        $bonusDays = $this->referrerBonusDays($planMonths);

        $referrerId = $user->referred_by_user_id;
        if ($referralCode) {
            $referrer = User::query()->where('referral_code', $this->normalizeReferralCode($referralCode))->first();
            if ($referrer) {
                $referrerId = $referrer->id;
                if (! $user->referred_by_user_id) {
                    $user->update(['referred_by_user_id' => $referrer->id]);
                }
            }
        }

        $user->update(['subscription_until' => $newSubUntil]);

        if ($referrerId && $referrerId !== $user->id) {
            $referrer = User::query()->lockForUpdate()->find($referrerId);
            if ($referrer) {
                $refBase = $referrer->subscription_until && $referrer->subscription_until->greaterThan($now)
                    ? $referrer->subscription_until->copy()
                    : ($referrer->trial_ends_at && $referrer->trial_ends_at->greaterThan($now) ? $referrer->trial_ends_at->copy() : $now->copy());
                $referrer->update(['subscription_until' => $refBase->copy()->addDays($bonusDays)]);
                ReferralReward::query()->create([
                    'referrer_user_id' => $referrer->id,
                    'referee_user_id' => $user->id,
                    'plan_months' => $planMonths,
                    'bonus_days' => $bonusDays,
                    'created_at' => now(),
                ]);
            }
        }

        UserTransaction::query()->create([
            'user_id' => $user->id,
            'amount_rub' => round($paidAmount, 2),
            'plan_months' => $planMonths,
            'status' => 'completed',
            'provider' => $provider,
            'external_payment_id' => $externalId,
            'completed_at' => now(),
            'created_at' => now(),
        ]);

        try {
            $r = app(SiteVpnTrialProvisionService::class)->alignVpnWithSubscriptionUntil($user->fresh());
            if (empty($r['ok'])) {
                Log::warning('vpn: panel not aligned with subscription', [
                    'user_id' => $user->id,
                    'reason' => (string) ($r['reason'] ?? 'unknown'),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('vpn: alignVpnWithSubscriptionUntil', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    public function applyBalanceTopup(User $user, float $amount, string $externalId, string $provider): void
    {
        User::query()->whereKey($user->id)->update([
            'balance' => DB::raw('COALESCE(balance, 0) + '.(int) round($amount)),
        ]);
        UserTransaction::query()->create([
            'user_id' => $user->id,
            'amount_rub' => round($amount, 2),
            'plan_months' => 0,
            'status' => 'completed',
            'provider' => $provider,
            'external_payment_id' => $externalId,
            'completed_at' => now(),
            'created_at' => now(),
        ]);
    }

    /**
     * @return array<int, float>
     */
    public function pricingTerms(): array
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

    public function referrerBonusDays(int $months): int
    {
        $row = DB::table('pricing_plan_terms')->where('months', $months)->where('is_active', 1)->first();

        return (int) ($row->referrer_bonus_days ?? 0);
    }

    public function normalizeReferralCode(?string $raw): ?string
    {
        $code = strtoupper(trim((string) $raw));

        return $code === '' ? null : preg_replace('/\s+/', '', $code);
    }
}

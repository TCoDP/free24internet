<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\PricingGlobal;
use App\Models\PricingPlanTerm;
use App\Models\SupportTicket;
use App\Models\UserTransaction;
use App\Support\SitePaymentOptions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $pricing = PricingGlobal::query()->first();
        $transactions = UserTransaction::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return Inertia::render('Account/Overview', [
            'summary' => [
                'email' => $user->email,
                'tg_username' => $user->tg_username,
                'language' => $user->language,
                'balance' => $user->balance,
                'is_their' => (bool) $user->is_their,
                'checkout_on_site' => SitePaymentOptions::canPayOnSite($user),
                'is_admin' => (bool) $user->is_admin,
                'subscription_until' => optional($user->subscription_until)->toDateTimeString(),
                'trial_ends_at' => optional($user->trial_ends_at)->toDateTimeString(),
            ],
            'stats' => [
                'tickets_open' => SupportTicket::query()->where('user_id', $user->id)->whereIn('status', ['open', 'in_progress'])->count(),
                'transactions_total' => UserTransaction::query()->where('user_id', $user->id)->where('status', 'completed')->sum('amount_rub'),
                'pricing_base_monthly_rub' => $pricing?->base_monthly_rub ?? 60,
                'pricing_trial_days' => $pricing?->trial_days ?? 7,
                'active_plans' => PricingPlanTerm::query()->where('is_active', true)->count(),
            ],
            'transactions' => $transactions,
            'hasPassword' => (bool) $user->password_hash,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\PricingGlobal;
use App\Models\PricingPlanTerm;
use App\Support\BalanceTopupAmounts;
use App\Support\SitePaymentOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $pricing = PricingGlobal::query()->first();
        $terms = PricingPlanTerm::query()->where('is_active', true)->orderBy('sort_order')->get();

        return Inertia::render('Account/Profile', [
            'user' => [
                'email' => $request->user()->email,
                'tg_username' => $request->user()->tg_username,
                'language' => $request->user()->language,
            ],
            'pricing' => [
                'base_monthly_rub' => $pricing?->base_monthly_rub ?? 60,
                'trial_days' => $pricing?->trial_days ?? 7,
                'terms' => $terms,
            ],
            'canPayOnSite' => SitePaymentOptions::canPayOnSite($request->user()),
            'paymentProviders' => SitePaymentOptions::forUser($request->user()),
            'balanceTopupAmountsRub' => BalanceTopupAmounts::rub(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($request->user()->id)],
        ]);

        $user = $request->user();
        $user->fill($data);
        $user->save();

        return back()->with('status', 'profile-updated');
    }
}

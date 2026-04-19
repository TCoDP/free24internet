<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\ReferralReward;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReferralsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user->referral_code) {
            $user->referral_code = $this->generateUniqueCode();
            $user->save();
        }

        $invitedCount = DB::table('users')->where('referred_by_user_id', $user->id)->count();
        $bonusDaysTotal = ReferralReward::query()->where('referrer_user_id', $user->id)->sum('bonus_days');

        $botName = ltrim(trim((string) env('TELEGRAM_BOT_USERNAME', '')), '@');
        $referralInviteUrl = '';
        if ($botName !== '' && filled($user->referral_code)) {
            $referralInviteUrl = 'https://t.me/'.$botName.'?start=ref='.rawurlencode((string) $user->referral_code);
        }

        return Inertia::render('Account/Referrals', [
            'referralCode' => $user->referral_code,
            'referralInviteUrl' => $referralInviteUrl,
            'invitedCount' => $invitedCount,
            'bonusDaysTotal' => $bonusDaysTotal,
            'hasReferrer' => (bool) $user->referred_by_user_id,
        ]);
    }

    public function apply(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:32'],
        ]);

        $user = $request->user();
        if ($user->referred_by_user_id) {
            return back()->withErrors(['code' => 'already-linked']);
        }

        $referrer = DB::table('users')->where('referral_code', $data['code'])->first();
        if (! $referrer || (int) $referrer->id === (int) $user->id) {
            return back()->withErrors(['code' => 'invalid-code']);
        }

        $user->referred_by_user_id = (int) $referrer->id;
        $user->save();

        return back()->with('status', 'referral-applied');
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (DB::table('users')->where('referral_code', $code)->exists());

        return $code;
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationPromptController extends Controller
{
    /**
     * Раньше открывали отдельную страницу; теперь ведём в профиль (блок подтверждения почты).
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $path = $user->preferredLocale() === 'en'
            ? '/en/account/profile'
            : '/account/profile';

        return redirect()->to($path.'#email-verify')->with('status', session('status'));
    }
}

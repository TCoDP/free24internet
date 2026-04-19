<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Account/Security', [
            'hasPassword' => (bool) $request->user()->password_hash,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $rules = [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ];

        if ($user->password_hash) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        $data = $request->validate($rules);

        if ($user->password_hash && empty($data['current_password'])) {
            throw ValidationException::withMessages(['current_password' => __('auth.password')]);
        }

        $user->password_hash = Hash::make($data['password']);
        $user->save();

        return back()->with('status', 'password-updated');
    }
}

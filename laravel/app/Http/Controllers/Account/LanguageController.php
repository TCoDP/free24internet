<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LanguageController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Account/Language', [
            'language' => $request->user()->language ?? 'ru',
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'language' => ['required', 'in:ru,en'],
        ]);

        $request->user()->update($data);

        return back()->with('status', 'language-updated');
    }
}

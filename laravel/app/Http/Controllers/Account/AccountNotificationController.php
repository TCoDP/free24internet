<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AccountNotificationController extends Controller
{
    public function markRead(Request $request, string $notification): RedirectResponse
    {
        $n = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $n->markAsRead();

        return back();
    }
}

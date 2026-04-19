<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Services\TelegramAccountLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramLinkController extends Controller
{
    public function store(Request $request, TelegramAccountLinkService $links): JsonResponse
    {
        try {
            return response()->json([
                'url' => $links->createDeepLinkForUser($request->user()),
            ]);
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'already_linked') {
                return response()->json([
                    'errors' => [
                        'telegram' => ['Telegram уже привязан к этому аккаунту.'],
                    ],
                ], 422);
            }
            if ($e->getMessage() === 'telegram_bot_username_missing') {
                return response()->json([
                    'errors' => [
                        'telegram' => ['Привязка временно недоступна: задайте TELEGRAM_BOT_USERNAME на сервере.'],
                    ],
                ], 422);
            }

            throw $e;
        }
    }
}

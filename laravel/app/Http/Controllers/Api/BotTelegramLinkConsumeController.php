<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramAccountLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BotTelegramLinkConsumeController extends Controller
{
    public function store(Request $request, TelegramAccountLinkService $links): JsonResponse
    {
        $expected = trim((string) env('BOT_PAYMENT_SESSION_SECRET'));
        if ($expected === '') {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        if ($request->header('X-Bot-Payment-Secret') !== $expected) {
            return response()->json(['ok' => false, 'reason' => 'forbidden'], 403);
        }

        $data = $request->validate([
            'telegramUserId' => ['required', 'integer', 'min:1'],
            'token' => ['required', 'string', 'max:80'],
            'tgUsername' => ['nullable', 'string', 'max:64'],
        ]);

        $result = $links->consumeTokenForTelegramUser(
            (int) $data['telegramUserId'],
            (string) $data['token'],
            isset($data['tgUsername']) ? (string) $data['tgUsername'] : null,
        );

        if (! $result['ok']) {
            return response()->json([
                'ok' => false,
                'reason' => $result['reason'] ?? 'failed',
            ], 422);
        }

        return response()->json(['ok' => true]);
    }
}

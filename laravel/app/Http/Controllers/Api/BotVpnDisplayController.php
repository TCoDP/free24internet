<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountVpnPresentationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Для Telegram-бота: те же ссылки и поля, что в кабинете «Тарифы» (подписка /sub/… и VLESS).
 */
class BotVpnDisplayController extends Controller
{
    public function __construct(
        private readonly AccountVpnPresentationService $vpnPresentation,
    ) {}

    public function show(Request $request): JsonResponse
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
        ]);

        $user = User::query()->where('tg_id', (int) $data['telegramUserId'])->first();
        if (! $user) {
            return response()->json(['ok' => false, 'reason' => 'user_not_found'], 404);
        }

        $payload = $this->vpnPresentation->payloadForApi($user->fresh());

        return response()->json([
            'ok' => true,
            ...$payload,
        ]);
    }
}

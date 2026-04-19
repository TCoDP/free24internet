<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\BotPaymentUser;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class BotRegistrationController extends Controller
{
    /**
     * Регистрация «как на сайте»: email и пароль для записи users по tg_id.
     * Поддерживает дозаполнение: только пароль (если email уже есть) или только email (если пароль уже задан).
     */
    public function store(Request $request): JsonResponse
    {
        $expected = trim((string) env('BOT_PAYMENT_SESSION_SECRET'));
        if ($expected === '') {
            return response()->json(['ok' => false, 'reason' => 'not_configured'], 503);
        }

        if ($request->header('X-Bot-Payment-Secret') !== $expected) {
            return response()->json(['ok' => false, 'reason' => 'forbidden'], 403);
        }

        $user = BotPaymentUser::resolveByTelegramId((int) $request->input('telegramUserId', 0));

        $hasEmail = filled($user->email);
        $hasPassword = filled($user->password_hash);

        if ($hasEmail && $hasPassword) {
            return response()->json(['ok' => false, 'reason' => 'already_registered'], 409);
        }

        $payload = ['telegramUserId' => $request->input('telegramUserId')];

        $rules = [
            'telegramUserId' => ['required', 'integer', 'min:1'],
        ];

        if (! $hasEmail && ! $hasPassword) {
            $payload['email'] = $request->input('email');
            $payload['password'] = $request->input('password');
            $payload['password_confirmation'] = $request->input('password_confirmation');
            $rules['email'] = ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)];
            $rules['password'] = ['required', 'confirmed', Password::defaults()];
        } elseif ($hasEmail && ! $hasPassword) {
            $payload['password'] = $request->input('password');
            $payload['password_confirmation'] = $request->input('password_confirmation');
            $rules['password'] = ['required', 'confirmed', Password::defaults()];
        } elseif (! $hasEmail && $hasPassword) {
            $payload['email'] = $request->input('email');
            $rules['email'] = ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)];
        } else {
            return response()->json(['ok' => false, 'reason' => 'invalid_state'], 422);
        }

        $messages = [
            'telegramUserId.required' => 'Не передан идентификатор Telegram.',
            'telegramUserId.integer' => 'Некорректный идентификатор Telegram.',
            'telegramUserId.min' => 'Некорректный идентификатор Telegram.',
            'email.required' => 'Укажите email.',
            'email.email' => 'Некорректный формат email.',
            'email.unique' => 'Этот email уже занят — введите другой.',
            'email.max' => 'Слишком длинный email.',
            'password.required' => 'Укажите пароль.',
            'password.confirmed' => 'Пароль и подтверждение не совпадают.',
            'password.min' => 'Пароль не короче :min символов.',
        ];

        $validator = Validator::make($payload, $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'ok' => false,
                'reason' => 'validation',
                'errors' => $validator->errors()->toArray(),
            ], 422);
        }

        $data = $validator->validated();

        if (isset($data['email'])) {
            $user->email = strtolower(trim((string) $data['email']));
        }
        if (isset($data['password'])) {
            $user->password_hash = Hash::make($data['password']);
        }
        $user->save();

        $user->refresh();
        $nowComplete = filled($user->email) && filled($user->password_hash);

        if ($nowComplete) {
            event(new Registered($user));
        }

        return response()->json(['ok' => true]);
    }
}

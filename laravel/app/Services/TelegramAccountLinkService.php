<?php

namespace App\Services;

use App\Models\MonetaCheckoutSession;
use App\Models\PlategaCheckoutSession;
use App\Models\ReferralReward;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\TelegramLinkToken;
use App\Models\User;
use App\Models\UserTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

final class TelegramAccountLinkService
{
    public const TOKEN_PREFIX = 'link_';

    public const TOKEN_TTL_MINUTES = 20;

    public function createDeepLinkForUser(User $user): string
    {
        $bot = trim((string) config('services.telegram.bot_username'));
        if ($bot === '') {
            throw new \RuntimeException('telegram_bot_username_missing');
        }

        if ($user->tg_id) {
            throw new \RuntimeException('already_linked');
        }

        TelegramLinkToken::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->delete();

        $raw = self::TOKEN_PREFIX.bin2hex(random_bytes(16));
        $expires = Carbon::now()->addMinutes(self::TOKEN_TTL_MINUTES);

        TelegramLinkToken::query()->create([
            'token' => $raw,
            'user_id' => $user->id,
            'locale' => $user->language ?? 'ru',
            'expires_at' => $expires,
        ]);

        return 'https://t.me/'.$bot.'?start='.$raw;
    }

    /**
     * @return array{ok: bool, reason?: string}
     */
    public function consumeTokenForTelegramUser(int $telegramUserId, string $token, ?string $tgUsername = null): array
    {
        $token = trim($token);
        if ($token === '' || ! str_starts_with($token, self::TOKEN_PREFIX)) {
            return ['ok' => false, 'reason' => 'invalid_token'];
        }

        return DB::transaction(function () use ($telegramUserId, $token, $tgUsername): array {
            /** @var TelegramLinkToken|null $row */
            $row = TelegramLinkToken::query()
                ->where('token', $token)
                ->lockForUpdate()
                ->first();

            if (! $row || $row->used_at) {
                return ['ok' => false, 'reason' => 'token_used_or_missing'];
            }

            if (Carbon::now()->greaterThan($row->expires_at)) {
                return ['ok' => false, 'reason' => 'token_expired'];
            }

            /** @var User $siteUser */
            $siteUser = User::query()->whereKey($row->user_id)->lockForUpdate()->firstOrFail();

            if ($siteUser->tg_id && (int) $siteUser->tg_id === $telegramUserId) {
                $row->used_at = Carbon::now();
                $row->save();

                return ['ok' => true];
            }

            if ($siteUser->tg_id && (int) $siteUser->tg_id !== $telegramUserId) {
                return ['ok' => false, 'reason' => 'account_has_other_telegram'];
            }

            $stub = User::query()->where('tg_id', $telegramUserId)->lockForUpdate()->first();

            if ($stub && (int) $stub->id !== (int) $siteUser->id) {
                if (filled($stub->email) || filled($stub->password_hash)) {
                    return ['ok' => false, 'reason' => 'telegram_bound_to_other_account'];
                }

                $this->mergeStubUserIntoSiteUser($stub, $siteUser);
            }

            $siteUser->tg_id = $telegramUserId;
            if ($tgUsername !== null && $tgUsername !== '') {
                $siteUser->tg_username = Str::limit($tgUsername, 64, '');
            }
            $siteUser->save();

            $row->used_at = Carbon::now();
            $row->save();

            return ['ok' => true];
        });
    }

    private function mergeStubUserIntoSiteUser(User $stub, User $site): void
    {
        $site->balance = (int) $site->balance + (int) $stub->balance;

        $site->subscription_until = $this->maxDate($site->subscription_until, $stub->subscription_until);
        $site->trial_ends_at = $this->maxDate($site->trial_ends_at, $stub->trial_ends_at);

        if (! filled($site->tg_username) && filled($stub->tg_username)) {
            $site->tg_username = $stub->tg_username;
        }

        if (! filled($site->referral_code) && filled($stub->referral_code)) {
            $code = $stub->referral_code;
            $stub->referral_code = null;
            $stub->save();
            $site->referral_code = $code;
        }

        UserTransaction::query()->where('user_id', $stub->id)->update(['user_id' => $site->id]);
        SupportTicket::query()->where('user_id', $stub->id)->update(['user_id' => $site->id]);
        SupportTicketMessage::query()->where('author_user_id', $stub->id)->update(['author_user_id' => $site->id]);
        MonetaCheckoutSession::query()->where('user_id', $stub->id)->update(['user_id' => $site->id]);
        PlategaCheckoutSession::query()->where('user_id', $stub->id)->update(['user_id' => $site->id]);

        ReferralReward::query()->where('referrer_user_id', $stub->id)->update(['referrer_user_id' => $site->id]);
        ReferralReward::query()->where('referee_user_id', $stub->id)->update(['referee_user_id' => $site->id]);

        User::query()->where('referred_by_user_id', $stub->id)->update(['referred_by_user_id' => $site->id]);

        if (Schema::hasTable('sessions')) {
            DB::table('sessions')->where('user_id', $stub->id)->update(['user_id' => null]);
        }

        if (Schema::hasTable('telegram_notification_logs')) {
            DB::table('telegram_notification_logs')->where('user_id', $stub->id)->update(['user_id' => $site->id]);
        }

        $stub->delete();
    }

    private function maxDate(mixed $a, mixed $b): ?Carbon
    {
        $aa = $a instanceof Carbon ? $a : ($a ? Carbon::parse($a) : null);
        $bb = $b instanceof Carbon ? $b : ($b ? Carbon::parse($b) : null);
        if ($aa === null) {
            return $bb;
        }
        if ($bb === null) {
            return $aa;
        }

        return $aa->greaterThan($bb) ? $aa : $bb;
    }
}

<?php

namespace App\Services;

use App\Models\SubscriptionExpiryReminder;
use App\Models\User;
use App\Notifications\SubscriptionExpiringMailNotification;
use App\Notifications\SubscriptionExpiringNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\LazyCollection;

final class SubscriptionExpiryReminderService
{
    public function __construct(
        private readonly TelegramBotNotificationService $telegram,
    ) {}

    /**
     * @return array{sent: int, skipped: int, errors: int}
     */
    public function run(bool $dryRun = false): array
    {
        $sent = 0;
        $skipped = 0;
        $errors = 0;

        if (! config('subscription_reminders.enabled', true)) {
            return ['sent' => 0, 'skipped' => 0, 'errors' => 0];
        }

        $daysList = config('subscription_reminders.days_before', [7, 3, 1]);
        if ($daysList === []) {
            $daysList = [7, 3, 1];
        }

        foreach ($daysList as $daysFromToday) {
            $stage = 'before_'.$daysFromToday.'d';
            [$start, $end] = $this->calendarDayRangeUtc((int) $daysFromToday);

            foreach ($this->subscriptionUsersInWindow($start, $end) as $user) {
                $r = $this->processUser(
                    $user,
                    SubscriptionExpiryReminder::ACCESS_SUBSCRIPTION,
                    $stage,
                    (int) $daysFromToday,
                    $user->subscription_until,
                    $dryRun,
                );
                if ($r === 'sent') {
                    $sent++;
                } elseif ($r === 'skipped') {
                    $skipped++;
                } else {
                    $errors++;
                }
            }

            foreach ($this->trialUsersInWindow($start, $end) as $user) {
                $r = $this->processUser(
                    $user,
                    SubscriptionExpiryReminder::ACCESS_TRIAL,
                    $stage,
                    (int) $daysFromToday,
                    $user->trial_ends_at,
                    $dryRun,
                );
                if ($r === 'sent') {
                    $sent++;
                } elseif ($r === 'skipped') {
                    $skipped++;
                } else {
                    $errors++;
                }
            }
        }

        return ['sent' => $sent, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function calendarDayRangeUtc(int $daysFromToday): array
    {
        $tz = (string) config('app.timezone', 'UTC');
        $start = now()->timezone($tz)->addDays($daysFromToday)->startOfDay()->utc();
        $end = now()->timezone($tz)->addDays($daysFromToday)->endOfDay()->utc();

        return [$start, $end];
    }

    /**
     * @return LazyCollection<int, User>
     */
    private function subscriptionUsersInWindow(Carbon $start, Carbon $end)
    {
        return User::query()
            ->whereNotNull('subscription_until')
            ->where('subscription_until', '>', now())
            ->whereBetween('subscription_until', [$start, $end])
            ->cursor();
    }

    /**
     * @return LazyCollection<int, User>
     */
    private function trialUsersInWindow(Carbon $start, Carbon $end)
    {
        return User::query()
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '>', now())
            ->whereBetween('trial_ends_at', [$start, $end])
            ->where(function ($q) {
                $q->whereNull('subscription_until')
                    ->orWhereColumn('subscription_until', '<=', 'trial_ends_at');
            })
            ->cursor();
    }

    private function processUser(
        User $user,
        string $accessType,
        string $stage,
        int $daysBeforeEnd,
        ?Carbon $endsAt,
        bool $dryRun,
    ): string {
        if ($endsAt === null) {
            return 'skipped';
        }

        $exists = SubscriptionExpiryReminder::query()
            ->where('user_id', $user->id)
            ->where('access_type', $accessType)
            ->where('stage', $stage)
            ->where('ends_at', $endsAt)
            ->exists();

        if ($exists) {
            return 'skipped';
        }

        $tz = (string) config('app.timezone', 'UTC');
        $locale = in_array($user->language ?? '', ['en', 'ru'], true) ? $user->language : 'ru';
        $format = $locale === 'en' ? 'M j, Y H:i' : 'd.m.Y H:i';
        $endsHuman = $endsAt->copy()->timezone($tz)->format($format);
        $actionUrl = $this->accountPlansUrl($user);

        $siteOk = false;
        $tgOk = false;

        if (! $dryRun) {
            try {
                Notification::send($user, new SubscriptionExpiringNotification(
                    $accessType,
                    $daysBeforeEnd,
                    $endsAt->toIso8601String(),
                    $endsHuman,
                    $actionUrl,
                ));
                $siteOk = true;
            } catch (\Throwable $e) {
                Log::error('subscription expiry site notification failed', [
                    'user_id' => $user->id,
                    'exception' => $e->getMessage(),
                ]);
            }

            if ($user->tg_id) {
                $html = $this->buildTelegramHtml($locale, $accessType, $endsHuman, $actionUrl);
                $res = $this->telegram->sendToTelegramId((int) $user->tg_id, $html, 'subscription_expiry', 'HTML');
                $tgOk = (bool) ($res['ok'] ?? false);
                if (! $tgOk) {
                    Log::warning('subscription expiry telegram failed', [
                        'user_id' => $user->id,
                        'tg_id' => $user->tg_id,
                        'error' => $res['error'] ?? null,
                    ]);
                }
            }

            if (! $siteOk && ! $tgOk) {
                return 'error';
            }

            SubscriptionExpiryReminder::query()->create([
                'user_id' => $user->id,
                'access_type' => $accessType,
                'stage' => $stage,
                'ends_at' => $endsAt,
            ]);

            if (filled((string) ($user->email ?? ''))) {
                try {
                    Notification::send($user, new SubscriptionExpiringMailNotification(
                        $accessType,
                        $daysBeforeEnd,
                        $endsAt->toIso8601String(),
                        $endsHuman,
                        $actionUrl,
                    ));
                } catch (\Throwable $e) {
                    Log::warning('subscription expiry email failed', [
                        'user_id' => $user->id,
                        'exception' => $e->getMessage(),
                    ]);
                }
            }
        }

        return 'sent';
    }

    private function accountPlansUrl(User $user): string
    {
        $locale = in_array($user->language ?? '', ['en', 'ru'], true) ? $user->language : 'ru';
        if ($locale === 'en') {
            return url('/en/account/plans');
        }

        return url('/account/plans');
    }

    private function buildTelegramHtml(string $locale, string $accessType, string $endsHuman, string $actionUrl): string
    {
        $isTrial = $accessType === SubscriptionExpiryReminder::ACCESS_TRIAL;
        $url = htmlspecialchars($actionUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        if ($locale === 'en') {
            $head = $isTrial ? '<b>Trial ending soon</b>' : '<b>Subscription ending soon</b>';
            $line = $isTrial
                ? 'Your trial access is valid until: <b>'.$this->esc($endsHuman).'</b>.'
                : 'Your paid plan is valid until: <b>'.$this->esc($endsHuman).'</b>.';

            return $head."\n".$line."\n\n".'Renew: <a href="'.$url.'">website → Plans</a>';
        }

        $head = $isTrial ? '<b>Скоро конец пробного периода</b>' : '<b>Скоро конец оплаченной подписки</b>';
        $line = $isTrial
            ? 'Пробный доступ до: <b>'.$this->esc($endsHuman).'</b>.'
            : 'Оплаченный доступ до: <b>'.$this->esc($endsHuman).'</b>.';

        return $head."\n".$line."\n\n".'Продлить: <a href="'.$url.'">сайт → Тарифы</a>';
    }

    private function esc(string $s): string
    {
        return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

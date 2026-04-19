<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\PaymentSucceededNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

/**
 * Уведомления об успешной оплате (сайт / бот): e-mail + Telegram, без влияния на вебхук.
 */
final class PaymentSuccessNotificationService
{
    public function __construct(
        private readonly TelegramBotNotificationService $telegram,
    ) {}

    /**
     * @param  'platega'|'moneta'  $provider
     * @param  'plan'|'balance'  $purpose
     * @param  bool  $dryRun  тестовая рассылка: подписка в тексте не берётся из БД, тема/текст помечаются
     */
    public function notify(
        User $user,
        string $provider,
        float $amountRub,
        string $purpose,
        int $planMonths,
        string $externalPaymentId,
        bool $dryRun = false,
    ): void {
        $locale = $user->preferredLocale();
        $providerName = $this->providerLabel($locale, $provider);
        $amount = number_format($amountRub, 2, '.', ' ');
        $testPrefix = $dryRun
            ? ($locale === 'en' ? '[TEST] ' : '[Тест] ')
            : '';
        $refSuffix = $dryRun ? ' (test)' : '';
        $externalRef = $externalPaymentId.$refSuffix;

        if ($purpose === 'balance') {
            $this->sendEmail(
                $user,
                $locale,
                $testPrefix.$this->subjectBalance($locale),
                $this->textBalance($locale, $amount, $providerName, $externalRef),
                $this->htmlBalance($locale, $amount, $providerName, $externalRef),
            );
            $this->sendTelegram(
                $user,
                'payment_balance',
                $this->telegramHtmlBalance($locale, $amount, $providerName, $dryRun),
            );
            $this->sendInApp(
                $user,
                $provider,
                $amountRub,
                'balance',
                0,
                $externalRef,
                $dryRun
            );

            return;
        }

        if (! $dryRun) {
            $user->refresh();
        }
        $subLine = $dryRun
            ? ($locale === 'en'
                ? 'Test only: the database was not updated.'
                : 'Тест: кабинет в БД не менялся, проверяем доставку уведомлений.')
            : $this->subscriptionLine($user, $locale, $planMonths);
        $this->sendEmail(
            $user,
            $locale,
            $testPrefix.$this->subjectPlan($locale, $planMonths),
            $this->textPlan(
                $locale,
                $planMonths,
                $amount,
                $providerName,
                $subLine,
                $externalRef
            ),
            $this->htmlPlan(
                $locale,
                $planMonths,
                $amount,
                $providerName,
                $subLine,
                $externalRef
            ),
        );
        $this->sendTelegram(
            $user,
            'payment_plan',
            $this->telegramHtmlPlan(
                $locale,
                $planMonths,
                $amount,
                $providerName,
                $subLine,
                $dryRun
            ),
        );
        $this->sendInApp(
            $user,
            $provider,
            $amountRub,
            'plan',
            $planMonths,
            $externalRef,
            $dryRun
        );
    }

    private function sendInApp(
        User $user,
        string $provider,
        float $amountRub,
        string $purpose,
        int $planMonths,
        string $externalRef,
        bool $dryRun,
    ): void {
        try {
            Notification::send(
                $user,
                new PaymentSucceededNotification(
                    $provider,
                    $amountRub,
                    $purpose,
                    $planMonths,
                    $externalRef,
                    $dryRun,
                )
            );
        } catch (\Throwable $e) {
            Log::warning('payment: in-app (database) notification failed', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    private function sendEmail(
        User $user,
        string $locale,
        string $subject,
        string $plain,
        string $html,
    ): void {
        $to = trim((string) $user->email);
        if ($to === '' || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        try {
            Mail::html($html, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('payment success e-mail failed', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    private function sendTelegram(User $user, string $kind, string $html): void
    {
        if (! $user->tg_id) {
            return;
        }

        $r = $this->telegram->sendToTelegramId((int) $user->tg_id, $html, $kind, 'HTML');
        if (! ($r['ok'] ?? false)) {
            Log::warning('payment success telegram failed', [
                'user_id' => $user->id,
                'tg_id' => $user->tg_id,
                'error' => $r['error'] ?? null,
            ]);
        }
    }

    private function providerLabel(string $locale, string $provider): string
    {
        return match (true) {
            $locale === 'en' && $provider === 'platega' => 'Platega',
            $locale === 'en' && $provider === 'moneta' => 'Moneta',
            $provider === 'platega' => 'Platega',
            $provider === 'moneta' => 'Moneta',
            default => $provider,
        };
    }

    private function subscriptionLine(User $user, string $locale, int $planMonths): string
    {
        $ends = $user->subscription_until;
        if (! $ends) {
            return $locale === 'en' ? 'Subscription is active.' : 'Подписка активна.';
        }

        $tz = (string) config('app.timezone', 'UTC');
        $format = $locale === 'en' ? 'M j, Y H:i' : 'd.m.Y H:i';
        $human = $ends->copy()->timezone($tz)->format($format);

        return $locale === 'en'
            ? "Paid access until: {$human}."
            : "Оплаченный доступ до: {$human}.";
    }

    private function accountPlansUrl(string $locale): string
    {
        return $locale === 'en' ? url('/en/account/plans') : url('/account/plans');
    }

    private function accountProfileUrl(string $locale): string
    {
        return $locale === 'en' ? url('/en/account/profile') : url('/account/profile');
    }

    private function subjectPlan(string $locale, int $planMonths): string
    {
        return $locale === 'en'
            ? "Payment received — subscription {$planMonths} mo."
            : "Оплата прошла — подписка на {$planMonths} мес.";
    }

    private function subjectBalance(string $locale): string
    {
        return $locale === 'en' ? 'Payment received — balance top-up' : 'Оплата прошла — пополнение баланса';
    }

    private function textPlan(
        string $locale,
        int $planMonths,
        string $amount,
        string $providerName,
        string $subLine,
        string $extId,
    ): string {
        if ($locale === 'en') {
            return "Thank you! Your payment for a {$planMonths}-month plan was received ({$amount} RUB) via {$providerName}.\n"
                .$subLine
                ."\nTransaction: {$extId}\n"
                .'Manage plans: '.url('/en/account/plans');
        }

        return "Спасибо! Оплата тарифа на {$planMonths} мес. получена: {$amount} ₽, способ {$providerName}.\n"
            .$subLine
            ."\nНомер операции: {$extId}\n"
            .'Кабинет — Тарифы: '.url('/account/plans');
    }

    private function htmlPlan(
        string $locale,
        int $planMonths,
        string $amount,
        string $providerName,
        string $subLine,
        string $extId,
    ): string {
        $e = static fn (string $s) => e($s);
        $p = e($providerName);
        if ($locale === 'en') {
            return '<p>Thank you! We received <strong>'.e($amount).' RUB</strong> for a '
                .e((string) $planMonths).'-month plan (via '.$p.').</p>'
                .'<p>'.e($subLine).'</p>'
                .'<p>Reference: <code>'.e($extId).'</code></p>'
                .'<p><a href="'.$e($this->accountPlansUrl('en')).'">Account → Plans</a></p>';
        }

        return '<p>Спасибо! Мы получили <strong>'.e($amount).'&nbsp;₽</strong> за тариф на '
            .e((string) $planMonths).'&nbsp;мес. (способ '.$p.').</p>'
            .'<p>'.e($subLine).'</p>'
            .'<p>Номер: <code>'.e($extId).'</code></p>'
            .'<p><a href="'.$e($this->accountPlansUrl('ru')).'">Личный кабинет — Тарифы</a></p>';
    }

    private function textBalance(string $locale, string $amount, string $providerName, string $extId): string
    {
        if ($locale === 'en') {
            return "Your balance was topped up by {$amount} RUB ({$providerName}).\n"
                ."Reference: {$extId}\n"
                .'Profile: '.url('/en/account/profile');
        }

        return "Баланс пополнен на {$amount} ₽ ({$providerName}).\n"
            ."Номер: {$extId}\n"
            .'Профиль: '.url('/account/profile');
    }

    private function htmlBalance(string $locale, string $amount, string $providerName, string $extId): string
    {
        if ($locale === 'en') {
            return '<p>Your balance was topped up by <strong>'.e($amount).' RUB</strong> ('
                .e($providerName).').</p>'
                .'<p>Reference: <code>'.e($extId).'</code></p>'
                .'<p><a href="'.e($this->accountProfileUrl('en')).'">Account → Profile</a></p>';
        }

        return '<p>Баланс пополнен на <strong>'.e($amount).'&nbsp;₽</strong> ('
            .e($providerName).').</p>'
            .'<p>Номер: <code>'.e($extId).'</code></p>'
            .'<p><a href="'.e($this->accountProfileUrl('ru')).'">Личный кабинет</a></p>';
    }

    private function telegramHtmlPlan(
        string $locale,
        int $planMonths,
        string $amount,
        string $providerName,
        string $subLine,
        bool $dryRun = false,
    ): string {
        $testBanner = $dryRun
            ? ($locale === 'en'
                ? "<b>[TEST]</b> Simulated success.\n\n"
                : "<b>[Тест]</b> Имитация «оплата прошла».\n\n")
            : '';
        $plans = htmlspecialchars($this->accountPlansUrl($locale), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        if ($locale === 'en') {
            return $testBanner
                ."<b>Payment received</b>\n"
                ."Plan: {$planMonths} mo., ".htmlspecialchars($amount, ENT_QUOTES, 'UTF-8')
                .' RUB via '.htmlspecialchars($providerName, ENT_QUOTES, 'UTF-8').".\n"
                .htmlspecialchars($subLine, ENT_QUOTES, 'UTF-8')
                ."\n\n".'<a href="'.$plans.'">Website → Plans</a>';
        }

        return $testBanner
            ."<b>Оплата прошла</b>\n"
            .'Тариф: '.(string) $planMonths.' мес., '
            .htmlspecialchars($amount, ENT_QUOTES, 'UTF-8')
            .' ₽, '.htmlspecialchars($providerName, ENT_QUOTES, 'UTF-8').".\n"
            .htmlspecialchars($subLine, ENT_QUOTES, 'UTF-8')
            ."\n\n".'<a href="'.$plans.'">Сайт → Тарифы</a>';
    }

    private function telegramHtmlBalance(string $locale, string $amount, string $providerName, bool $dryRun = false): string
    {
        $testBanner = $dryRun
            ? ($locale === 'en'
                ? "<b>[TEST]</b> Simulated success.\n\n"
                : "<b>[Тест]</b> Имитация «оплата прошла».\n\n")
            : '';
        $url = htmlspecialchars($this->accountProfileUrl($locale), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        if ($locale === 'en') {
            return $testBanner
                ."<b>Balance top-up</b>\n"
                .htmlspecialchars($amount, ENT_QUOTES, 'UTF-8')
                .' RUB via '.htmlspecialchars($providerName, ENT_QUOTES, 'UTF-8')
                .".\n\n".'<a href="'.$url.'">Account → Profile</a>';
        }

        return $testBanner
            ."<b>Баланс пополнен</b>\n"
            .htmlspecialchars($amount, ENT_QUOTES, 'UTF-8')
            .' ₽, '.htmlspecialchars($providerName, ENT_QUOTES, 'UTF-8')
            .".\n\n".'<a href="'.$url.'">Личный кабинет</a>';
    }
}

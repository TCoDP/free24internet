<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentSucceededNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $provider,
        public float $amountRub,
        public string $purpose,
        public int $planMonths,
        public string $externalPaymentId,
        public bool $dryRun = false,
    ) {
        if (! in_array($this->provider, ['platega', 'moneta'], true)) {
            $this->provider = 'platega';
        }
        if (! in_array($this->purpose, ['plan', 'balance'], true)) {
            $this->purpose = 'plan';
        }
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $locale = in_array($notifiable->language ?? '', ['en', 'ru'], true)
            ? $notifiable->language
            : 'ru';

        $pName = $locale === 'en' ? (strtolower($this->provider) === 'moneta' ? 'Moneta' : 'Platega') : (strtolower($this->provider) === 'moneta' ? 'Moneta' : 'Platega');
        $amount = number_format($this->amountRub, 2, '.', ' ');

        if ($this->purpose === 'balance') {
            if ($locale === 'en') {
                $title = 'Balance top-up';
                $message = "We received {$amount} RUB via {$pName}. Ref: {$this->externalPaymentId}.";
            } else {
                $title = 'Баланс пополнен';
                $message = "Зачислено {$amount} ₽ ({$pName}). Номер: {$this->externalPaymentId}.";
            }

            return $this->wrap(
                $locale,
                $title,
                $message,
                $locale === 'en' ? url('/en/account/profile') : url('/account/profile'),
                $locale === 'en' ? 'Open profile' : 'Профиль',
            );
        }

        if ($this->dryRun) {
            if ($locale === 'en') {
                $title = 'Payment (test simulation)';
                $message = "TEST: a {$this->planMonths} mo. plan, {$amount} RUB, {$pName} — the database was not changed.";
            } else {
                $title = 'Оплата (тест, имитация)';
                $message = "ТЕСТ: тариф {$this->planMonths} мес., {$amount} ₽, {$pName} — в БД записи нет, проверяем доставку.";
            }

            return $this->wrap(
                $locale,
                $title,
                $message,
                $locale === 'en' ? url('/en/account/plans') : url('/account/plans'),
                $locale === 'en' ? 'View plans' : 'Тарифы',
            );
        }

        $notifiable->refresh();
        $sub = $this->formatSubscriptionLine($notifiable, $locale);

        if ($locale === 'en') {
            $title = 'Payment received';
            $message = "We received payment for a {$this->planMonths}-month plan: {$amount} RUB ({$pName}). {$sub}";
        } else {
            $title = 'Оплата прошла';
            $message = "Оплата тарифа на {$this->planMonths} мес.: {$amount} ₽, {$pName}. {$sub}";
        }

        return $this->wrap(
            $locale,
            $title,
            $message,
            $locale === 'en' ? url('/en/account/plans') : url('/account/plans'),
            $locale === 'en' ? 'View plans' : 'Тарифы',
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function wrap(
        string $locale,
        string $title,
        string $message,
        string $actionUrl,
        string $actionLabel,
    ): array {
        if ($this->dryRun) {
            if ($locale === 'en' && $this->purpose === 'balance') {
                $title = "[TEST] {$title}";
            } elseif ($this->purpose === 'balance') {
                $title = "[Тест] {$title}";
            }
        }

        return [
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'action_label' => $actionLabel,
            'kind' => 'payment',
            'purpose' => $this->purpose,
            'provider' => $this->provider,
            'plan_months' => $this->planMonths,
            'amount_rub' => $this->amountRub,
            'external_id' => $this->externalPaymentId,
            'dry_run' => $this->dryRun,
        ];
    }

    private function formatSubscriptionLine(object $notifiable, string $locale): string
    {
        $ends = $notifiable->subscription_until;
        if (! $ends) {
            return $locale === 'en' ? 'Your subscription is active.' : 'Подписка активна.';
        }

        $tz = (string) config('app.timezone', 'UTC');
        $format = $locale === 'en' ? 'M j, Y H:i' : 'd.m.Y H:i';
        $human = $ends->copy()->timezone($tz)->format($format);

        return $locale === 'en' ? "Paid access until: {$human}." : "Оплаченный доступ до: {$human}.";
    }
}

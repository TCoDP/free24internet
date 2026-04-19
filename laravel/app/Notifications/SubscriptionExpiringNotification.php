<?php

namespace App\Notifications;

use App\Models\SubscriptionExpiryReminder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SubscriptionExpiringNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $accessType,
        public int $daysBeforeEnd,
        public string $endsAtIso,
        public string $endsAtHuman,
        public string $actionUrl,
    ) {}

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

        $isTrial = $this->accessType === SubscriptionExpiryReminder::ACCESS_TRIAL;

        if ($locale === 'en') {
            $title = $isTrial ? 'Trial ending soon' : 'Subscription ending soon';
            $kind = $isTrial ? 'Trial access' : 'Paid subscription';
            $message = "{$kind} is valid until {$this->endsAtHuman}. Renew on the website so your VPN keeps working.";
        } else {
            $title = $isTrial ? 'Скоро конец пробного периода' : 'Скоро конец оплаченной подписки';
            $kind = $isTrial ? 'Пробный доступ' : 'Оплаченная подписка';
            $message = "{$kind} действует до {$this->endsAtHuman}. Продлите на сайте, чтобы не потерять VPN.";
        }

        return [
            'title' => $title,
            'message' => $message,
            'action_url' => $this->actionUrl,
            'access_type' => $this->accessType,
            'days_before' => $this->daysBeforeEnd,
            'ends_at' => $this->endsAtIso,
        ];
    }
}

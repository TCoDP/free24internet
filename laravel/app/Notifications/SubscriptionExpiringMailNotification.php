<?php

namespace App\Notifications;

use App\Models\SubscriptionExpiryReminder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Письмо об окончании подписки/пробного периода.
 * Отправляется отдельно от {@see SubscriptionExpiringNotification}, чтобы сбой SMTP
 * не мешал записи в БД о факте напоминания и отправке в Telegram.
 */
class SubscriptionExpiringMailNotification extends Notification
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
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = in_array($notifiable->language ?? '', ['en', 'ru'], true)
            ? $notifiable->language
            : 'ru';

        $isTrial = $this->accessType === SubscriptionExpiryReminder::ACCESS_TRIAL;

        if ($locale === 'en') {
            $subject = $isTrial ? 'Your trial is ending soon' : 'Your subscription is ending soon';
            $kind = $isTrial ? 'Trial access' : 'Paid subscription';
            $intro = "{$kind} is valid until {$this->endsAtHuman}. Renew on the website so your VPN keeps working.";

            return (new MailMessage)
                ->subject($subject)
                ->line($intro)
                ->action('Open Plans', $this->actionUrl);
        }

        $subject = $isTrial ? 'Скоро окончание пробного периода' : 'Скоро окончание оплаченной подписки';
        $kind = $isTrial ? 'Пробный доступ' : 'Оплаченная подписка';
        $intro = "{$kind} действует до {$this->endsAtHuman}. Продлите на сайте, чтобы не потерять VPN.";

        return (new MailMessage)
            ->subject($subject)
            ->line($intro)
            ->action('Тарифы на сайте', $this->actionUrl);
    }
}

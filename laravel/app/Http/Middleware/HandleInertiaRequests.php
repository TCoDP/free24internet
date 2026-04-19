<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Notifications\PaymentSucceededNotification;
use App\Notifications\SubscriptionExpiringNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        $appUrl = rtrim((string) config('app.url'), '/');
        $ogPath = (string) config('seo.default_og_image_path', '/assets/img/about.jpg');

        return [
            ...parent::share($request),
            'site' => [
                'base_url' => $appUrl,
                'name' => (string) config('seo.site_name', config('app.name')),
                'default_og_image' => $appUrl.($ogPath[0] === '/' ? $ogPath : '/'.$ogPath),
            ],
            'flash' => [
                'status' => $request->session()->get('status'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'email_verification_sent_at' => $user->email_verification_sent_at?->toIso8601String(),
                    'tg_id' => $user->tg_id,
                    'tg_username' => $user->tg_username,
                    'language' => $user->language,
                    'is_their' => (bool) $user->is_their,
                    'is_admin' => (bool) $user->is_admin,
                    'balance' => $user->balance,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'sub_until' => $user->subscription_until?->toIso8601String(),
                    'trial_until' => $user->trial_ends_at?->toIso8601String(),
                ] : null,
                'subscriptionNotifications' => $user
                    ? $user->unreadNotifications()
                        ->whereIn('type', [
                            SubscriptionExpiringNotification::class,
                            PaymentSucceededNotification::class,
                        ])
                        ->orderByDesc('created_at')
                        ->limit(5)
                        ->get()
                        ->map(static fn ($n) => [
                            'id' => $n->id,
                            'title' => $n->data['title'] ?? '',
                            'message' => $n->data['message'] ?? '',
                            'url' => $n->data['action_url'] ?? url('/account/plans'),
                            'action_label' => $n->data['action_label'] ?? null,
                            'created_at' => $n->created_at?->toIso8601String(),
                        ])
                        ->values()
                        ->all()
                    : [],
            ],
        ];
    }
}

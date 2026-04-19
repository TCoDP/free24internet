<?php

namespace App\Services;

use App\Models\User;
use App\Support\VlessLinkBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Данные VPN/подписки как в кабинете (Plans) — для сайта и для API бота.
 */
final class AccountVpnPresentationService
{
    public function __construct(
        private readonly VpnSubscriptionImportService $vpnSubscriptionImport,
    ) {}

    /**
     * @return array{
     *   hasTelegram: bool,
     *   vpn: array{hasKey: bool, isActive: bool, vlessLink: ?string, expiresAt: ?string},
     *   subscriptionUntil: ?string,
     *   trialEndsAt: ?string
     * }
     */
    public function vpnAccessSummary(User $user): array
    {
        $now = now();
        $uuid = null;
        $port = null;
        $shortId = null;
        $expireMs = null;

        if (Schema::hasColumn('users', 'uuid')) {
            $cols = array_values(array_filter([
                Schema::hasColumn('users', 'uuid') ? 'uuid' : null,
                Schema::hasColumn('users', 'port') ? 'port' : null,
                Schema::hasColumn('users', 'short_id') ? 'short_id' : null,
                Schema::hasColumn('users', 'expire_time') ? 'expire_time' : null,
            ]));
            $row = $cols === [] ? null : DB::table('users')->where('id', $user->id)->first($cols);
            if ($row) {
                $uuid = isset($row->uuid) ? trim((string) $row->uuid) : '';
                $uuid = $uuid !== '' ? $uuid : null;
                $port = isset($row->port) ? (int) $row->port : null;
                $shortId = isset($row->short_id) ? trim((string) $row->short_id) : null;
                $shortId = $shortId !== '' ? $shortId : null;
                $expireMs = isset($row->expire_time) ? (int) $row->expire_time : null;
            }
        }

        $hasKey = $uuid !== null && $port !== null && $shortId !== null;
        $nowMs = (int) round(microtime(true) * 1000);
        $isActive = $hasKey && $expireMs !== null && $expireMs > $nowMs;

        $vlessLink = null;
        if ($hasKey) {
            $vlessLink = VlessLinkBuilder::forUser((int) $user->id, $uuid, $port, $shortId);
        }

        $expiresAt = null;
        if ($expireMs !== null && $expireMs > 0) {
            $expiresAt = Carbon::createFromTimestampMs($expireMs)->toIso8601String();
        }

        return [
            'hasTelegram' => (bool) $user->tg_id,
            'vpn' => [
                'hasKey' => $hasKey,
                'isActive' => $isActive,
                'vlessLink' => $vlessLink,
                'expiresAt' => $expiresAt,
            ],
            'subscriptionUntil' => $user->subscription_until && $user->subscription_until->greaterThan($now)
                ? $user->subscription_until->toIso8601String()
                : null,
            'trialEndsAt' => $user->trial_ends_at && $user->trial_ends_at->greaterThan($now)
                ? $user->trial_ends_at->toIso8601String()
                : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $vpnAccess
     */
    public function subscriptionImportUrlFor(User $user, array $vpnAccess, ?string $tokenOverride = null): ?string
    {
        if (! Schema::hasColumn('users', 'subscription_import_token')) {
            return null;
        }
        if (! ($vpnAccess['vpn']['isActive'] ?? false) || empty($vpnAccess['vpn']['vlessLink'] ?? null)) {
            return null;
        }
        $token = $tokenOverride ?? $this->vpnSubscriptionImport->ensureImportToken((int) $user->id);

        return url('/sub/'.$token);
    }

    /**
     * @param  array<string, mixed>  $vpnAccess
     * @return array{vpnAccess: array, subscriptionImportUrl: ?string, primaryShareUrl: ?string}
     */
    public function payloadForApi(User $user): array
    {
        $vpnAccess = $this->vpnAccessSummary($user);
        $subscriptionImportUrl = $this->subscriptionImportUrlFor($user, $vpnAccess);
        $primary = $subscriptionImportUrl ?: ($vpnAccess['vpn']['vlessLink'] ?? null);
        $primary = $primary !== '' ? $primary : null;

        return [
            'vpnAccess' => $vpnAccess,
            'subscriptionImportUrl' => $subscriptionImportUrl,
            'primaryShareUrl' => $primary,
        ];
    }
}

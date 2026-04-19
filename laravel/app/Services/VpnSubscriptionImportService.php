<?php

namespace App\Services;

use App\Support\VlessLinkBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Публичная «ссылка подписки» /sub/{token}: Base64 от URI (VLESS), как в типичных клиентах.
 */
final class VpnSubscriptionImportService
{
    public function ensureImportToken(int $userId): string
    {
        $token = DB::table('users')->where('id', $userId)->value('subscription_import_token');
        if ($this->isValidTokenFormat($token)) {
            return (string) $token;
        }

        return DB::transaction(function () use ($userId) {
            $fresh = DB::table('users')->where('id', $userId)->lockForUpdate()->value('subscription_import_token');
            if ($this->isValidTokenFormat($fresh)) {
                return (string) $fresh;
            }
            $token = $this->generateUniqueToken();
            DB::table('users')->where('id', $userId)->update(['subscription_import_token' => $token]);

            return $token;
        });
    }

    public function rotateImportToken(int $userId): string
    {
        return DB::transaction(function () use ($userId) {
            $token = $this->generateUniqueToken();
            DB::table('users')->where('id', $userId)->update(['subscription_import_token' => $token]);

            return $token;
        });
    }

    /**
     * Подписка для клиента или null, если токен неизвестен или VPN неактивен.
     *
     * @return array{body: string, expire_unix: int}|null
     *                                                    expire_unix — конец доступа по users.expire_time (мс → сек), для заголовка Subscription-Userinfo.
     */
    public function subscriptionPayloadForImportToken(string $token): ?array
    {
        if (! $this->isValidTokenFormat($token)) {
            return null;
        }

        $userId = DB::table('users')->where('subscription_import_token', $token)->value('id');
        if ($userId === null) {
            return null;
        }

        $active = $this->activeVlessSubscriptionForUserId((int) $userId);
        if ($active === null) {
            return null;
        }

        return [
            'body' => base64_encode($active['uri']),
            'expire_unix' => $active['expire_unix'],
        ];
    }

    /**
     * @return array{uri: string, expire_unix: int}|null
     */
    private function activeVlessSubscriptionForUserId(int $userId): ?array
    {
        if (! Schema::hasColumn('users', 'uuid')) {
            return null;
        }

        $cols = array_values(array_filter([
            Schema::hasColumn('users', 'uuid') ? 'uuid' : null,
            Schema::hasColumn('users', 'port') ? 'port' : null,
            Schema::hasColumn('users', 'short_id') ? 'short_id' : null,
            Schema::hasColumn('users', 'expire_time') ? 'expire_time' : null,
        ]));
        if ($cols === []) {
            return null;
        }

        $row = DB::table('users')->where('id', $userId)->first($cols);
        if (! $row) {
            return null;
        }

        $uuid = isset($row->uuid) ? trim((string) $row->uuid) : '';
        $uuid = $uuid !== '' ? $uuid : null;
        $port = isset($row->port) ? (int) $row->port : null;
        $shortId = isset($row->short_id) ? trim((string) $row->short_id) : null;
        $shortId = $shortId !== '' ? $shortId : null;
        $expireMs = isset($row->expire_time) ? (int) $row->expire_time : null;

        $hasKey = $uuid !== null && $port !== null && $shortId !== null;
        $nowMs = (int) round(microtime(true) * 1000);
        $isActive = $hasKey && $expireMs !== null && $expireMs > $nowMs;
        if (! $isActive) {
            return null;
        }

        return [
            'uri' => VlessLinkBuilder::forUser($userId, $uuid, $port, $shortId),
            'expire_unix' => (int) floor($expireMs / 1000),
        ];
    }

    private function generateUniqueToken(): string
    {
        for ($i = 0; $i < 12; $i++) {
            $t = bin2hex(random_bytes(16));
            if (! DB::table('users')->where('subscription_import_token', $t)->exists()) {
                return $t;
            }
        }

        throw new \RuntimeException('Could not allocate subscription_import_token');
    }

    private function isValidTokenFormat(mixed $token): bool
    {
        if (! is_string($token)) {
            return false;
        }

        return strlen($token) === 32 && ctype_xdigit($token);
    }
}

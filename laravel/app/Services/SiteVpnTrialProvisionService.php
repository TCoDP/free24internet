<?php

namespace App\Services;

use App\Models\User;
use App\Support\VlessLinkBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Пробный VPN с сайта: один общий inbound на VPN_SHARED_VLESS_PORT (как у бота),
 * клиенты с email site-{id}. Продление — updateClient, новый — addClient.
 */
class SiteVpnTrialProvisionService
{
    /**
     * После успешной оплаты/продления в БД: срок VLESS в 3X-UI = users.subscription_until (как пробный, но с абсолютной датой).
     * Без uuid → новый client на общем inbound; с uuid → обновляем expiry клиента.
     *
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    public function alignVpnWithSubscriptionUntil(User $user): array
    {
        $user = $user->fresh() ?? $user;
        if (! $user->subscription_until || $user->subscription_until->lessThanOrEqualTo(now())) {
            return ['ok' => false, 'reason' => 'no_paid_access'];
        }

        if (! Schema::hasColumn('users', 'uuid')) {
            return ['ok' => false, 'reason' => 'schema_missing_uuid'];
        }

        $gateway = SiteVpnPanelGateway::fromConfig();
        if ($gateway === null) {
            return ['ok' => false, 'reason' => 'panel_not_configured'];
        }

        $targetMs = (int) ($user->subscription_until->getTimestamp() * 1000);

        $sharedPort = (int) config('vpn.shared_vless_port');
        $sharedRemark = (string) config('vpn.shared_inbound_remark');
        $maxClients = (int) config('vpn.shared_inbound_max_clients');

        $list = $gateway->getAuthenticatedJson('/panel/api/inbounds/list');
        if (! $list['ok']) {
            return [
                'ok' => false,
                'reason' => 'panel_list_failed',
                'detail' => config('app.debug') ? mb_substr($this->panelMessage($list), 0, 200) : null,
            ];
        }
        $inbounds = $list['body']['obj'] ?? null;
        if (! is_array($inbounds)) {
            return ['ok' => false, 'reason' => 'panel_list_invalid'];
        }
        $sharedInbound = $this->findInboundByPortAndRemark($inbounds, $sharedPort, $sharedRemark);
        if ($sharedInbound === null) {
            return ['ok' => false, 'reason' => 'panel_inbound_missing'];
        }

        $inboundId = (int) ($sharedInbound['id'] ?? 0);
        if ($inboundId <= 0) {
            return ['ok' => false, 'reason' => 'panel_inbound_no_id'];
        }

        $settingsRaw = $sharedInbound['settings'] ?? null;
        if (is_string($settingsRaw)) {
            $settings = json_decode($settingsRaw, true);
        } elseif (is_array($settingsRaw)) {
            $settings = $settingsRaw;
        } else {
            return ['ok' => false, 'reason' => 'panel_settings_invalid'];
        }
        if (! is_array($settings)) {
            return ['ok' => false, 'reason' => 'panel_settings_invalid'];
        }
        $clients = $settings['clients'] ?? [];
        if (! is_array($clients)) {
            $clients = [];
        }

        $email = 'site-'.$user->id;
        $rowUuid = trim((string) (DB::table('users')->where('id', $user->id)->value('uuid') ?? ''));

        $matchedByEmail = null;
        foreach ($clients as $cl) {
            if (! is_array($cl)) {
                continue;
            }
            if ((string) ($cl['email'] ?? '') === $email) {
                $matchedByEmail = $cl;
                break;
            }
        }
        $matchedByDbUuid = $rowUuid !== '' ? $this->findClientRow($clients, $rowUuid) : null;
        $clientToUpdate = is_array($matchedByEmail) ? $matchedByEmail : $matchedByDbUuid;

        if (is_array($clientToUpdate)) {
            return $this->setClientAbsoluteExpire(
                $gateway,
                $sharedInbound,
                $clientToUpdate,
                $settings,
                $targetMs,
                (int) $sharedInbound['port'],
                $user
            );
        }

        if (count($clients) >= $maxClients) {
            return ['ok' => false, 'reason' => 'shared_inbound_full'];
        }

        return $this->addSiteClientWithFixedExpiry(
            $gateway,
            $inboundId,
            $user,
            $sharedInbound,
            $targetMs,
            (int) $sharedInbound['port']
        );
    }

    /**
     * @param  array<int, mixed>  $clients
     * @return array<string, mixed>|null
     */
    private function findClientRow(array $clients, string $id): ?array
    {
        foreach ($clients as $cl) {
            if (is_array($cl) && (string) ($cl['id'] ?? '') === $id) {
                return $cl;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $clientRow
     * @param  array<string, mixed>  $settings
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    private function setClientAbsoluteExpire(
        SiteVpnPanelGateway $gateway,
        array $inbound,
        array $clientRow,
        array $settings,
        int $targetExpireMs,
        int $sharedPort,
        User $user,
    ): array {
        $inboundId = (int) ($inbound['id'] ?? 0);
        $clientUuid = (string) ($clientRow['id'] ?? '');
        if ($clientUuid === '' || $inboundId <= 0) {
            return ['ok' => false, 'reason' => 'panel_no_client_uuid'];
        }

        $oldClient = $clientRow;
        $oldClient['expiryTime'] = $targetExpireMs;

        $newSettingsObj = [
            'clients' => [$oldClient],
            'decryption' => $settings['decryption'] ?? 'none',
            'fallbacks' => is_array($settings['fallbacks'] ?? null) ? $settings['fallbacks'] : [],
        ];
        $updatePayload = [
            'id' => $inboundId,
            'settings' => json_encode($newSettingsObj, JSON_THROW_ON_ERROR),
        ];
        $path = '/panel/api/inbounds/updateClient/'.rawurlencode($clientUuid);
        $upd = $gateway->postAuthenticatedJson($path, $updatePayload);
        if (! $upd['ok']) {
            $msg = $this->panelMessage($upd);

            return [
                'ok' => false,
                'reason' => 'panel_extend_failed',
                'detail' => config('app.debug') ? mb_substr(trim($msg), 0, 200) : null,
            ];
        }
        $shortId = $this->extractShortIdFromInbound($inbound);
        DB::table('users')->where('id', $user->id)->update([
            'uuid' => $clientUuid,
            'port' => $sharedPort,
            'short_id' => $shortId,
            'expire_time' => $targetExpireMs,
        ]);

        return [
            'ok' => true,
            'vless_link' => VlessLinkBuilder::forUser((int) $user->id, $clientUuid, $sharedPort, $shortId),
            'expire_time_ms' => $targetExpireMs,
        ];
    }

    /**
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    private function addSiteClientWithFixedExpiry(
        SiteVpnPanelGateway $gateway,
        int $inboundId,
        User $user,
        array $inbound,
        int $expireMs,
        int $sharedPort,
    ): array {
        $clientUuid = (string) Str::uuid();
        $clientSettings = [
            'id' => $clientUuid,
            'flow' => 'xtls-rprx-vision',
            'email' => 'site-'.$user->id,
            'limitIp' => 1,
            'totalGB' => 0,
            'expiryTime' => $expireMs,
            'enable' => true,
            'tgId' => '',
            'subId' => '',
        ];
        $payload = [
            'id' => $inboundId,
            'settings' => json_encode(['clients' => [$clientSettings]], JSON_THROW_ON_ERROR),
        ];
        $r = $gateway->postAuthenticatedJson('/panel/api/inbounds/addClient', $payload);
        if (! $r['ok']) {
            $msg = $this->panelMessage($r);

            return [
                'ok' => false,
                'reason' => 'panel_add_client_failed',
                'detail' => config('app.debug') ? mb_substr(trim($msg), 0, 200) : null,
            ];
        }
        $shortId = $this->extractShortIdFromInbound($inbound);
        DB::table('users')->where('id', $user->id)->update([
            'uuid' => $clientUuid,
            'port' => $sharedPort,
            'short_id' => $shortId,
            'expire_time' => $expireMs,
        ]);

        return [
            'ok' => true,
            'vless_link' => VlessLinkBuilder::forUser((int) $user->id, $clientUuid, $sharedPort, $shortId),
            'expire_time_ms' => $expireMs,
        ];
    }

    /**
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    public function provisionTrial(User $user, int $trialDays): array
    {
        $trialDays = max(1, min(30, $trialDays));
        $gateway = SiteVpnPanelGateway::fromConfig();
        if ($gateway === null) {
            return ['ok' => false, 'reason' => 'panel_not_configured'];
        }

        if (! Schema::hasColumn('users', 'uuid')) {
            return ['ok' => false, 'reason' => 'schema_missing_uuid'];
        }

        $durationSec = $trialDays * 86400;
        $sharedPort = (int) config('vpn.shared_vless_port');
        $sharedRemark = (string) config('vpn.shared_inbound_remark');
        $maxClients = (int) config('vpn.shared_inbound_max_clients');

        try {
            return DB::transaction(function () use ($user, $gateway, $durationSec, $sharedPort, $sharedRemark, $maxClients) {
                $locked = DB::table('users')->where('id', $user->id)->lockForUpdate()->first(['uuid']);
                if ($locked && strlen(trim((string) ($locked->uuid ?? ''))) > 0) {
                    return ['ok' => false, 'reason' => 'trial_only_first'];
                }

                $list = $gateway->getAuthenticatedJson('/panel/api/inbounds/list');
                if (! $list['ok']) {
                    return [
                        'ok' => false,
                        'reason' => 'panel_list_failed',
                        'detail' => config('app.debug') ? mb_substr($this->panelMessage($list), 0, 200) : null,
                    ];
                }

                $inbounds = $list['body']['obj'] ?? null;
                if (! is_array($inbounds)) {
                    return ['ok' => false, 'reason' => 'panel_list_invalid'];
                }

                $sharedInbound = $this->findInboundByPortAndRemark($inbounds, $sharedPort, $sharedRemark);

                if ($sharedInbound === null) {
                    $foreign = $this->findInboundOnPortWithOtherRemark($inbounds, $sharedPort, $sharedRemark);
                    if ($foreign !== null) {
                        return [
                            'ok' => false,
                            'reason' => 'shared_port_occupied',
                            'detail' => config('app.debug')
                                ? 'remark: '.trim((string) ($foreign['remark'] ?? ''))
                                : null,
                        ];
                    }

                    $payload = $this->buildSharedFirstInboundPayload($user, $sharedPort, $sharedRemark, $durationSec);
                    $panel = $gateway->postAuthenticatedJson('/panel/api/inbounds/add', $payload);
                    if ($panel['ok']) {
                        return $this->persistNewInbound($user, $payload);
                    }

                    $panelMsg = $this->panelMessage($panel);
                    if ($this->isPortAlreadyExistsMessage($panelMsg)) {
                        $list2 = $gateway->getAuthenticatedJson('/panel/api/inbounds/list');
                        if (! $list2['ok']) {
                            return ['ok' => false, 'reason' => 'panel_list_failed'];
                        }
                        $inbounds2 = $list2['body']['obj'] ?? [];
                        $shared2 = is_array($inbounds2)
                            ? $this->findInboundByPortAndRemark($inbounds2, $sharedPort, $sharedRemark)
                            : null;
                        if ($shared2 === null) {
                            return ['ok' => false, 'reason' => 'panel_inbound_missing'];
                        }

                        return $this->addOrExtendSiteTrialOnSharedInbound(
                            $gateway,
                            $user,
                            $shared2,
                            $durationSec,
                            $maxClients
                        );
                    }

                    Log::warning('site vpn panel add shared inbound failed', [
                        'user_id' => $user->id,
                        'http' => $panel['http'] ?? null,
                        'panel_msg' => mb_substr($panelMsg, 0, 300),
                    ]);

                    return [
                        'ok' => false,
                        'reason' => 'panel_add_failed',
                        'detail' => config('app.debug') ? mb_substr(trim($panelMsg), 0, 200) : null,
                    ];
                }

                return $this->addOrExtendSiteTrialOnSharedInbound(
                    $gateway,
                    $user,
                    $sharedInbound,
                    $durationSec,
                    $maxClients
                );
            });
        } catch (\Throwable $e) {
            Log::error('site vpn trial transaction failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);

            return ['ok' => false, 'reason' => 'exception'];
        }
    }

    /**
     * @param  array<int, mixed>  $inbounds
     */
    private function findInboundByPortAndRemark(array $inbounds, int $port, string $remark): ?array
    {
        $remark = trim($remark);
        foreach ($inbounds as $ib) {
            if (! is_array($ib)) {
                continue;
            }
            if ((int) ($ib['port'] ?? 0) !== $port) {
                continue;
            }
            if (trim((string) ($ib['remark'] ?? '')) === $remark) {
                return $ib;
            }
        }

        return null;
    }

    /**
     * @param  array<int, mixed>  $inbounds
     */
    private function findInboundOnPortWithOtherRemark(array $inbounds, int $port, string $expectedRemark): ?array
    {
        $expectedRemark = trim($expectedRemark);
        foreach ($inbounds as $ib) {
            if (! is_array($ib)) {
                continue;
            }
            if ((int) ($ib['port'] ?? 0) !== $port) {
                continue;
            }
            if (trim((string) ($ib['remark'] ?? '')) !== $expectedRemark) {
                return $ib;
            }
        }

        return null;
    }

    /**
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    private function addOrExtendSiteTrialOnSharedInbound(
        SiteVpnPanelGateway $gateway,
        User $user,
        array $inbound,
        int $durationSec,
        int $maxClients
    ): array {
        $sharedPort = (int) ($inbound['port'] ?? 0);
        $inboundId = $inbound['id'] ?? null;
        if ($inboundId === null) {
            return ['ok' => false, 'reason' => 'panel_inbound_no_id'];
        }

        $settingsRaw = $inbound['settings'] ?? null;
        if (is_string($settingsRaw)) {
            $settings = json_decode($settingsRaw, true);
        } elseif (is_array($settingsRaw)) {
            $settings = $settingsRaw;
        } else {
            return ['ok' => false, 'reason' => 'panel_settings_invalid'];
        }

        if (! is_array($settings)) {
            return ['ok' => false, 'reason' => 'panel_settings_invalid'];
        }

        $clients = $settings['clients'] ?? [];
        if (! is_array($clients)) {
            $clients = [];
        }

        $email = 'site-'.$user->id;
        foreach ($clients as $cl) {
            if (! is_array($cl)) {
                continue;
            }
            if ((string) ($cl['email'] ?? '') === $email) {
                return $this->extendExistingSiteClient($gateway, $inbound, $cl, $settings, $durationSec, $sharedPort, $user);
            }
        }

        if (count($clients) >= $maxClients) {
            return ['ok' => false, 'reason' => 'shared_inbound_full'];
        }

        return $this->addSiteTrialClientRow($gateway, (int) $inboundId, $user, $inbound, $durationSec, $sharedPort);
    }

    /**
     * @param  array<string, mixed>  $clientRow
     * @param  array<string, mixed>  $settings
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    private function extendExistingSiteClient(
        SiteVpnPanelGateway $gateway,
        array $inbound,
        array $clientRow,
        array $settings,
        int $durationSec,
        int $sharedPort,
        User $user
    ): array {
        $inboundId = (int) ($inbound['id'] ?? 0);
        $clientUuid = (string) ($clientRow['id'] ?? '');
        if ($clientUuid === '') {
            return ['ok' => false, 'reason' => 'panel_no_client_uuid'];
        }

        $nowMs = (int) round(microtime(true) * 1000);
        try {
            $curExp = (int) ($clientRow['expiryTime'] ?? 0);
        } catch (\Throwable) {
            $curExp = 0;
        }
        $baseMs = max($nowMs, $curExp);
        $newExpireMs = $baseMs + (int) ($durationSec * 1000);

        $oldClient = $clientRow;
        $oldClient['expiryTime'] = $newExpireMs;

        $newSettingsObj = [
            'clients' => [$oldClient],
            'decryption' => $settings['decryption'] ?? 'none',
            'fallbacks' => is_array($settings['fallbacks'] ?? null) ? $settings['fallbacks'] : [],
        ];

        $updatePayload = [
            'id' => $inboundId,
            'settings' => json_encode($newSettingsObj, JSON_THROW_ON_ERROR),
        ];

        $path = '/panel/api/inbounds/updateClient/'.rawurlencode($clientUuid);
        $upd = $gateway->postAuthenticatedJson($path, $updatePayload);
        if (! $upd['ok']) {
            $msg = $this->panelMessage($upd);

            return [
                'ok' => false,
                'reason' => 'panel_extend_failed',
                'detail' => config('app.debug') ? mb_substr(trim($msg), 0, 200) : null,
            ];
        }

        $shortId = $this->extractShortIdFromInbound($inbound);

        DB::table('users')->where('id', $user->id)->update([
            'uuid' => $clientUuid,
            'port' => $sharedPort,
            'short_id' => $shortId,
            'expire_time' => $newExpireMs,
        ]);

        return [
            'ok' => true,
            'vless_link' => VlessLinkBuilder::forUser((int) $user->id, $clientUuid, $sharedPort, $shortId),
            'expire_time_ms' => $newExpireMs,
        ];
    }

    /**
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    private function addSiteTrialClientRow(
        SiteVpnPanelGateway $gateway,
        int $inboundId,
        User $user,
        array $inbound,
        int $durationSec,
        int $sharedPort
    ): array {
        $expireMs = (int) round((microtime(true) + $durationSec) * 1000);
        $clientUuid = (string) Str::uuid();
        $clientSettings = [
            'id' => $clientUuid,
            'flow' => 'xtls-rprx-vision',
            'email' => 'site-'.$user->id,
            'limitIp' => 1,
            'totalGB' => 0,
            'expiryTime' => $expireMs,
            'enable' => true,
            'tgId' => '',
            'subId' => '',
        ];

        $payload = [
            'id' => $inboundId,
            'settings' => json_encode(['clients' => [$clientSettings]], JSON_THROW_ON_ERROR),
        ];

        $r = $gateway->postAuthenticatedJson('/panel/api/inbounds/addClient', $payload);
        if (! $r['ok']) {
            $msg = $this->panelMessage($r);

            return [
                'ok' => false,
                'reason' => 'panel_add_client_failed',
                'detail' => config('app.debug') ? mb_substr(trim($msg), 0, 200) : null,
            ];
        }

        $shortId = $this->extractShortIdFromInbound($inbound);

        DB::table('users')->where('id', $user->id)->update([
            'uuid' => $clientUuid,
            'port' => $sharedPort,
            'short_id' => $shortId,
            'expire_time' => $expireMs,
        ]);

        return [
            'ok' => true,
            'vless_link' => VlessLinkBuilder::forUser((int) $user->id, $clientUuid, $sharedPort, $shortId),
            'expire_time_ms' => $expireMs,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{ok: bool, reason?: string, detail?: ?string, vless_link?: string, expire_time_ms?: int}
     */
    private function persistNewInbound(User $user, array $payload): array
    {
        $settings = json_decode((string) $payload['settings'], true, 512, JSON_THROW_ON_ERROR);
        $clients = $settings['clients'] ?? [];
        $first = $clients[0] ?? null;
        if (! is_array($first)) {
            return ['ok' => false, 'reason' => 'panel_invalid_response'];
        }
        $clientUuid = (string) ($first['id'] ?? '');
        $expireMs = (int) ($first['expiryTime'] ?? 0);
        $stream = json_decode((string) $payload['streamSettings'], true, 512, JSON_THROW_ON_ERROR);
        $shortIds = $stream['realitySettings']['shortIds'] ?? [];
        $shortId = isset($shortIds[0]) ? (string) $shortIds[0] : '8c8b17de0242';
        $port = (int) $payload['port'];

        if ($clientUuid === '' || $expireMs <= 0) {
            return ['ok' => false, 'reason' => 'panel_invalid_response'];
        }

        DB::table('users')->where('id', $user->id)->update([
            'uuid' => $clientUuid,
            'port' => $port,
            'short_id' => $shortId,
            'expire_time' => $expireMs,
        ]);

        return [
            'ok' => true,
            'vless_link' => VlessLinkBuilder::forUser((int) $user->id, $clientUuid, $port, $shortId),
            'expire_time_ms' => $expireMs,
        ];
    }

    /**
     * @param  array<string, mixed>  $inbound
     */
    private function extractShortIdFromInbound(array $inbound): string
    {
        $raw = $inbound['streamSettings'] ?? null;
        if (is_string($raw)) {
            $stream = json_decode($raw, true);
        } elseif (is_array($raw)) {
            $stream = $raw;
        } else {
            return '8c8b17de0242';
        }

        if (! is_array($stream)) {
            return '8c8b17de0242';
        }

        $ids = $stream['realitySettings']['shortIds'] ?? [];

        return isset($ids[0]) && is_string($ids[0]) && $ids[0] !== ''
            ? $ids[0]
            : '8c8b17de0242';
    }

    private function isPortAlreadyExistsMessage(string $msg): bool
    {
        $m = strtolower($msg);

        return str_contains($m, 'port already exists')
            || str_contains($m, 'duplicate port')
            || str_contains($m, 'port is already in use');
    }

    /**
     * @param  array<string, mixed>  $panel
     */
    private function panelMessage(array $panel): string
    {
        $b = $panel['body'] ?? null;

        return is_array($b)
            ? (string) (($b['msg'] ?? $b['message']) ?? '')
            : '';
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSharedFirstInboundPayload(User $user, int $port, string $remark, int $durationSec): array
    {
        $expireMs = (int) round((microtime(true) + $durationSec) * 1000);
        $clientUuid = (string) Str::uuid();
        $shortId = bin2hex(random_bytes(8));
        $pbk = (string) config('vpn.reality_pbk');
        $priv = (string) config('vpn.reality_private_key');
        $dest = (string) config('vpn.reality_dest', 'yahoo.com:443');
        $sni = (string) config('vpn.reality_sni', 'yahoo.com');
        $clientEmail = 'site-'.$user->id;

        $clientSettings = [
            'id' => $clientUuid,
            'flow' => 'xtls-rprx-vision',
            'email' => $clientEmail,
            'limitIp' => 1,
            'totalGB' => 0,
            'expiryTime' => $expireMs,
            'enable' => true,
            'tgId' => '',
            'subId' => '',
        ];

        return [
            'up' => 0,
            'down' => 0,
            'total' => 0,
            'remark' => $remark,
            'enable' => true,
            'expiryTime' => $expireMs,
            'listen' => '',
            'port' => $port,
            'protocol' => 'vless',
            'settings' => json_encode([
                'clients' => [$clientSettings],
                'decryption' => 'none',
                'fallbacks' => [],
            ], JSON_THROW_ON_ERROR),
            'streamSettings' => json_encode([
                'network' => 'tcp',
                'security' => 'reality',
                'realitySettings' => [
                    'show' => false,
                    'xver' => 0,
                    'dest' => $dest,
                    'serverNames' => [$sni, 'www.'.preg_replace('/^www\./', '', $sni)],
                    'privateKey' => $priv,
                    'minClient' => '',
                    'maxClient' => '',
                    'maxTimediff' => 0,
                    'shortIds' => [$shortId],
                    'settings' => [
                        'publicKey' => $pbk,
                        'fingerprint' => 'chrome',
                        'serverName' => '',
                        'spiderX' => '/',
                    ],
                ],
                'tcpSettings' => [
                    'acceptProxyProtocol' => false,
                    'header' => ['type' => 'none'],
                ],
            ], JSON_THROW_ON_ERROR),
            'sniffing' => json_encode([
                'enabled' => true,
                'destOverride' => ['http', 'tls'],
            ], JSON_THROW_ON_ERROR),
            'allocate' => json_encode([
                'strategy' => 'always',
                'refresh' => 5,
                'concurrency' => 3,
            ], JSON_THROW_ON_ERROR),
        ];
    }
}

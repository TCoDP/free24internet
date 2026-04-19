<?php

namespace App\Support;

/**
 * Та же схема ссылки, что в vpn_bot/bot.py — generate_vless_link.
 */
class VlessLinkBuilder
{
    public static function forUser(int $userId, string $clientUuid, int $port, string $shortId): string
    {
        $ip = (string) (config('vpn.public_host') ?: '185.216.87.152');
        $pbk = (string) (config('vpn.reality_pbk') ?: 'VrMFfSvBarPYCL9BvVin31qyKnUrowgFBm_8okubhUc');
        $sni = (string) (config('vpn.reality_sni') ?: 'yahoo.com');
        $fp = 'chrome';
        $spx = rawurlencode('/');
        $flow = 'xtls-rprx-vision';
        $displayName = (string) config('vpn.vless_display_name', '🇳🇱 Нидерланды');
        $name = rawurlencode($displayName !== '' ? $displayName : 'FI-'.$userId);

        return sprintf(
            'vless://%s@%s:%d?type=tcp&security=reality&pbk=%s&fp=%s&sni=%s&sid=%s&spx=%s&flow=%s#%s',
            $clientUuid,
            $ip,
            $port,
            $pbk,
            $fp,
            $sni,
            $shortId,
            $spx,
            $flow,
            $name
        );
    }
}

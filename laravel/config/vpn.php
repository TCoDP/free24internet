<?php

return [
    /*
    | Домен или IP в VLESS-ссылке (как VPN_DOMAIN в vpn_bot/.env).
    */
    'public_host' => env('VPN_DOMAIN', '185.216.87.152'),

    /*
    | Имя профиля подписки в клиентах (заголовки ответа GET /sub/{token}).
    */
    'subscription_import_profile_name' => env('VPN_SUBSCRIPTION_IMPORT_PROFILE', 'Free24Internet'),

    /*
    | Ссылка на сайт для клиента (заголовок Profile-Web-Page-Url). Пусто = в коде подставится config('app.url').
    */
    'subscription_import_profile_web_url' => env('VPN_SUBSCRIPTION_PROFILE_WEB_URL'),

    /*
    | Подпись узла в VLESS (#fragment) — как отображается в приложении.
    */
    'vless_display_name' => env('VPN_VLESS_DISPLAY_NAME', '🇳🇱 Нидерланды'),

    'reality_pbk' => env('VPN_REALITY_PBK', 'VrMFfSvBarPYCL9BvVin31qyKnUrowgFBm_8okubhUc'),
    'reality_sni' => env('VPN_REALITY_SNI', 'yahoo.com'),

    /*
    | Панель 3X-UI — те же переменные, что PANEL_* у бота (сайт ходит сам, без бота).
    */
    'panel' => [
        'url' => env('VPN_PANEL_URL', ''),
        'user' => env('VPN_PANEL_USER', ''),
        'password' => env('VPN_PANEL_PASSWORD', ''),
        'login_secret' => env('VPN_PANEL_SECRET', ''),
    ],

    /*
    | Один общий inbound: порт и remark как у бота (SHARED_VLESS_PORT / SHARED_INBOUND_REMARK).
    */
    'shared_vless_port' => (function () {
        $sp = env('VPN_SHARED_VLESS_PORT');

        return (int) (($sp !== null && trim((string) $sp) !== '')
            ? $sp
            : env('VPN_START_PORT', 20000));
    })(),
    'shared_inbound_remark' => env('VPN_SHARED_INBOUND_REMARK', 'Shared_VLESS'),
    'shared_inbound_max_clients' => (int) env('VPN_SHARED_INBOUND_MAX_CLIENTS', 100),

    /*
    | Устарело: раньше порт = start_port + users.id. Оставлено для fallback shared_vless_port.
    */
    'start_port' => (int) env('VPN_START_PORT', 20000),

    /*
    | Reality в add inbound — совпадают с vpn_bot/bot.py add_inbound.
    */
    'reality_private_key' => env('VPN_REALITY_PRIVATE_KEY', 'EPtPI6Ic8Pjd2ujXF6DkyNIzDL-NFs3qHZyqlD6Ichk'),
    'reality_dest' => env('VPN_REALITY_DEST', 'yahoo.com:443'),
];

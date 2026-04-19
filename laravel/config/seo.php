<?php

declare(strict_types=1);

$manualDevices = ['ios', 'android', 'macos', 'windows'];

$deviceUrls = [];
foreach ($manualDevices as $device) {
    $deviceUrls[] = [
        'path' => '/manuals/'.$device,
        'changefreq' => 'monthly',
        'priority' => 0.7,
    ];
    $deviceUrls[] = [
        'path' => '/en/manuals/'.$device,
        'changefreq' => 'monthly',
        'priority' => 0.7,
    ];
}

return [
    'sitemap_path' => public_path('sitemap.xml'),
    'robots_path' => public_path('robots.txt'),

    /*
    |--------------------------------------------------------------------------
    | Публичные URL для sitemap.xml
    |--------------------------------------------------------------------------
    | Пути от корня сайта (с ведущим /). Добавляйте сюда новые лендинги.
    */
    'urls' => array_merge([
        ['path' => '/', 'changefreq' => 'weekly', 'priority' => 1.0],
        ['path' => '/en', 'changefreq' => 'weekly', 'priority' => 0.9],
        ['path' => '/terms', 'changefreq' => 'monthly', 'priority' => 0.5],
        ['path' => '/privacy', 'changefreq' => 'monthly', 'priority' => 0.5],
        ['path' => '/manuals', 'changefreq' => 'monthly', 'priority' => 0.8],
        ['path' => '/en/terms', 'changefreq' => 'monthly', 'priority' => 0.5],
        ['path' => '/en/privacy', 'changefreq' => 'monthly', 'priority' => 0.5],
        ['path' => '/en/manuals', 'changefreq' => 'monthly', 'priority' => 0.8],
        ['path' => '/articles', 'changefreq' => 'weekly', 'priority' => 0.75],
        ['path' => '/en/articles', 'changefreq' => 'weekly', 'priority' => 0.72],
    ], $deviceUrls, [
        ['path' => '/llms.txt', 'changefreq' => 'monthly', 'priority' => 0.35],
    ]),

    'site_name' => env('SEO_SITE_NAME', 'Свободный Интернет'),

    /** Путь к OG-картинке по умолчанию (от корня public) */
    'default_og_image_path' => '/assets/img/about.jpg',

    'llms_path' => public_path('llms.txt'),
    'llms_well_known_path' => public_path('.well-known/llms.txt'),

    /*
    |--------------------------------------------------------------------------
    | llms.txt — краткое описание для ИИ-ассистентов (см. https://llmstxt.org/ )
    |--------------------------------------------------------------------------
    */
    'llms_body' => <<<'MD'
# Свободный Интернет / Free Internet

Цифровой сервис подписки на доступ: сайт, личный кабинет и Telegram-бот для оформления и продления.

## Основные URL
- Главная (RU): /
- Home (EN): /en/
- Условия / Terms: /terms, /en/terms
- Конфиденциальность / Privacy: /privacy, /en/privacy
- Инструкции / Guides: /manuals, /en/manuals

## Для пользователей
Оплата и выдача доступа выполняются через Telegram-бота. На сайте — регистрация, тарифы, тикеты поддержки, язык интерфейса.

## Контакты
- Telegram-бот: https://t.me/free24_internet_bot

## Машиночитаемая карта сайта
- Sitemap: /sitemap.xml
MD,

    /*
    |--------------------------------------------------------------------------
    | Disallow в robots.txt (для * и для перечисленных ИИ-ботов ниже)
    |--------------------------------------------------------------------------
    */
    'robots_disallow' => [
        '/account/',
        '/admin/',
        '/api/',
        '/sub/',
        '/dashboard',
    ],

    /*
    |--------------------------------------------------------------------------
    | Явные блоки User-agent для ИИ-краулеров (те же Disallow, что и у *)
    |--------------------------------------------------------------------------
    | Не блокируем обучение целиком — только закрытые разделы.
    */
    'robots_ai_user_agents' => [
        'GPTBot',
        'ChatGPT-User',
        'Google-Extended',
        'CCBot',
        'anthropic-ai',
        'Claude-Web',
        'ClaudeBot',
        'PerplexityBot',
        'Applebot-Extended',
        'meta-externalagent',
    ],
];

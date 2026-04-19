<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Article;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedLegacyVpnGuide();
        $definitions = require database_path('data/article_seeds.php');
        foreach ($definitions as $row) {
            $this->seedFromHtmlFiles(
                (string) $row['slug'],
                (int) ($row['published_days_ago'] ?? 1),
                $row['ru'],
                $row['en'],
            );
        }
    }

    private function seedLegacyVpnGuide(): void
    {
        $slug = 'kak-vybrat-vpn-2026';
        $ruPath = database_path('data/articles/'.$slug.'.ru.html');
        $enPath = database_path('data/articles/'.$slug.'.en.html');
        $ruHtml = is_file($ruPath) ? (string) file_get_contents($ruPath) : '<p>Заполните статью в админке.</p>';
        $enHtml = is_file($enPath) ? (string) file_get_contents($enPath) : '<p>Add article body in admin.</p>';

        Article::query()->updateOrCreate(
            ['locale' => 'ru', 'slug' => $slug],
            [
                'title' => 'Как выбрать VPN в 2026 году: практичный гайд без воды и рекламных обещаний',
                'meta_title' => 'Как выбрать VPN в 2026: гайд по выбору сервиса | Свободный Интернет',
                'meta_description' => 'Как выбрать VPN без лишнего шума: логи и юрисдикция, скорость, тарифы, ошибки новичков и честное сравнение подходов. Практические советы и FAQ.',
                'meta_keywords' => 'как выбрать vpn, безопасный интернет, подключение vpn, тарифы vpn, защита данных, wireguard, бесплатный vpn',
                'og_title' => 'Как выбрать VPN в 2026 году — практичный гайд',
                'og_description' => 'Разбираем критерии выбора VPN: политика логов, скорость, тарифы, плюсы и минусы бесплатных решений, FAQ и выводы.',
                'excerpt' => 'Честный разбор: на что смотреть до оплаты, где вас чаще обманывают в рекламе VPN, и как не переплатить за лишнее.',
                'body_html' => $ruHtml,
                'is_published' => true,
                'published_at' => now()->subDay(),
            ],
        );

        Article::query()->updateOrCreate(
            ['locale' => 'en', 'slug' => $slug],
            [
                'title' => 'How to choose a VPN in 2026: a practical guide without hype',
                'meta_title' => 'How to choose a VPN in 2026 | Free Internet',
                'meta_description' => 'A practical VPN buyer guide: logging, speed tests, free vs paid trade-offs, common mistakes, and FAQ — without marketing noise.',
                'meta_keywords' => 'how to choose vpn, secure internet, vpn subscription, wireguard, privacy, free vpn risks',
                'og_title' => 'How to choose a VPN in 2026',
                'og_description' => 'What to verify before paying, how to test performance, and realistic expectations from a VPN service.',
                'excerpt' => 'Criteria that actually matter, mistakes to avoid, and a concise FAQ before you subscribe.',
                'body_html' => $enHtml,
                'is_published' => true,
                'published_at' => now()->subDay(),
            ],
        );
    }

    /**
     * @param  array<string, string>  $ru
     * @param  array<string, string>  $en
     */
    private function seedFromHtmlFiles(string $slug, int $publishedDaysAgo, array $ru, array $en): void
    {
        $ruPath = database_path('data/articles/'.$slug.'.ru.html');
        $enPath = database_path('data/articles/'.$slug.'.en.html');
        $ruHtml = is_file($ruPath) ? (string) file_get_contents($ruPath) : '<p>Тело статьи отсутствует: '.$slug.'.ru.html</p>';
        $enHtml = is_file($enPath) ? (string) file_get_contents($enPath) : '<p>Missing article body: '.$slug.'.en.html</p>';
        $publishedAt = now()->subDays(max(1, $publishedDaysAgo));

        Article::query()->updateOrCreate(
            ['locale' => 'ru', 'slug' => $slug],
            array_merge($ru, [
                'body_html' => $ruHtml,
                'is_published' => true,
                'published_at' => $publishedAt,
            ]),
        );

        Article::query()->updateOrCreate(
            ['locale' => 'en', 'slug' => $slug],
            array_merge($en, [
                'body_html' => $enHtml,
                'is_published' => true,
                'published_at' => $publishedAt,
            ]),
        );
    }
}

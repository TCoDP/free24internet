<?php

declare(strict_types=1);

namespace App\Services\Seo;

use App\Models\Article;
use DOMDocument;
use DOMElement;
use Illuminate\Support\Facades\File;

class SeoGenerator
{
    public function writeSitemap(): string
    {
        $path = (string) config('seo.sitemap_path');
        $xml = $this->buildSitemapXml();
        File::put($path, $xml);

        return $path;
    }

    public function writeRobots(): string
    {
        $path = (string) config('seo.robots_path');
        File::put($path, $this->buildRobotsTxt());

        return $path;
    }

    public function writeLlmsTxt(): string
    {
        $primary = (string) config('seo.llms_path');
        $wellKnown = (string) config('seo.llms_well_known_path');
        $body = $this->buildLlmsBody();

        File::ensureDirectoryExists(\dirname($wellKnown));
        File::put($primary, $body);
        File::put($wellKnown, $body);

        return $primary;
    }

    public function buildLlmsBody(): string
    {
        $base = (string) config('seo.llms_body', '');
        $articles = Article::query()->published()->orderBy('locale')->orderBy('slug')->get(['locale', 'slug', 'title']);
        if ($articles->isEmpty()) {
            return $base;
        }

        $lines = [];
        foreach ($articles as $row) {
            $path = $row->locale === 'en' ? '/en/articles/'.$row->slug : '/articles/'.$row->slug;
            $lines[] = '- ['.$row->locale.'] '.$row->title.': '.$path;
        }

        return rtrim($base)."\n\n## Статьи / Articles\n".implode("\n", $lines)."\n";
    }

    public function buildSitemapXml(): string
    {
        $base = rtrim((string) config('app.url'), '/');
        $defaultLastmod = now()->toDateString();

        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;

        $urlset = $dom->createElementNS('http://www.sitemaps.org/schemas/sitemap/0.9', 'urlset');
        $dom->appendChild($urlset);

        /** @var list<array{path: string, changefreq: string, priority: float|int}> $urls */
        $urls = config('seo.urls', []);

        foreach ($urls as $row) {
            $path = $row['path'] ?? '';
            if ($path === '' || $path[0] !== '/') {
                continue;
            }
            $this->appendSitemapUrl(
                $dom,
                $urlset,
                $base.$path,
                $defaultLastmod,
                (string) ($row['changefreq'] ?? 'monthly'),
                (float) ($row['priority'] ?? 0.5),
            );
        }

        foreach (Article::query()->published()->orderBy('locale')->orderBy('slug')->get() as $article) {
            $path = $article->publicPath();
            $lastmod = $article->updated_at?->toDateString() ?? $defaultLastmod;
            $this->appendSitemapUrl($dom, $urlset, $base.$path, $lastmod, 'monthly', 0.65);
        }

        return $dom->saveXML() ?: '';
    }

    private function appendSitemapUrl(
        DOMDocument $dom,
        DOMElement $urlset,
        string $loc,
        string $lastmod,
        string $changefreq,
        float $priority,
    ): void {
        $urlEl = $dom->createElement('url');
        $urlset->appendChild($urlEl);

        $urlEl->appendChild($dom->createElement('loc', $loc));
        $urlEl->appendChild($dom->createElement('lastmod', $lastmod));
        $urlEl->appendChild($dom->createElement('changefreq', $changefreq));

        $priorityStr = number_format(max(0.0, min(1.0, $priority)), 1, '.', '');
        $urlEl->appendChild($dom->createElement('priority', $priorityStr));
    }

    public function buildRobotsTxt(): string
    {
        $base = rtrim((string) config('app.url'), '/');
        $sitemapUrl = $base.'/sitemap.xml';

        /** @var list<string> $disallow */
        $disallow = config('seo.robots_disallow', []);

        $lines = [
            '# llms.txt: '.rtrim($base, '/').'/llms.txt (см. https://llmstxt.org/ )',
            ...$this->robotsBlockLines('*', $disallow),
        ];

        $host = parse_url($base, PHP_URL_HOST);
        if (is_string($host) && $host !== '') {
            $lines[] = '';
            $lines[] = 'Host: '.$host;
        }

        /** @var list<string> $aiAgents */
        $aiAgents = config('seo.robots_ai_user_agents', []);
        foreach ($aiAgents as $ua) {
            $ua = trim((string) $ua);
            if ($ua === '') {
                continue;
            }
            $lines[] = '';
            $lines = array_merge($lines, $this->robotsBlockLines($ua, $disallow));
        }

        $lines[] = '';
        $lines[] = 'Sitemap: '.$sitemapUrl;

        return implode("\n", $lines)."\n";
    }

    /**
     * @param  list<string>  $disallow
     * @return list<string>
     */
    private function robotsBlockLines(string $userAgent, array $disallow): array
    {
        $out = ['User-agent: '.$userAgent];
        foreach ($disallow as $rule) {
            $rule = trim((string) $rule);
            if ($rule !== '') {
                $out[] = 'Disallow: '.$rule;
            }
        }

        return $out;
    }
}

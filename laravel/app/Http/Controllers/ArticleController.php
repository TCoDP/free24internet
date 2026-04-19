<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    public function index(Request $request): Response
    {
        $locale = (string) $request->route('locale', 'ru');
        if (! in_array($locale, ['ru', 'en'], true)) {
            $locale = 'ru';
        }

        $articles = Article::query()
            ->published()
            ->where('locale', $locale)
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get(['slug', 'title', 'excerpt', 'published_at'])
            ->map(static fn (Article $a) => [
                'slug' => $a->slug,
                'title' => $a->title,
                'excerpt' => $a->excerpt,
                'published_at' => $a->published_at?->toIso8601String(),
            ]);

        return Inertia::render('Public/Articles/Index', [
            'locale' => $locale,
            'articles' => $articles,
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $locale = (string) $request->route('locale', 'ru');
        if (! in_array($locale, ['ru', 'en'], true)) {
            $locale = 'ru';
        }

        $article = Article::query()
            ->published()
            ->where('locale', $locale)
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('Public/Articles/Show', [
            'locale' => $locale,
            'article' => [
                'slug' => $article->slug,
                'title' => $article->title,
                'meta_title' => $article->meta_title ?: $article->title,
                'meta_description' => (string) ($article->meta_description ?? ''),
                'meta_keywords' => (string) ($article->meta_keywords ?? ''),
                'og_title' => (string) ($article->og_title ?: ($article->meta_title ?: $article->title)),
                'og_description' => (string) ($article->og_description ?: ($article->meta_description ?? '')),
                'twitter_title' => (string) ($article->og_title ?: ($article->meta_title ?: $article->title)),
                'twitter_description' => (string) ($article->og_description ?: ($article->meta_description ?? '')),
                'body_html' => $article->body_html,
                'published_at' => $article->published_at?->toIso8601String(),
            ],
        ]);
    }
}

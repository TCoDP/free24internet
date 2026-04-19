<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArticleAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $locale = $request->string('locale')->toString();
        $q = trim($request->string('q')->toString());

        $query = Article::query()->orderByDesc('id');
        if (in_array($locale, ['ru', 'en'], true)) {
            $query->where('locale', $locale);
        }
        if ($q !== '') {
            $query->where(function ($b) use ($q) {
                $b->where('slug', 'like', '%'.$q.'%')
                    ->orWhere('title', 'like', '%'.$q.'%');
            });
        }

        $articles = $query
            ->select(['id', 'locale', 'slug', 'title', 'is_published', 'published_at', 'updated_at'])
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Admin/Articles/Index', [
            'articles' => $articles,
            'filters' => [
                'locale' => in_array($locale, ['ru', 'en'], true) ? $locale : '',
                'q' => $q,
            ],
            'locale' => $request->user()?->language === 'en' ? 'en' : 'ru',
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Articles/Edit', [
            'article' => null,
            'locale' => $request->user()?->language === 'en' ? 'en' : 'ru',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Article::query()->create($this->validated($request));

        return redirect()->route('admin.articles.index')->with('status', 'Статья создана.');
    }

    public function edit(Request $request, Article $article): Response
    {
        return Inertia::render('Admin/Articles/Edit', [
            'article' => [
                'id' => $article->id,
                'locale' => $article->locale,
                'slug' => $article->slug,
                'title' => $article->title,
                'meta_title' => $article->meta_title,
                'meta_description' => $article->meta_description,
                'meta_keywords' => $article->meta_keywords,
                'og_title' => $article->og_title,
                'og_description' => $article->og_description,
                'excerpt' => $article->excerpt,
                'body_html' => $article->body_html,
                'is_published' => $article->is_published,
                'published_at' => $article->published_at?->format('Y-m-d\TH:i'),
            ],
            'locale' => $request->user()?->language === 'en' ? 'en' : 'ru',
        ]);
    }

    public function update(Request $request, Article $article): RedirectResponse
    {
        $article->update($this->validated($request, $article->id));

        return redirect()->route('admin.articles.index')->with('status', 'Статья сохранена.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreArticleId = null): array
    {
        if ($request->input('published_at') === '') {
            $request->merge(['published_at' => null]);
        }

        $slugRule = Rule::unique('articles', 'slug')->where(
            fn ($q) => $q->where('locale', $request->string('locale')->toString())
        );
        if ($ignoreArticleId !== null) {
            $slugRule = $slugRule->ignore($ignoreArticleId);
        }

        $data = $request->validate([
            'locale' => ['required', Rule::in(['ru', 'en'])],
            'slug' => ['required', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slugRule],
            'title' => ['required', 'string', 'max:500'],
            'meta_title' => ['nullable', 'string', 'max:512'],
            'meta_description' => ['nullable', 'string', 'max:2000'],
            'meta_keywords' => ['nullable', 'string', 'max:1000'],
            'og_title' => ['nullable', 'string', 'max:512'],
            'og_description' => ['nullable', 'string', 'max:2000'],
            'excerpt' => ['nullable', 'string', 'max:1024'],
            'body_html' => ['required', 'string'],
            'is_published' => ['required', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $data['published_at'] = filled($data['published_at'] ?? null) ? $data['published_at'] : null;

        return $data;
    }
}

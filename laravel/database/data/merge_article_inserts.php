<?php

declare(strict_types=1);

/**
 * Идемпотентно вставляет database/data/inserts_ru/{slug}.html перед <h2>Частые вопросы</h2>
 * и inserts_en/{slug}.html перед <h2>FAQ</h2>: старый блок с тем же первым H2 удаляется перед новой вставкой.
 */
function insert_first_h2(string $html): ?string
{
    if (preg_match('/<h2>[^<]+<\/h2>/', $html, $m)) {
        return $m[0];
    }

    return null;
}

function clean_insert(string $html): string
{
    $html = preg_replace('/<!--AUTO_INSERT_(BEGIN|END)-->\s*/', '', $html) ?? $html;

    return trim($html);
}

function merge_before_faq(string $article, string $faqNeedle, string $insertRaw): string
{
    $parts = explode($faqNeedle, $article, 2);
    if (count($parts) < 2) {
        return $article;
    }
    [$pre, $rest] = $parts;
    $insert = clean_insert($insertRaw);
    if ($insert === '') {
        return $article;
    }
    $insH2 = insert_first_h2($insert);
    if ($insH2 !== null) {
        $p = strpos($pre, $insH2);
        if ($p !== false) {
            $pre = substr($pre, 0, $p);
        }
    }

    return rtrim($pre)."\n".$insert."\n".$faqNeedle.$rest;
}

$base = __DIR__;
$slugs = [
    'vless-guide',
    'vless-vs-vmess',
    'bypass-blocks-2026',
    'how-dpi-works',
    'how-openai-works',
    'chatgpt-for-work',
    'best-ai-tools-2026',
    'local-llm-guide',
    'nodejs-vs-python-2026',
    'how-apis-work',
    'docker-explained-simple',
    'protect-personal-data-online',
    'what-is-vpn-why-need',
    'encryption-explained',
    'choose-vpn-server-hardware',
    'vps-how-many-users',
    'cpu-vs-ram-networking',
];

foreach ($slugs as $slug) {
    $ruPath = $base.'/articles/'.$slug.'.ru.html';
    $ruIns = $base.'/inserts_ru/'.$slug.'.html';
    if (is_file($ruPath) && is_file($ruIns)) {
        $html = (string) file_get_contents($ruPath);
        $ins = (string) file_get_contents($ruIns);
        $merged = merge_before_faq($html, '<h2>Частые вопросы</h2>', $ins);
        file_put_contents($ruPath, $merged);
        fwrite(STDOUT, "RU merged: {$slug}\n");
    }

    $enPath = $base.'/articles/'.$slug.'.en.html';
    $enIns = $base.'/inserts_en/'.$slug.'.html';
    if (is_file($enPath) && is_file($enIns)) {
        $html = (string) file_get_contents($enPath);
        $ins = (string) file_get_contents($enIns);
        $merged = merge_before_faq($html, '<h2>FAQ</h2>', $ins);
        file_put_contents($enPath, $merged);
        fwrite(STDOUT, "EN merged: {$slug}\n");
    }
}

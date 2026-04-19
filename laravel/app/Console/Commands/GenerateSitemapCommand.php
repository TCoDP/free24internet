<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Seo\SeoGenerator;
use Illuminate\Console\Command;

class GenerateSitemapCommand extends Command
{
    protected $signature = 'sitemap:generate';

    protected $description = 'Записать public/sitemap.xml из config/seo.php и APP_URL';

    public function handle(SeoGenerator $seoGenerator): int
    {
        $path = $seoGenerator->writeSitemap();
        $this->info('Sitemap: '.$path);

        return self::SUCCESS;
    }
}

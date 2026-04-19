<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Seo\SeoGenerator;
use Illuminate\Console\Command;

class GenerateSeoCommand extends Command
{
    protected $signature = 'seo:generate';

    protected $description = 'Сгенерировать sitemap.xml, robots.txt и llms.txt';

    public function handle(SeoGenerator $seoGenerator): int
    {
        $this->info('Sitemap: '.$seoGenerator->writeSitemap());
        $this->info('Robots: '.$seoGenerator->writeRobots());
        $this->info('llms.txt: '.$seoGenerator->writeLlmsTxt());

        return self::SUCCESS;
    }
}

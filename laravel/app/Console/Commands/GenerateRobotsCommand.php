<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Seo\SeoGenerator;
use Illuminate\Console\Command;

class GenerateRobotsCommand extends Command
{
    protected $signature = 'robots:generate';

    protected $description = 'Записать public/robots.txt (Disallow + Sitemap)';

    public function handle(SeoGenerator $seoGenerator): int
    {
        $path = $seoGenerator->writeRobots();
        $this->info('Robots: '.$path);

        return self::SUCCESS;
    }
}

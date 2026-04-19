<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Заполняет pricing_global и pricing_plan_terms, если таблицы пусты
 * (после migrate без данных или сбоя).
 */
class PricingDefaultsSeeder extends Seeder
{
    public function run(): void
    {
        $hasGlobal = DB::table('pricing_global')->where('id', 1)->exists();
        if (! $hasGlobal) {
            DB::table('pricing_global')->insert([
                'id' => 1,
                'base_monthly_rub' => 60,
                'trial_days' => 7,
            ]);
        }

        $terms = [
            ['months' => 12, 'discount_rate' => 0.15, 'referrer_bonus_days' => 30, 'sort_order' => 10, 'is_active' => 1],
            ['months' => 6, 'discount_rate' => 0.10, 'referrer_bonus_days' => 18, 'sort_order' => 20, 'is_active' => 1],
            ['months' => 3, 'discount_rate' => 0.05, 'referrer_bonus_days' => 12, 'sort_order' => 30, 'is_active' => 1],
            ['months' => 1, 'discount_rate' => 0, 'referrer_bonus_days' => 7, 'sort_order' => 40, 'is_active' => 1],
        ];

        foreach ($terms as $row) {
            DB::table('pricing_plan_terms')->updateOrInsert(
                ['months' => $row['months']],
                $row
            );
        }
    }
}

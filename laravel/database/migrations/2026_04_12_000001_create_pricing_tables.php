<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_global', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->unsignedInteger('base_monthly_rub')->default(60);
            $table->unsignedSmallInteger('trial_days')->default(7);
        });

        Schema::create('pricing_plan_terms', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('months')->unique();
            $table->decimal('discount_rate', 8, 5)->default(0);
            $table->unsignedSmallInteger('referrer_bonus_days')->default(7);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_plan_terms');
        Schema::dropIfExists('pricing_global');
    }
};

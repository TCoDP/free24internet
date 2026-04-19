<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'referral_code')) {
                $table->string('referral_code', 32)->nullable()->unique();
            }
            if (! Schema::hasColumn('users', 'referred_by_user_id')) {
                $table->unsignedInteger('referred_by_user_id')->nullable()->index();
            }
            if (! Schema::hasColumn('users', 'subscription_until')) {
                $table->timestamp('subscription_until')->nullable();
            }
            if (! Schema::hasColumn('users', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable();
            }
        });

        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('referrer_user_id');
            $table->unsignedInteger('referee_user_id');
            $table->unsignedTinyInteger('plan_months');
            $table->unsignedSmallInteger('bonus_days');
            $table->timestamp('created_at')->useCurrent();
            $table->index('referrer_user_id', 'idx_rr_referrer');
            $table->index('referee_user_id', 'idx_rr_referee');
        });

        Schema::create('user_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('user_id');
            $table->decimal('amount_rub', 10, 2);
            $table->unsignedTinyInteger('plan_months');
            $table->string('status', 24)->default('completed');
            $table->string('provider', 64);
            $table->string('external_payment_id', 191)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->index(['user_id', 'created_at'], 'idx_ut_user_created');
            $table->index(['provider', 'external_payment_id'], 'idx_ut_external');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_transactions');
        Schema::dropIfExists('referral_rewards');
    }
};

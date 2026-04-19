<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'is_their')) {
                $table->boolean('is_their')->default(false);
            }
            if (! Schema::hasColumn('users', 'is_admin')) {
                $table->boolean('is_admin')->default(false);
            }
            if (! Schema::hasColumn('users', 'balance')) {
                $table->integer('balance')->default(0);
            }
            if (! Schema::hasColumn('users', 'language')) {
                $table->string('language', 8)->nullable()->default('ru');
            }
        });

        Schema::create('telegram_link_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('token', 64)->unique();
            $table->unsignedBigInteger('user_id');
            $table->string('locale', 8)->default('ru');
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'used_at'], 'idx_telegram_link_user_unused');
            $table->index('expires_at', 'idx_telegram_link_expires');
        });

        Schema::create('moneta_checkout_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('mnt_transaction_id')->unique();
            $table->unsignedInteger('user_id');
            $table->string('purpose', 16)->default('plan');
            $table->unsignedTinyInteger('plan_months');
            $table->string('referral_code', 64)->nullable();
            $table->decimal('amount_rub', 10, 2);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->index('user_id', 'idx_moneta_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moneta_checkout_sessions');
        Schema::dropIfExists('telegram_link_tokens');
    }
};

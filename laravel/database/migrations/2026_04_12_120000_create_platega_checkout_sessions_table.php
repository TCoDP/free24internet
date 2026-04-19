<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platega_checkout_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('platega_transaction_id')->unique();
            $table->unsignedInteger('user_id');
            $table->string('purpose', 16)->default('plan');
            $table->unsignedTinyInteger('plan_months');
            $table->string('referral_code', 64)->nullable();
            $table->decimal('amount_rub', 10, 2);
            $table->unsignedTinyInteger('payment_method')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->index('user_id', 'idx_platega_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platega_checkout_sessions');
    }
};

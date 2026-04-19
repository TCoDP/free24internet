<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_notification_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tg_id');
            // users.id — increments() = UNSIGNED INT; тип столбца должен совпадать для FK в MySQL.
            $table->unsignedInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('kind', 64)->default('system');
            $table->string('status', 16);
            $table->text('body');
            $table->text('error')->nullable();
            $table->unsignedBigInteger('telegram_message_id')->nullable();
            $table->json('telegram_response')->nullable();
            $table->timestamps();

            $table->index('tg_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_notification_logs');
    }
};

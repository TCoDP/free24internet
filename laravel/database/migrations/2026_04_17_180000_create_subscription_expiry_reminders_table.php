<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_expiry_reminders', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('access_type', 24);
            $table->string('stage', 24);
            $table->timestamp('ends_at');
            $table->timestamps();

            $table->unique(['user_id', 'access_type', 'stage', 'ends_at'], 'sub_expiry_reminder_unique');
            $table->index(['access_type', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_expiry_reminders');
    }
};

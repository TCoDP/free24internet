<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'subscription_import_token')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('subscription_import_token', 64)->nullable()->unique()->after('remember_token');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'subscription_import_token')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['subscription_import_token']);
            $table->dropColumn('subscription_import_token');
        });
    }
};

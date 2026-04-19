<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Поля ключа 3X-UI в users (как в vpn_bot init_db). Раньше могли появляться только из бота через ALTER.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'uuid')) {
                $table->text('uuid')->nullable()->after('trial_ends_at');
            }
            if (! Schema::hasColumn('users', 'port')) {
                $table->integer('port')->nullable()->after('uuid');
            }
            if (! Schema::hasColumn('users', 'expire_time')) {
                $table->unsignedBigInteger('expire_time')->nullable()->after('port');
            }
            if (! Schema::hasColumn('users', 'short_id')) {
                $table->string('short_id', 32)->nullable()->after('expire_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['short_id', 'expire_time', 'port', 'uuid'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

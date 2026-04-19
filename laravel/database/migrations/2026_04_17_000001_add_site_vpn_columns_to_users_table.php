<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ранее планировались отдельные site_vpn_* поля — отказ: одна запись пользователя,
 * те же uuid/port/short_id/expire_time, что и у бота. Миграция только убирает
 * «теневые» колонки, если они уже успели появиться.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['site_vpn_expire_time', 'site_vpn_short_id', 'site_vpn_port', 'site_vpn_uuid'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'site_vpn_uuid')) {
                $table->string('site_vpn_uuid', 64)->nullable()->after('trial_ends_at');
            }
            if (! Schema::hasColumn('users', 'site_vpn_port')) {
                $table->unsignedInteger('site_vpn_port')->nullable()->after('site_vpn_uuid');
            }
            if (! Schema::hasColumn('users', 'site_vpn_short_id')) {
                $table->string('site_vpn_short_id', 32)->nullable()->after('site_vpn_port');
            }
            if (! Schema::hasColumn('users', 'site_vpn_expire_time')) {
                $table->unsignedBigInteger('site_vpn_expire_time')->nullable()->after('site_vpn_short_id');
            }
        });
    }
};

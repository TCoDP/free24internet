<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'panel_sub_id')) {
                $table->string('panel_sub_id', 64)->nullable()->after('expire_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'panel_sub_id')) {
                $table->dropColumn('panel_sub_id');
            }
        });
    }
};

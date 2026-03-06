<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('phone');
            $table->text('bio')->nullable()->after('avatar');
            $table->json('preferences')->nullable()->after('bio');
            // preferences shape: {"notify_email": true, "notify_sms": false, "preferred_bedrooms": null, "max_budget": null}
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'bio', 'preferences']);
        });
    }
};

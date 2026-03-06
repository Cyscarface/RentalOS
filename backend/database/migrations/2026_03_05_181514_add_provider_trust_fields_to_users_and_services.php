<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false)->after('bio');
            $table->boolean('availability_status')->default(true)->after('is_verified');
            $table->decimal('rating', 3, 2)->nullable()->after('availability_status');
        });

        // Since `services` already has a `status` string field defaulting to 'active'
        // we will just manage the states (pending, active, rejected) at the application level.
        // So no schema changes are strictly needed for `services.status` here.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_verified', 'availability_status', 'rating']);
        });

        // No changes to services in down()
    }
};

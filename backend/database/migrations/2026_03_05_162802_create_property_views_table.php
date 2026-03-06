<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->timestamp('viewed_at')->useCurrent();

            // Fast paginated "recently viewed" queries
            $table->index(['tenant_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_views');
    }
};

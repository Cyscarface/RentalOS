<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('landlord_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('county');
            $table->string('sub_county')->nullable();
            $table->string('estate')->nullable();
            $table->unsignedTinyInteger('bedrooms')->default(1);
            $table->decimal('rent_amount', 12, 2);
            $table->enum('status', ['pending', 'active', 'rejected', 'inactive'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};

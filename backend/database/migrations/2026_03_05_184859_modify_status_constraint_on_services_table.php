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
        // For SQLite, the easiest way to remove a CHECK constraint is to recreate the table
        // or just use Laravel's change() method (which works natively for enums in modern Laravel/Doctrine)
        // Note: For pure SQLite enum recreation, we use a string column without a DB-level constraint,
        // and rely on application-level logic (e.g. Model, Validation).
        
        Schema::table('services', function (Blueprint $table) {
            // Drop the old ENUM/CHECK constrained column
            $table->dropColumn('status');
        });

        Schema::table('services', function (Blueprint $table) {
            // Re-add it as a standard string to bypass SQLite's check constraint limitations
            $table->string('status')->default('pending');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        
        Schema::table('services', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active');
        });
    }
};

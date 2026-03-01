<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add performance indexes to high-traffic tables.
 * These are added as a separate migration to avoid modifying
 * original migration files which may already be deployed.
 *
 * Tables targeted:
 *   properties      — filter by county, status, bedrooms, rent_amount (common browse queries)
 *   tenant_properties — lookup by tenant + property (viewing/tenancy checks)
 *   rent_payments   — filter by tenant, status, paid_at (history + landlord summary)
 *   bookings        — filter by tenant/provider, status, scheduled_at
 *   audit_logs      — lookup by user_id and action (admin audit views)
 *   users           — lookup by role (admin user lists, role validation)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Properties ────────────────────────────────────────
        Schema::table('properties', function (Blueprint $table) {
            $table->index('county');
            $table->index('status');
            $table->index('bedrooms');
            $table->index(['status', 'county']);           // most common browse filter combo
            $table->index(['landlord_id', 'status']);      // landlord's listing management
        });

        // ── Tenant Properties (viewing / tenancy link) ────────
        Schema::table('tenant_properties', function (Blueprint $table) {
            $table->index(['tenant_id', 'property_id']);
            $table->index('status');
        });

        // ── Rent Payments ─────────────────────────────────────
        Schema::table('rent_payments', function (Blueprint $table) {
            $table->index('tenant_id');
            $table->index(['tenant_id', 'status']);        // payment history filter
            $table->index('paid_at');
        });

        // ── Bookings ──────────────────────────────────────────
        Schema::table('bookings', function (Blueprint $table) {
            $table->index('scheduled_at');
            $table->index(['tenant_id', 'status']);        // tenant's booking history filter
            $table->index(['provider_id', 'status']);      // provider queue filter
        });

        // ── Users ─────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');                         // admin role-based lookups
            $table->index('is_suspended');                 // suspended user checks
        });

        // NOTE: audit_logs already has indexes on (entity_type, entity_id) and (action)
        // from its original migration. No additional indexes needed there.
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex(['county']);
            $table->dropIndex(['status']);
            $table->dropIndex(['bedrooms']);
            $table->dropIndex(['status', 'county']);
            $table->dropIndex(['landlord_id', 'status']);
        });

        Schema::table('tenant_properties', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'property_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('rent_payments', function (Blueprint $table) {
            $table->dropIndex(['tenant_id']);
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropIndex(['paid_at']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['scheduled_at']);
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropIndex(['provider_id', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['is_suspended']);
        });
    }
};

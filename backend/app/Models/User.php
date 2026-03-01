<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    // Role constants
    const ROLE_TENANT   = 'tenant';
    const ROLE_LANDLORD = 'landlord';
    const ROLE_PROVIDER = 'provider';
    const ROLE_ADMIN    = 'admin';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'password',
        'otp',
        'otp_expires_at',
        'is_suspended',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'otp_expires_at'    => 'datetime',
            'password'          => 'hashed',
            'is_suspended'      => 'boolean',
        ];
    }

    // -------------------------------------------------------
    // Role helpers
    // -------------------------------------------------------

    public function isAdmin(): bool    { return $this->role === self::ROLE_ADMIN; }
    public function isLandlord(): bool { return $this->role === self::ROLE_LANDLORD; }
    public function isTenant(): bool   { return $this->role === self::ROLE_TENANT; }
    public function isProvider(): bool { return $this->role === self::ROLE_PROVIDER; }

    // -------------------------------------------------------
    // Relationships
    // -------------------------------------------------------

    /** Properties listed by this landlord */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'landlord_id');
    }

    /** Tenancy link records for this tenant */
    public function tenantProperties(): HasMany
    {
        return $this->hasMany(TenantProperty::class, 'tenant_id');
    }

    /** Rent payments made by this tenant */
    public function rentPayments(): HasMany
    {
        return $this->hasMany(RentPayment::class, 'tenant_id');
    }

    /** Rent payments received as a landlord */
    public function receivedRentPayments(): HasMany
    {
        return $this->hasMany(RentPayment::class, 'landlord_id');
    }

    /** Services offered by this provider */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'provider_id');
    }

    /** Bookings made by this tenant */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'tenant_id');
    }

    /** Bookings received as a provider */
    public function providerBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'provider_id');
    }

    /** Messages sent by this user */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /** Messages received by this user */
    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    /** Reviews written by this user */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    /** Reviews received as a provider */
    public function providerReviews(): HasMany
    {
        return $this->hasMany(Review::class, 'provider_id');
    }

    /** Audit log entries for this user */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }
}

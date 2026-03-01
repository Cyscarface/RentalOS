<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    // Status constants
    const STATUS_PENDING   = 'pending';
    const STATUS_ACCEPTED  = 'accepted';
    const STATUS_DECLINED  = 'declined';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'tenant_id',
        'service_id',
        'provider_id',
        'notes',
        'scheduled_at',
        'status',
        'commission_amount',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at'     => 'datetime',
            'completed_at'     => 'datetime',
            'commission_amount' => 'decimal:2',
        ];
    }

    // -------------------------------------------------------
    // Relationships
    // -------------------------------------------------------

    /** Tenant who made the booking */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    /** The service being booked */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /** The provider fulfilling the booking */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    /** Review left for this booking (one-to-one) */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantProperty extends Model
{
    use HasFactory;

    // Status constants
    const STATUS_VIEWING_REQUESTED = 'viewing_requested';
    const STATUS_ACTIVE            = 'active';
    const STATUS_ENDED             = 'ended';

    protected $fillable = [
        'tenant_id',
        'property_id',
        'status',
        'viewing_scheduled_at',
        'move_in_date',
        'move_out_date',
    ];

    protected function casts(): array
    {
        return [
            'viewing_scheduled_at' => 'datetime',
            'move_in_date'         => 'datetime',
            'move_out_date'        => 'datetime',
        ];
    }

    // -------------------------------------------------------
    // Relationships
    // -------------------------------------------------------

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}

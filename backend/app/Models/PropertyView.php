<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyView extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'viewed_at',
    ];

    protected function casts(): array
    {
        return [
            'viewed_at' => 'datetime',
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

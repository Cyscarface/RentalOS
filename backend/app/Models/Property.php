<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    use HasFactory;

    // Status constants
    const STATUS_PENDING  = 'pending';
    const STATUS_ACTIVE   = 'active';
    const STATUS_REJECTED = 'rejected';
    const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'landlord_id',
        'title',
        'description',
        'county',
        'sub_county',
        'estate',
        'bedrooms',
        'rent_amount',
        'status',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'rent_amount' => 'decimal:2',
            'bedrooms'    => 'integer',
        ];
    }

    // -------------------------------------------------------
    // Relationships
    // -------------------------------------------------------

    /** The landlord who owns this listing */
    public function landlord(): BelongsTo
    {
        return $this->belongsTo(User::class, 'landlord_id');
    }

    /** Images attached to this listing */
    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class);
    }

    /** Primary image shortcut */
    public function primaryImage(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->where('is_primary', true);
    }

    /** Tenant-property link records */
    public function tenantProperties(): HasMany
    {
        return $this->hasMany(TenantProperty::class);
    }

    /** Rent payment records for this property */
    public function rentPayments(): HasMany
    {
        return $this->hasMany(RentPayment::class);
    }

    // -------------------------------------------------------
    // Accessors
    // -------------------------------------------------------

    /** 
     * Get the primary image URL directly on the property object.
     * Helpful for frontend list views that expect property.image_url
     */
    public function getImageUrlAttribute(): ?string
    {
        $primary = $this->images->firstWhere('is_primary', true) ?? $this->images->first();
        return $primary ? $primary->url : null;
    }

    protected $appends = ['image_url'];
}

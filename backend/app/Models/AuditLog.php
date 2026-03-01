<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'meta',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    // -------------------------------------------------------
    // Factory helper — record an event from anywhere
    // -------------------------------------------------------

    /**
     * Quick static method to log an action.
     *
     * Usage: AuditLog::record('payment.completed', $payment, ['amount' => 5000]);
     */
    public static function record(
        string $action,
        Model $entity,
        array $meta = [],
        ?int $userId = null,
        ?string $ip = null
    ): self {
        return self::create([
            'user_id'     => $userId ?? auth()->id(),
            'action'      => $action,
            'entity_type' => class_basename($entity),
            'entity_id'   => $entity->getKey(),
            'meta'        => $meta,
            'ip_address'  => $ip ?? request()->ip(),
        ]);
    }

    // -------------------------------------------------------
    // Relationships
    // -------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

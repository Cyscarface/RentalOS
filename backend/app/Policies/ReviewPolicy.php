<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ReviewPolicy
{
    use HandlesAuthorization;

    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) return true;
        return null;
    }

    /**
     * Only the tenant of a COMPLETED booking may submit a review,
     * and only once (DB unique constraint is the hard stop).
     */
    public function create(User $user, Booking $booking): bool
    {
        return $booking->tenant_id === $user->id
            && $booking->status === \App\Models\Booking::STATUS_COMPLETED;
    }
}

<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BookingPolicy
{
    use HandlesAuthorization;

    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) return true;
        return null;
    }

    /** Only the provider assigned to this booking */
    public function accept(User $user, Booking $booking): bool
    {
        return $booking->provider_id === $user->id;
    }

    public function decline(User $user, Booking $booking): bool
    {
        return $booking->provider_id === $user->id;
    }

    public function complete(User $user, Booking $booking): bool
    {
        return $booking->provider_id === $user->id;
    }

    /** Only the tenant who made the booking */
    public function cancel(User $user, Booking $booking): bool
    {
        return $booking->tenant_id === $user->id;
    }
}

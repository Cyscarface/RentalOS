<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PropertyPolicy
{
    use HandlesAuthorization;

    /** Admins bypass all checks */
    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) return true;
        return null;
    }

    /** View any property detail (landlords can see their own pending/rejected too) */
    public function view(User $user, Property $property): bool
    {
        return $property->status === Property::STATUS_ACTIVE
            || $property->landlord_id === $user->id;
    }

    /** Only the landlord who owns it */
    public function update(User $user, Property $property): bool
    {
        return $user->isLandlord() && $property->landlord_id === $user->id;
    }

    public function delete(User $user, Property $property): bool
    {
        return $user->isLandlord() && $property->landlord_id === $user->id;
    }

    /** Only admins (handled by before()) */
    public function approve(User $user, Property $property): bool
    {
        return false;
    }

    public function reject(User $user, Property $property): bool
    {
        return false;
    }
}

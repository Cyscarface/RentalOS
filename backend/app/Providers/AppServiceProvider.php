<?php

namespace App\Providers;

use App\Models\Booking;
use App\Models\Property;
use App\Models\Review;
use App\Policies\BookingPolicy;
use App\Policies\PropertyPolicy;
use App\Policies\ReviewPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     */
    protected $policies = [
        Property::class => PropertyPolicy::class,
        Booking::class  => BookingPolicy::class,
        Review::class   => ReviewPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerPolicies();
        \Laravel\Mcp\Facades\Mcp::local('rentalos', \App\Mcp\Servers\RentalOs::class);
    }
}

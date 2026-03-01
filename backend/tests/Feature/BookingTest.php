<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Property;
use App\Models\Review;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    private function makeUsers(): array
    {
        return [
            'tenant'   => User::factory()->create(['role' => 'tenant',   'email_verified_at' => now()]),
            'provider' => User::factory()->create(['role' => 'provider', 'email_verified_at' => now()]),
            'other'    => User::factory()->create(['role' => 'provider', 'email_verified_at' => now()]),
        ];
    }

    private function service(User $provider): Service
    {
        return Service::create([
            'provider_id' => $provider->id,
            'title'       => 'Plumbing',
            'category'    => 'plumbing',
            'base_price'  => 2000,
            'status'      => Service::STATUS_ACTIVE,
        ]);
    }

    // -------------------------------------------------------
    // Create Booking
    // -------------------------------------------------------

    public function test_tenant_can_book_a_service(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);

        $this->actingAs($tenant)
             ->postJson('/api/bookings', [
                 'service_id'   => $service->id,
                 'scheduled_at' => now()->addDays(2)->toDateTimeString(),
             ])
             ->assertStatus(201)
             ->assertJsonPath('data.status', Booking::STATUS_PENDING);

        $this->assertDatabaseHas('bookings', [
            'tenant_id'   => $tenant->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_PENDING,
        ]);
    }

    public function test_booking_calculates_5_percent_commission(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);  // base_price = 2000

        $this->actingAs($tenant)
             ->postJson('/api/bookings', [
                 'service_id'   => $service->id,
                 'scheduled_at' => now()->addDays(1)->toDateTimeString(),
             ])
             ->assertStatus(201);

        $this->assertDatabaseHas('bookings', ['commission_amount' => '100.00']); // 5% of 2000
    }

    public function test_provider_cannot_create_booking(): void
    {
        ['provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);

        $this->actingAs($provider)
             ->postJson('/api/bookings', [
                 'service_id'   => $service->id,
                 'scheduled_at' => now()->addDays(1)->toDateTimeString(),
             ])
             ->assertStatus(403);
    }

    // -------------------------------------------------------
    // Accept / Decline / Complete workflow
    // -------------------------------------------------------

    public function test_provider_can_accept_booking(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);
        $booking = Booking::create([
            'tenant_id'   => $tenant->id,
            'service_id'  => $service->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_PENDING,
            'commission_amount' => 100,
        ]);

        $this->actingAs($provider)
             ->postJson("/api/bookings/{$booking->id}/accept")
             ->assertOk();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => Booking::STATUS_ACCEPTED]);
    }

    public function test_wrong_provider_cannot_accept_booking(): void
    {
        ['tenant' => $tenant, 'provider' => $provider, 'other' => $other] = $this->makeUsers();
        $service = $this->service($provider);
        $booking = Booking::create([
            'tenant_id'   => $tenant->id,
            'service_id'  => $service->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_PENDING,
            'commission_amount' => 100,
        ]);

        $this->actingAs($other)
             ->postJson("/api/bookings/{$booking->id}/accept")
             ->assertStatus(403);
    }

    public function test_provider_can_complete_accepted_booking(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);
        $booking = Booking::create([
            'tenant_id'   => $tenant->id,
            'service_id'  => $service->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_ACCEPTED,
            'commission_amount' => 100,
        ]);

        $this->actingAs($provider)
             ->postJson("/api/bookings/{$booking->id}/complete")
             ->assertOk();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => Booking::STATUS_COMPLETED]);
        $this->assertNotNull(Booking::find($booking->id)->completed_at);
    }

    public function test_cannot_complete_a_pending_booking_directly(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);
        $booking = Booking::create([
            'tenant_id'   => $tenant->id,
            'service_id'  => $service->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_PENDING,
            'commission_amount' => 100,
        ]);

        $this->actingAs($provider)
             ->postJson("/api/bookings/{$booking->id}/complete")
             ->assertStatus(409);
    }

    // -------------------------------------------------------
    // Reviews (post-booking)
    // -------------------------------------------------------

    public function test_tenant_can_review_completed_booking(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);
        $booking = Booking::create([
            'tenant_id'   => $tenant->id,
            'service_id'  => $service->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_COMPLETED,
            'commission_amount' => 100,
            'completed_at' => now(),
        ]);

        $this->actingAs($tenant)
             ->postJson('/api/reviews', [
                 'booking_id' => $booking->id,
                 'rating'     => 5,
                 'comment'    => 'Excellent work!',
             ])
             ->assertStatus(201)
             ->assertJsonPath('data.rating', 5);

        $this->assertDatabaseHas('reviews', [
            'booking_id'  => $booking->id,
            'reviewer_id' => $tenant->id,
            'rating'      => 5,
        ]);
    }

    public function test_tenant_cannot_review_pending_booking(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);
        $booking = Booking::create([
            'tenant_id'   => $tenant->id,
            'service_id'  => $service->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_PENDING,
            'commission_amount' => 100,
        ]);

        $this->actingAs($tenant)
             ->postJson('/api/reviews', ['booking_id' => $booking->id, 'rating' => 4])
             ->assertStatus(422);
    }

    public function test_duplicate_review_is_rejected(): void
    {
        ['tenant' => $tenant, 'provider' => $provider] = $this->makeUsers();
        $service = $this->service($provider);
        $booking = Booking::create([
            'tenant_id'   => $tenant->id,
            'service_id'  => $service->id,
            'provider_id' => $provider->id,
            'status'      => Booking::STATUS_COMPLETED,
            'commission_amount' => 100,
            'completed_at' => now(),
        ]);

        Review::create([
            'reviewer_id' => $tenant->id,
            'booking_id'  => $booking->id,
            'provider_id' => $provider->id,
            'rating'      => 3,
        ]);

        $this->actingAs($tenant)
             ->postJson('/api/reviews', ['booking_id' => $booking->id, 'rating' => 5])
             ->assertStatus(409);
    }
}

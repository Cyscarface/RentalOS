<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\RentPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function landlord(): User
    {
        return User::factory()->create(['role' => 'landlord', 'email_verified_at' => now()]);
    }

    private function tenant(): User
    {
        return User::factory()->create(['role' => 'tenant', 'email_verified_at' => now()]);
    }

    private function property(User $landlord): Property
    {
        return Property::create([
            'landlord_id' => $landlord->id,
            'title'       => 'Test Apartment',
            'county'      => 'Nairobi',
            'bedrooms'    => 2,
            'rent_amount' => 25000,
            'status'      => Property::STATUS_ACTIVE,
        ]);
    }

    // -------------------------------------------------------
    // Payment History
    // -------------------------------------------------------

    public function test_tenant_can_view_payment_history(): void
    {
        $tenant   = $this->tenant();
        $landlord = $this->landlord();
        $property = $this->property($landlord);

        RentPayment::create([
            'tenant_id'   => $tenant->id,
            'landlord_id' => $landlord->id,
            'property_id' => $property->id,
            'amount'      => 25000,
            'status'      => RentPayment::STATUS_COMPLETED,
            'paid_at'     => now(),
        ]);

        $this->actingAs($tenant)
             ->getJson('/api/payments/history')
             ->assertOk()
             ->assertJsonPath('data.data.0.amount', '25000.00');
    }

    public function test_unauthenticated_user_cannot_view_history(): void
    {
        $this->getJson('/api/payments/history')->assertUnauthorized();
    }

    // -------------------------------------------------------
    // Landlord Summary
    // -------------------------------------------------------

    public function test_landlord_can_view_payment_summary(): void
    {
        $landlord = $this->landlord();
        $tenant   = $this->tenant();
        $property = $this->property($landlord);

        RentPayment::create([
            'tenant_id'   => $tenant->id,
            'landlord_id' => $landlord->id,
            'property_id' => $property->id,
            'amount'      => 30000,
            'status'      => RentPayment::STATUS_COMPLETED,
            'paid_at'     => now(),
        ]);

        $this->actingAs($landlord)
             ->getJson('/api/payments/landlord/summary')
             ->assertOk()
             ->assertJsonPath('data.total_received', 30000);
    }

    public function test_tenant_cannot_access_landlord_summary(): void
    {
        $tenant = $this->tenant();
        $this->actingAs($tenant)
             ->getJson('/api/payments/landlord/summary')
             ->assertStatus(403);
    }

    // -------------------------------------------------------
    // M-Pesa Callback
    // -------------------------------------------------------

    public function test_mpesa_callback_marks_payment_completed(): void
    {
        $landlord = $this->landlord();
        $tenant   = $this->tenant();
        $property = $this->property($landlord);

        $payment = RentPayment::create([
            'tenant_id'           => $tenant->id,
            'landlord_id'         => $landlord->id,
            'property_id'         => $property->id,
            'amount'              => 25000,
            'status'              => RentPayment::STATUS_PENDING,
            'checkout_request_id' => 'ws_CO_123456789',
        ]);

        $this->postJson('/api/payments/callback', [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'ws_CO_123456789',
                    'ResultCode'        => 0,
                    'ResultDesc'        => 'The service request is processed successfully.',
                    'CallbackMetadata'  => [
                        'Item' => [
                            ['Name' => 'Amount',             'Value' => 25000],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'QGH2WE3RPK'],
                            ['Name' => 'TransactionDate',    'Value' => 20260228123000],
                            ['Name' => 'PhoneNumber',        'Value' => 254712345678],
                        ],
                    ],
                ],
            ],
        ])->assertOk()->assertJsonPath('ResultCode', 0);

        $this->assertDatabaseHas('rent_payments', [
            'id'              => $payment->id,
            'status'          => RentPayment::STATUS_COMPLETED,
            'mpesa_reference' => 'QGH2WE3RPK',
        ]);
    }

    public function test_mpesa_callback_marks_payment_failed(): void
    {
        $landlord = $this->landlord();
        $tenant   = $this->tenant();
        $property = $this->property($landlord);

        $payment = RentPayment::create([
            'tenant_id'           => $tenant->id,
            'landlord_id'         => $landlord->id,
            'property_id'         => $property->id,
            'amount'              => 25000,
            'status'              => RentPayment::STATUS_PENDING,
            'checkout_request_id' => 'ws_CO_FAILED_001',
        ]);

        $this->postJson('/api/payments/callback', [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'ws_CO_FAILED_001',
                    'ResultCode'        => 1032,
                    'ResultDesc'        => 'Request cancelled by user.',
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('rent_payments', [
            'id'     => $payment->id,
            'status' => RentPayment::STATUS_FAILED,
        ]);
    }

    public function test_callback_with_unknown_checkout_id_is_gracefully_ignored(): void
    {
        $this->postJson('/api/payments/callback', [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'ws_CO_NONEXISTENT',
                    'ResultCode'        => 0,
                ],
            ],
        ])->assertOk();
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\BookingRequest;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Service;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    // -------------------------------------------------------
    // POST /api/bookings  (tenant)
    // -------------------------------------------------------
    public function store(BookingRequest $request): JsonResponse
    {
        $service = Service::findOrFail($request->service_id);

        // Prevent a tenant from booking their own service
        if ($service->provider_id === $request->user()->id) {
            return $this->forbidden('You cannot book your own service.');
        }

        // Prevent duplicate active bookings for the same service+tenant on same date
        $duplicate = Booking::where('tenant_id', $request->user()->id)
            ->where('service_id', $service->id)
            ->whereDate('scheduled_at', date('Y-m-d', strtotime($request->scheduled_at)))
            ->whereNotIn('status', [Booking::STATUS_DECLINED, Booking::STATUS_CANCELLED])
            ->exists();

        if ($duplicate) {
            return $this->error('You already have an active booking for this service on that date.', null, 409);
        }

        // 5% platform commission
        $commission = round($service->base_price * 0.05, 2);

        $booking = Booking::create([
            'tenant_id'         => $request->user()->id,
            'service_id'        => $service->id,
            'provider_id'       => $service->provider_id,
            'scheduled_at'      => $request->scheduled_at,
            'notes'             => $request->notes,
            'status'            => Booking::STATUS_PENDING,
            'commission_amount' => $commission,
        ]);

        AuditLog::record('booking.created', $booking, ['service' => $service->title]);

        return $this->created(
            $booking->load('service', 'provider:id,name,phone'),
            'Booking created successfully.'
        );
    }

    // -------------------------------------------------------
    // GET /api/bookings/my  (tenant)
    // -------------------------------------------------------
    public function myBookings(Request $request): JsonResponse
    {
        $bookings = $request->user()
            ->bookings()
            ->with('service', 'provider:id,name,phone', 'review')
            ->latest()
            ->paginate(15);

        return $this->success($bookings);
    }

    // -------------------------------------------------------
    // GET /api/bookings/provider  (provider)
    // -------------------------------------------------------
    public function providerBookings(Request $request): JsonResponse
    {
        $bookings = $request->user()
            ->providerBookings()
            ->with('service', 'tenant:id,name,phone')
            ->latest()
            ->paginate(15);

        return $this->success($bookings);
    }

    // -------------------------------------------------------
    // POST /api/bookings/{id}/accept  (provider)
    // -------------------------------------------------------
    public function accept(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('accept', $booking);

        if ($booking->status !== Booking::STATUS_PENDING) {
            return $this->error('Booking cannot be accepted in its current state.', null, 409);
        }

        $booking->update(['status' => Booking::STATUS_ACCEPTED]);
        AuditLog::record('booking.accepted', $booking);

        // Notify the tenant
        NotificationService::bookingConfirmed(
            $booking->tenant,
            $booking->service->title,
            $booking->id
        );

        return $this->success($booking, 'Booking accepted.');
    }

    // -------------------------------------------------------
    // POST /api/bookings/{id}/decline  (provider)
    // -------------------------------------------------------
    public function decline(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('decline', $booking);

        $booking->update(['status' => Booking::STATUS_DECLINED]);
        AuditLog::record('booking.declined', $booking);

        // Notify the tenant
        NotificationService::bookingDeclined(
            $booking->tenant,
            $booking->service->title,
            $booking->id
        );

        return $this->success(null, 'Booking declined.');
    }

    // -------------------------------------------------------
    // POST /api/bookings/{id}/complete  (provider)
    // -------------------------------------------------------
    public function complete(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('complete', $booking);

        if ($booking->status !== Booking::STATUS_ACCEPTED) {
            return $this->error('Only accepted bookings can be marked complete.', null, 409);
        }

        $booking->update([
            'status'       => Booking::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        AuditLog::record('booking.completed', $booking, [
            'commission' => $booking->commission_amount,
        ]);

        // Notify the tenant they can now leave a review
        NotificationService::bookingCompleted(
            $booking->tenant,
            $booking->service->title,
            $booking->id
        );

        return $this->success($booking, 'Booking marked as complete.');
    }
}

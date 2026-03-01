<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // -------------------------------------------------------
    // POST /api/reviews  (tenant — only after completed booking)
    // -------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'rating'     => ['required', 'integer', 'min:1', 'max:5'],
            'comment'    => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = Booking::findOrFail($data['booking_id']);

        // Must be the tenant of this booking
        if ($booking->tenant_id !== $request->user()->id) {
            return $this->forbidden('You are not authorized to review this booking.');
        }

        // Booking must be completed
        if ($booking->status !== Booking::STATUS_COMPLETED) {
            return $this->error('You can only review a completed booking.', null, 422);
        }

        // Prevent duplicate review
        if ($booking->review()->exists()) {
            return $this->error('You have already reviewed this booking.', null, 409);
        }

        $review = Review::create([
            'reviewer_id' => $request->user()->id,
            'booking_id'  => $booking->id,
            'provider_id' => $booking->provider_id,
            'rating'      => $data['rating'],
            'comment'     => isset($data['comment']) ? strip_tags($data['comment']) : null,
        ]);

        AuditLog::record('review.submitted', $review, ['rating' => $review->rating]);

        return $this->created($review->load('reviewer:id,name'), 'Review submitted successfully.');
    }

    // -------------------------------------------------------
    // GET /api/reviews/provider/{id}  (public)
    // -------------------------------------------------------
    public function providerReviews(int $providerId): JsonResponse
    {
        $reviews = Review::where('provider_id', $providerId)
            ->with('reviewer:id,name', 'booking:id,scheduled_at')
            ->latest()
            ->paginate(15);

        $average = Review::where('provider_id', $providerId)->avg('rating');

        return $this->success([
            'provider_id'    => $providerId,
            'average_rating' => round((float) $average, 1),
            'reviews'        => $reviews,
        ]);
    }
}

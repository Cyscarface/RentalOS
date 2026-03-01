<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
    /**
     * Send a notification to a specific user.
     */
    public static function send(User $user, string $type, string $title, string $body, array $data = []): AppNotification
    {
        return AppNotification::create([
            'user_id' => $user->id,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => $data ?: null,
        ]);
    }

    // -------------------------------------------------------
    // Convenience methods for each event type
    // -------------------------------------------------------

    public static function paymentSuccess(User $tenant, float $amount, int $propertyId): void
    {
        self::send(
            $tenant,
            'payment_success',
            'Payment Received ✅',
            "Your rent payment of KSh " . number_format($amount) . " was processed successfully.",
            ['property_id' => $propertyId]
        );
    }

    public static function bookingConfirmed(User $tenant, string $serviceTitle, int $bookingId): void
    {
        self::send(
            $tenant,
            'booking_confirmed',
            'Booking Confirmed 🎉',
            "Your booking for \"{$serviceTitle}\" has been confirmed by the provider.",
            ['booking_id' => $bookingId]
        );
    }

    public static function bookingDeclined(User $tenant, string $serviceTitle, int $bookingId): void
    {
        self::send(
            $tenant,
            'booking_declined',
            'Booking Declined',
            "Your booking for \"{$serviceTitle}\" was declined by the provider.",
            ['booking_id' => $bookingId]
        );
    }

    public static function bookingCompleted(User $tenant, string $serviceTitle, int $bookingId): void
    {
        self::send(
            $tenant,
            'booking_completed',
            'Service Completed ✅',
            "\"{$serviceTitle}\" has been marked as complete. You can now leave a review.",
            ['booking_id' => $bookingId]
        );
    }

    public static function newMessage(User $recipient, string $senderName): void
    {
        self::send(
            $recipient,
            'new_message',
            'New Message 💬',
            "You have a new message from {$senderName}.",
            []
        );
    }

    public static function viewingApproved(User $tenant, string $propertyTitle, int $propertyId): void
    {
        self::send(
            $tenant,
            'viewing_approved',
            'Viewing Request Approved 🏠',
            "Your viewing request for \"{$propertyTitle}\" has been approved.",
            ['property_id' => $propertyId]
        );
    }

    public static function propertyApproved(User $landlord, string $propertyTitle, int $propertyId): void
    {
        self::send(
            $landlord,
            'property_approved',
            'Property Approved ✅',
            "Your property \"{$propertyTitle}\" has been approved and is now visible to tenants.",
            ['property_id' => $propertyId]
        );
    }

    public static function propertyRejected(User $landlord, string $propertyTitle, string $reason): void
    {
        self::send(
            $landlord,
            'property_rejected',
            'Property Rejected',
            "Your property \"{$propertyTitle}\" was rejected. Reason: {$reason}",
            []
        );
    }
}

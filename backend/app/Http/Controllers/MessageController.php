<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Message;
use App\Models\TenantProperty;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // -------------------------------------------------------
    // GET /api/messages/conversations  (any auth user)
    // -------------------------------------------------------
    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $conversations = Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->with('sender:id,name,role', 'receiver:id,name,role')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy(fn ($msg) => $msg->sender_id === $userId
                ? $msg->receiver_id
                : $msg->sender_id
            )
            ->map(fn ($msgs) => [
                'contact'      => $msgs->first()->sender_id === $userId
                    ? $msgs->first()->receiver
                    : $msgs->first()->sender,
                'last_message' => $msgs->first(),
                'unread_count' => $msgs->where('receiver_id', $userId)->whereNull('read_at')->count(),
            ])
            ->values();

        return $this->success($conversations);
    }

    // -------------------------------------------------------
    // GET /api/messages/conversations/{userId}  (any auth user)
    // Security: user can only read threads they are part of.
    // -------------------------------------------------------
    public function thread(Request $request, int $userId): JsonResponse
    {
        $authId = $request->user()->id;

        if ($authId === $userId) {
            return $this->error('Cannot view a conversation with yourself.', null, 400);
        }

        // Verify a legitimate relationship exists before showing the thread
        if (! $this->hasRelationship($authId, $userId)) {
            return $this->forbidden('You are not authorised to view this conversation.');
        }

        $messages = Message::where(function ($q) use ($authId, $userId) {
            $q->where('sender_id', $authId)->where('receiver_id', $userId);
        })->orWhere(function ($q) use ($authId, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $authId);
        })
        ->orderBy('created_at')
        ->paginate(50);

        // Mark received messages as read
        Message::where('sender_id', $userId)
            ->where('receiver_id', $authId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->success($messages);
    }

    // -------------------------------------------------------
    // POST /api/messages/send  (any auth user)
    // -------------------------------------------------------
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'receiver_id' => ['required', 'integer', 'exists:users,id', 'different:' . $request->user()->id],
            'body'        => ['required', 'string', 'max:2000'],
        ]);

        // Verify a legitimate relationship exists before allowing the message
        if (! $this->hasRelationship($request->user()->id, $data['receiver_id'])) {
            return $this->forbidden('You can only message users you have an established relationship with.');
        }

        $message = Message::create([
            'sender_id'   => $request->user()->id,
            'receiver_id' => $data['receiver_id'],
            'body'        => strip_tags($data['body']),  // XSS prevention
        ]);

        $message->load('sender:id,name,role');

        // Notify recipient
        $recipient = User::find($data['receiver_id']);
        if ($recipient) {
            NotificationService::newMessage($recipient, $request->user()->name);
        }

        return $this->created($message, 'Message sent.');
    }

    // -------------------------------------------------------
    // Relationship guard
    // Returns true if there is a legitimate connection between
    // the two users (tenant↔landlord via tenancy, or tenant↔provider via booking).
    // Admins can message anyone.
    // -------------------------------------------------------
    private function hasRelationship(int $userAId, int $userBId): bool
    {
        $userA = User::find($userAId);
        $userB = User::find($userBId);

        // Admins bypass all checks
        if ($userA?->isAdmin() || $userB?->isAdmin()) {
            return true;
        }

        // tenant ↔ landlord: shared tenant_property record establishes the link
        $tenantLandlordLink = TenantProperty::join('properties', 'tenant_properties.property_id', '=', 'properties.id')
            ->where(function ($q) use ($userAId, $userBId) {
                $q->where('tenant_properties.tenant_id', $userAId)
                  ->where('properties.landlord_id', $userBId);
            })
            ->orWhere(function ($q) use ($userAId, $userBId) {
                $q->where('tenant_properties.tenant_id', $userBId)
                  ->where('properties.landlord_id', $userAId);
            })
            ->exists();

        if ($tenantLandlordLink) {
            return true;
        }

        // tenant ↔ provider: shared non-cancelled booking establishes the link
        $tenantProviderLink = Booking::where(function ($q) use ($userAId, $userBId) {
            $q->where('tenant_id', $userAId)->where('provider_id', $userBId);
        })->orWhere(function ($q) use ($userAId, $userBId) {
            $q->where('tenant_id', $userBId)->where('provider_id', $userAId);
        })
        ->whereNotIn('status', ['declined', 'cancelled'])
        ->exists();

        return $tenantProviderLink;
    }
}

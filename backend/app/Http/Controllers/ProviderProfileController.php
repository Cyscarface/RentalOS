<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProviderProfileController extends Controller
{
    use ApiResponse;

    // -------------------------------------------------------
    // GET /provider/profile
    // -------------------------------------------------------
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        // Calculate provider-specific stats
        $services = $user->services()->get();
        $totalServices = $services->count();
        $activeServices = $services->where('status', 'active')->count();
        
        $bookings = $user->providerBookings()->get();
        $completedBookings = $bookings->where('status', 'completed')->count();

        return $this->success([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'avatar'      => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'bio'         => $user->bio,
            
            // Trust & Availability Fields
            'is_verified'         => (bool) $user->is_verified,
            'availability_status' => (bool) $user->availability_status,
            'rating'              => $user->rating,
            
            'preferences' => $user->preferences ?? [
                'notify_email' => true,
                'notify_sms'   => false,
            ],
            'stats' => [
                'total_services'     => $totalServices,
                'active_services'    => $activeServices,
                'completed_bookings' => $completedBookings,
            ],
            'created_at' => $user->created_at,
        ]);
    }

    // -------------------------------------------------------
    // PUT /provider/profile
    // -------------------------------------------------------
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'                => 'sometimes|string|max:255',
            'bio'                 => 'sometimes|nullable|string|max:1000',
            'availability_status' => 'sometimes|boolean',
            'preferences'         => 'sometimes|array',
            'preferences.notify_email' => 'sometimes|boolean',
            'preferences.notify_sms'   => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $data = $validator->validated();

        if (isset($data['preferences'])) {
            $data['preferences'] = array_merge(
                $user->preferences ?? [],
                $data['preferences']
            );
        }

        $user->update($data);

        return $this->success($user->fresh(), 'Profile updated successfully.');
    }

    // -------------------------------------------------------
    // POST /provider/profile/avatar
    // -------------------------------------------------------
    public function uploadAvatar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');
        $user->update(['avatar' => $path]);

        return $this->success([
            'avatar_url' => asset('storage/' . $path),
        ], 'Avatar uploaded successfully.');
    }
}

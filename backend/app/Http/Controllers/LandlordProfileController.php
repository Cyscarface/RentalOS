<?php

namespace App\Http\Controllers;

use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LandlordProfileController extends Controller
{
    use ApiResponse;

    // -------------------------------------------------------
    // GET /landlord/profile
    // -------------------------------------------------------
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        // Property stats for the landlord profile
        $properties   = $user->properties()->withCount('tenantProperties')->get();
        $totalProps   = $properties->count();
        $activeProps  = $properties->where('status', 'active')->count();
        $pendingProps = $properties->where('status', 'pending')->count();

        return $this->success([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'avatar'      => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'bio'         => $user->bio,
            'preferences' => $user->preferences ?? [
                'notify_email'    => true,
                'notify_sms'      => false,
                'auto_approve_viewings' => false,
            ],
            'stats' => [
                'total_properties'  => $totalProps,
                'active_properties' => $activeProps,
                'pending_properties'=> $pendingProps,
                'total_tenants'     => $properties->sum('tenant_properties_count'),
            ],
            'created_at' => $user->created_at,
        ]);
    }

    // -------------------------------------------------------
    // PUT /landlord/profile
    // -------------------------------------------------------
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'                              => 'sometimes|string|max:255',
            'bio'                               => 'sometimes|nullable|string|max:1000',
            'preferences'                       => 'sometimes|array',
            'preferences.notify_email'          => 'sometimes|boolean',
            'preferences.notify_sms'            => 'sometimes|boolean',
            'preferences.auto_approve_viewings' => 'sometimes|boolean',
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
    // POST /landlord/profile/avatar
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
        $oldAvatar = $user->avatar;

        $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');

        try {
            $user->update(['avatar' => $path]);

            if ($oldAvatar && Storage::disk('public')->exists($oldAvatar)) {
                Storage::disk('public')->delete($oldAvatar);
            }

            return $this->success([
                'avatar_url' => asset('storage/' . $path),
            ], 'Avatar uploaded successfully.');
        } catch (\Exception $e) {
            Storage::disk('public')->delete($path);
            return $this->error('Failed to update avatar.', 500);
        }
    }
}

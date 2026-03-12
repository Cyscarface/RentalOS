<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\PropertyView;
use App\Models\TenantProperty;
use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class TenantProfileController extends Controller
{
    use ApiResponse;

    // -------------------------------------------------------
    // GET /tenant/profile
    // -------------------------------------------------------
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load([]);

        return $this->success([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'avatar'      => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'bio'         => $user->bio,
            'preferences' => $user->preferences ?? [
                'notify_email'        => true,
                'notify_sms'          => false,
                'preferred_bedrooms'  => null,
                'max_budget'          => null,
            ],
            'is_suspended'  => $user->is_suspended,
            'created_at'    => $user->created_at,
        ]);
    }

    // -------------------------------------------------------
    // PUT /tenant/profile
    // -------------------------------------------------------
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'                          => 'sometimes|string|max:255',
            'bio'                           => 'sometimes|nullable|string|max:1000',
            'preferences'                   => 'sometimes|array',
            'preferences.notify_email'      => 'sometimes|boolean',
            'preferences.notify_sms'        => 'sometimes|boolean',
            'preferences.preferred_bedrooms'=> 'sometimes|nullable|integer|min:0|max:20',
            'preferences.max_budget'        => 'sometimes|nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $data = $validator->validated();

        // Merge preferences instead of replacing the entire JSON column
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
    // POST /tenant/profile/avatar
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

        // Delete old avatar if it exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');

        $user->update(['avatar' => $path]);

        return $this->success([
            'avatar_url' => asset('storage/' . $path),
        ], 'Avatar uploaded successfully.');
    }

    // -------------------------------------------------------
    // GET /tenant/profile/history
    // Returns a merged, date-sorted timeline of:
    //   - property_views (browse visits)
    //   - tenant_properties (formal tenancy events)
    // -------------------------------------------------------
    public function propertyHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = 15;

        // --- Source 1: Browse views (deduplicated to the latest per property so
        //               browsed-multiple-times properties show only once here)
        $views = PropertyView::where('tenant_id', $user->id)
            ->with(['property' => fn($q) => $q->with(['images' => fn($qi) => $qi->where('is_primary', true)])])
            ->orderByDesc('viewed_at')
            ->get()
            // Keep only the most recent view per property
            ->unique('property_id')
            ->values()
            ->map(fn($v) => [
                'type'        => 'viewed',
                'property'    => $this->formatProperty($v->property),
                'occurred_at' => $v->viewed_at,
                'meta'        => [],
            ]);

        // --- Source 2: Formal tenancy links
        $tenancy = TenantProperty::where('tenant_id', $user->id)
            ->with(['property' => fn($q) => $q->with(['images' => fn($qi) => $qi->where('is_primary', true)])])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn($tp) => [
                'type'        => $this->mapTenancyStatus($tp->status),
                'property'    => $this->formatProperty($tp->property),
                'occurred_at' => $tp->updated_at,
                'meta'        => [
                    'viewing_scheduled_at' => $tp->viewing_scheduled_at,
                    'move_in_date'         => $tp->move_in_date,
                    'move_out_date'        => $tp->move_out_date,
                ],
            ]);

        // --- Merge, sort, paginate manually
        $all = $views->concat($tenancy)
            ->sortByDesc('occurred_at')
            ->values();

        $page  = max(1, (int) $request->query('page', 1));
        $total = $all->count();
        $items = $all->slice(($page - 1) * $perPage, $perPage)->values();

        return $this->success([
            'data'         => $items,
            'current_page' => $page,
            'per_page'     => $perPage,
            'total'        => $total,
            'last_page'    => (int) ceil($total / $perPage),
        ]);
    }

    // -------------------------------------------------------
    // GET /tenant/profile/views/recent
    // Returns the last 10 distinct property views
    // -------------------------------------------------------
    public function recentViews(Request $request): JsonResponse
    {
        $user = $request->user();

        $recent = PropertyView::where('tenant_id', $user->id)
            ->with(['property' => fn($q) => $q->with(['images' => fn($qi) => $qi->where('is_primary', true)])])
            ->orderByDesc('viewed_at')
            ->get()
            ->unique('property_id')
            ->take(10)
            ->values()
            ->map(fn($v) => [
                'property'  => $this->formatProperty($v->property),
                'viewed_at' => $v->viewed_at,
            ]);

        return $this->success($recent);
    }

    // -------------------------------------------------------
    // POST /tenant/profile/views/{property}
    // Records a browse visit — deduplicates within 1 hour
    // -------------------------------------------------------
    public function recordView(Request $request, Property $property): JsonResponse
    {
        $user = $request->user();

        // Only track active/approved properties
        if ($property->status !== Property::STATUS_ACTIVE) {
            return $this->success(null);
        }

        // Check if a view exists within the last hour and update it, otherwise insert
        $existing = PropertyView::where('tenant_id', $user->id)
            ->where('property_id', $property->id)
            ->where('viewed_at', '>=', now()->subHour())
            ->first();

        if ($existing) {
            $existing->update(['viewed_at' => now()]);
        } else {
            PropertyView::create([
                'tenant_id'   => $user->id,
                'property_id' => $property->id,
                'viewed_at'   => now(),
            ]);
        }

        return $this->success(null);
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    private function formatProperty(?Property $property): ?array
    {
        if (!$property) return null;

        $primary = $property->images->first();

        return [
            'id'          => $property->id,
            'title'       => $property->title,
            'county'      => $property->county,
            'sub_county'  => $property->sub_county,
            'estate'      => $property->estate,
            'bedrooms'    => $property->bedrooms,
            'rent_amount' => $property->rent_amount,
            'image_url'   => $primary ? $primary->url : null,
        ];
    }

    private function mapTenancyStatus(string $status): string
    {
        return match ($status) {
            TenantProperty::STATUS_VIEWING_REQUESTED => 'applied',
            TenantProperty::STATUS_ACTIVE            => 'active',
            TenantProperty::STATUS_ENDED             => 'ended',
            default                                   => $status,
        };
    }
}

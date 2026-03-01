<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\TenantProperty;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    // -------------------------------------------------------
    // GET /api/properties  (public)
    // Browse active listings with optional filters
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Property::with('images', 'landlord:id,name,phone')
            ->where('status', Property::STATUS_ACTIVE);

        if ($request->filled('county')) {
            $query->where('county', $request->county);
        }
        if ($request->filled('bedrooms')) {
            $query->where('bedrooms', (int) $request->bedrooms);
        }
        if ($request->filled('min_rent')) {
            $query->where('rent_amount', '>=', (float) $request->min_rent);
        }
        if ($request->filled('max_rent')) {
            $query->where('rent_amount', '<=', (float) $request->max_rent);
        }

        return $this->success($query->paginate(12));
    }

    // -------------------------------------------------------
    // GET /api/properties/{id}  (public)
    // -------------------------------------------------------
    public function show(Property $property): JsonResponse
    {
        // Tenants can only see active properties; others (landlords, admins) see all
        if ($property->status !== Property::STATUS_ACTIVE) {
            return $this->error('Property not found.', null, 404);
        }

        $property->load('images', 'landlord:id,name,phone');
        return $this->success($property);
    }

    // -------------------------------------------------------
    // POST /api/properties  (landlord)
    // -------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'county'      => ['required', 'string', 'max:100'],
            'sub_county'  => ['nullable', 'string', 'max:100'],
            'estate'      => ['nullable', 'string', 'max:100'],
            'bedrooms'    => ['required', 'integer', 'min:0', 'max:20'],
            'rent_amount' => ['required', 'numeric', 'min:1'],
            'images'      => ['nullable', 'array'],
            'images.*'    => ['image', 'max:4096'],
        ]);

        $property = $request->user()->properties()->create([
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'county'      => $data['county'],
            'sub_county'  => $data['sub_county'] ?? null,
            'estate'      => $data['estate'] ?? null,
            'bedrooms'    => $data['bedrooms'],
            'rent_amount' => $data['rent_amount'],
            'status'      => Property::STATUS_PENDING,
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $file) {
                $path = $file->store('properties/' . $property->id, 'public');
                PropertyImage::create([
                    'property_id' => $property->id,
                    'path'        => $path,
                    'is_primary'  => $index === 0,
                ]);
            }
        }

        AuditLog::record('property.created', $property, ['title' => $property->title]);

        return $this->created($property->load('images'), 'Property submitted for admin review.');
    }

    // -------------------------------------------------------
    // PUT /api/properties/{id}  (landlord — own property)
    // -------------------------------------------------------
    public function update(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $data = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'county'      => ['sometimes', 'string', 'max:100'],
            'sub_county'  => ['nullable', 'string', 'max:100'],
            'estate'      => ['nullable', 'string', 'max:100'],
            'bedrooms'    => ['sometimes', 'integer', 'min:0'],
            'rent_amount' => ['sometimes', 'numeric', 'min:1'],
        ]);

        $property->update($data);

        return $this->success($property->load('images'), 'Property updated.');
    }

    // -------------------------------------------------------
    // DELETE /api/properties/{id}  (landlord — own property)
    // -------------------------------------------------------
    public function destroy(Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $property->update(['status' => Property::STATUS_INACTIVE]);
        AuditLog::record('property.deactivated', $property);

        return $this->success(null, 'Property deactivated.');
    }

    // -------------------------------------------------------
    // POST /api/properties/{id}/request-viewing  (tenant)
    // -------------------------------------------------------
    public function requestViewing(Request $request, Property $property): JsonResponse
    {
        // Gate 1: Only active properties can be requested
        if ($property->status !== Property::STATUS_ACTIVE) {
            return $this->error('This property is not currently available for viewing.', null, 422);
        }

        // Gate 2: Prevent duplicate requests
        $existingLink = $property->tenantProperties()
            ->where('tenant_id', $request->user()->id)
            ->whereIn('status', ['viewing_requested', 'active'])
            ->first();

        if ($existingLink) {
            $msg = $existingLink->status === 'active'
                ? 'You are already a tenant of this property.'
                : 'You already have a pending viewing request for this property.';
            return $this->error($msg, null, 409);
        }

        $tenantProperty = $request->user()->tenantProperties()->create([
            'property_id' => $property->id,
            'status'      => 'viewing_requested',
        ]);

        AuditLog::record('viewing.requested', $tenantProperty, [
            'property' => $property->title,
        ]);

        // Notify the landlord of the new viewing request
        $property->load('landlord');
        if ($property->landlord) {
            NotificationService::send(
                $property->landlord,
                'viewing_requested',
                'New Viewing Request 🏠',
                "{$request->user()->name} has requested to view \"{$property->title}\".",
                ['property_id' => $property->id, 'tenant_id' => $request->user()->id]
            );
        }

        return $this->created($tenantProperty, 'Viewing request sent to the landlord.');
    }

    // -------------------------------------------------------
    // POST /api/properties/{id}/viewing/{tenantPropertyId}/approve  (landlord)
    // -------------------------------------------------------
    public function approveViewing(Request $request, Property $property, TenantProperty $viewing): JsonResponse
    {
        // IDOR guard: landlord can only approve viewings for their own properties
        if ($property->landlord_id !== $request->user()->id) {
            return $this->forbidden('You do not own this property.');
        }

        if ($viewing->property_id !== $property->id) {
            return $this->forbidden('This viewing request does not belong to this property.');
        }

        if ($viewing->status !== 'viewing_requested') {
            return $this->error('This viewing request is no longer pending.', null, 409);
        }

        $request->validate([
            'viewing_at' => ['nullable', 'date', 'after:now'],
        ]);

        $viewing->update([
            'status'                => 'active',
            'viewing_scheduled_at'  => $request->viewing_at ?? null,
        ]);

        AuditLog::record('viewing.approved', $viewing);

        // Notify the tenant that their viewing has been approved
        NotificationService::viewingApproved(
            $viewing->tenant,
            $property->title,
            $property->id
        );

        return $this->success($viewing, 'Viewing request approved.');
    }

    // -------------------------------------------------------
    // POST /api/properties/{id}/viewing/{tenantPropertyId}/decline  (landlord)
    // -------------------------------------------------------
    public function declineViewing(Request $request, Property $property, TenantProperty $viewing): JsonResponse
    {
        if ($property->landlord_id !== $request->user()->id) {
            return $this->forbidden('You do not own this property.');
        }

        if ($viewing->property_id !== $property->id) {
            return $this->forbidden('This viewing request does not belong to this property.');
        }

        if ($viewing->status !== 'viewing_requested') {
            return $this->error('This viewing request is no longer pending.', null, 409);
        }

        $viewing->update(['status' => 'ended']);
        AuditLog::record('viewing.declined', $viewing);

        // Notify the tenant
        NotificationService::send(
            $viewing->tenant,
            'viewing_declined',
            'Viewing Request Declined',
            "Your viewing request for \"{$property->title}\" was not approved by the landlord.",
            ['property_id' => $property->id]
        );

        return $this->success(null, 'Viewing request declined.');
    }

    // -------------------------------------------------------
    // GET /api/landlord/viewings  (landlord)
    // View all pending viewing requests for landlord's properties
    // -------------------------------------------------------
    public function pendingViewings(Request $request): JsonResponse
    {
        $viewings = TenantProperty::whereHas('property', function ($q) use ($request) {
            $q->where('landlord_id', $request->user()->id);
        })
        ->with('tenant:id,name,phone,email', 'property:id,title,county,bedrooms,rent_amount')
        ->where('status', 'viewing_requested')
        ->latest()
        ->paginate(20);

        return $this->success($viewings);
    }

    // -------------------------------------------------------
    // POST /api/properties/{id}/approve  (admin)
    // -------------------------------------------------------
    public function approve(Property $property): JsonResponse
    {
        if ($property->status === Property::STATUS_ACTIVE) {
            return $this->error('Property is already approved.', null, 409);
        }

        $property->update(['status' => Property::STATUS_ACTIVE, 'rejection_reason' => null]);
        AuditLog::record('property.approved', $property);

        // Notify the landlord
        NotificationService::propertyApproved($property->landlord, $property->title, $property->id);

        return $this->success(null, 'Property approved and is now visible to tenants.');
    }

    // -------------------------------------------------------
    // POST /api/properties/{id}/reject  (admin)
    // -------------------------------------------------------
    public function reject(Request $request, Property $property): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if ($property->status === Property::STATUS_REJECTED) {
            return $this->error('Property is already rejected.', null, 409);
        }

        $property->update([
            'status'           => Property::STATUS_REJECTED,
            'rejection_reason' => $data['reason'],
        ]);

        AuditLog::record('property.rejected', $property, ['reason' => $data['reason']]);

        // Notify the landlord
        NotificationService::propertyRejected($property->landlord, $property->title, $data['reason']);

        return $this->success(null, 'Property rejected.');
    }

    // -------------------------------------------------------
    // GET /api/landlord/properties  (landlord — own listings)
    // -------------------------------------------------------
    public function myListings(Request $request): JsonResponse
    {
        $properties = $request->user()
            ->properties()
            ->with('images')
            ->latest()
            ->paginate(15);

        return $this->success($properties);
    }
}

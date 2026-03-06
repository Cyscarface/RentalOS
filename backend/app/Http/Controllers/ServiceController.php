<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    // -------------------------------------------------------
    // GET /api/services  (public)
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('provider:id,name,phone')
            ->where('status', Service::STATUS_ACTIVE);

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json($query->paginate(12));
    }

    // -------------------------------------------------------
    // GET /api/services/{id}  (public)
    // -------------------------------------------------------
    public function show(Service $service): JsonResponse
    {
        $service->load('provider:id,name,phone', 'bookings');
        return response()->json($service);
    }

    // -------------------------------------------------------
    // POST /api/services  (provider)
    // -------------------------------------------------------
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'category'    => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'base_price'  => ['required', 'numeric', 'min:1'],
        ]);

        $service = $request->user()->services()->create(array_merge(
            $data,
            ['status' => Service::STATUS_PENDING]
        ));

        AuditLog::record('service.created', $service, ['title' => $service->title]);

        return response()->json($service->load('provider:id,name'), 201);
    }

    // -------------------------------------------------------
    // PUT /api/services/{id}  (provider — own service)
    // -------------------------------------------------------
    public function update(Request $request, Service $service): JsonResponse
    {
        abort_if($service->provider_id !== $request->user()->id, 403, 'Forbidden.');

        $data = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'category'    => ['sometimes', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'base_price'  => ['sometimes', 'numeric', 'min:1'],
        ]);

        $service->update($data);

        return response()->json($service);
    }

    // -------------------------------------------------------
    // DELETE /api/services/{id}  (provider — own service)
    // -------------------------------------------------------
    public function destroy(Request $request, Service $service): JsonResponse
    {
        abort_if($service->provider_id !== $request->user()->id, 403, 'Forbidden.');

        $service->update(['status' => Service::STATUS_INACTIVE]);

        AuditLog::record('service.deactivated', $service);

        return response()->json(['message' => 'Service deactivated.']);
    }

    // -------------------------------------------------------
    // GET /api/provider/services  (provider — own listings)
    // -------------------------------------------------------
    public function myServices(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->services()->paginate(15)
        );
    }
}

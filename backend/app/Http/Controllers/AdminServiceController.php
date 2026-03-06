<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminServiceController extends Controller
{
    // -------------------------------------------------------
    // GET /api/admin/services
    // -------------------------------------------------------
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('provider:id,name,email');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(20));
    }

    // -------------------------------------------------------
    // POST /api/admin/services/{service}/approve
    // -------------------------------------------------------
    public function approve(Request $request, Service $service): JsonResponse
    {
        $service->update(['status' => Service::STATUS_ACTIVE]);

        AuditLog::record('admin.service_approved', $service, [], $request->user()->id);

        return response()->json(['message' => 'Service approved and is now active on the platform.']);
    }

    // -------------------------------------------------------
    // POST /api/admin/services/{service}/reject
    // -------------------------------------------------------
    public function reject(Request $request, Service $service): JsonResponse
    {
        // For MVP, we're just updating the status. A rejection reason could be added later.
        $service->update(['status' => Service::STATUS_REJECTED]);

        AuditLog::record('admin.service_rejected', $service, [], $request->user()->id);

        return response()->json(['message' => 'Service has been rejected.']);
    }
}

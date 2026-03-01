<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Property;
use App\Models\RentPayment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // -------------------------------------------------------
    // GET /api/admin/dashboard  (admin)
    // Platform KPIs
    // -------------------------------------------------------
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'users' => [
                'total'    => User::count(),
                'tenants'  => User::where('role', User::ROLE_TENANT)->count(),
                'landlords' => User::where('role', User::ROLE_LANDLORD)->count(),
                'providers' => User::where('role', User::ROLE_PROVIDER)->count(),
                'suspended' => User::where('is_suspended', true)->count(),
            ],
            'properties' => [
                'total'   => Property::count(),
                'pending' => Property::where('status', Property::STATUS_PENDING)->count(),
                'active'  => Property::where('status', Property::STATUS_ACTIVE)->count(),
                'rejected' => Property::where('status', Property::STATUS_REJECTED)->count(),
            ],
            'payments' => [
                'total_completed' => RentPayment::where('status', RentPayment::STATUS_COMPLETED)->count(),
                'total_collected' => RentPayment::where('status', RentPayment::STATUS_COMPLETED)->sum('amount'),
            ],
            'bookings' => [
                'total'     => Booking::count(),
                'completed' => Booking::where('status', Booking::STATUS_COMPLETED)->count(),
                'commission_earned' => Booking::where('status', Booking::STATUS_COMPLETED)->sum('commission_amount'),
            ],
        ]);
    }

    // -------------------------------------------------------
    // GET /api/admin/users  (admin)
    // -------------------------------------------------------
    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('search')) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%")
            );
        }

        return response()->json($query->paginate(20));
    }

    // -------------------------------------------------------
    // POST /api/admin/users/{id}/suspend  (admin)
    // -------------------------------------------------------
    public function suspend(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot suspend an admin account.'], 403);
        }

        $user->update(['is_suspended' => true]);
        $user->tokens()->delete(); // force logout

        AuditLog::record('admin.user_suspended', $user, [], $request->user()->id);

        return response()->json(['message' => "User {$user->name} has been suspended."]);
    }

    // -------------------------------------------------------
    // POST /api/admin/users/{id}/unsuspend  (admin)
    // -------------------------------------------------------
    public function unsuspend(Request $request, User $user): JsonResponse
    {
        $user->update(['is_suspended' => false]);

        AuditLog::record('admin.user_unsuspended', $user, [], $request->user()->id);

        return response()->json(['message' => "User {$user->name} has been reinstated."]);
    }

    // -------------------------------------------------------
    // GET /api/admin/properties  (admin)
    // -------------------------------------------------------
    public function properties(Request $request): JsonResponse
    {
        $query = Property::with('landlord:id,name,email');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(20));
    }

    // -------------------------------------------------------
    // GET /api/admin/bookings  (admin)
    // -------------------------------------------------------
    public function bookings(): JsonResponse
    {
        return response()->json(
            Booking::with('tenant:id,name', 'provider:id,name', 'service:id,title')
                ->latest()
                ->paginate(20)
        );
    }

    // -------------------------------------------------------
    // GET /api/admin/payments  (admin)
    // -------------------------------------------------------
    public function payments(): JsonResponse
    {
        return response()->json(
            RentPayment::with('tenant:id,name', 'landlord:id,name', 'property:id,title')
                ->latest()
                ->paginate(20)
        );
    }

    // -------------------------------------------------------
    // GET /api/admin/revenue  (admin)
    // -------------------------------------------------------
    public function revenue(): JsonResponse
    {
        $monthlyRent = RentPayment::selectRaw("strftime('%Y-%m', paid_at) as month, SUM(amount) as total")
            ->where('status', RentPayment::STATUS_COMPLETED)
            ->whereNotNull('paid_at')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $monthlyCommission = Booking::selectRaw("strftime('%Y-%m', completed_at) as month, SUM(commission_amount) as total")
            ->where('status', Booking::STATUS_COMPLETED)
            ->whereNotNull('completed_at')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'rent_collected'       => $monthlyRent,
            'commission_collected' => $monthlyCommission,
        ]);
    }
}

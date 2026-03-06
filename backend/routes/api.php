<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminServiceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\LandlordProfileController;
use App\Http\Controllers\ProviderProfileController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\RentPaymentController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TenantProfileController;
use Illuminate\Support\Facades\Route;

// -------------------------------------------------------
// Health check
// -------------------------------------------------------
Route::get('/ping', fn () => response()->json(['success' => true, 'message' => 'RentalOS API is running.', 'data' => null, 'errors' => null]));

// -------------------------------------------------------
// Public browsing (no auth required)
// -------------------------------------------------------
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show']);
Route::get('/reviews/provider/{providerId}', [ReviewController::class, 'providerReviews']);

// -------------------------------------------------------
// Auth (public) — rate limited: 10 attempts per minute per IP
// -------------------------------------------------------
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/register',        [AuthController::class, 'register']);
    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/verify-otp',      [AuthController::class, 'verifyOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
    
    // Google OAuth
    Route::get('/google/redirect',       [AuthController::class, 'googleRedirect']);
    Route::post('/google/callback',      [AuthController::class, 'googleCallback']);
    Route::post('/google/complete-signup', [AuthController::class, 'googleCompleteSignup']);
});

// -------------------------------------------------------
// M-Pesa callback — no Sanctum auth (called by Safaricom)
// IP validated by VerifyMpesaIp middleware (bypassed in local/testing)
// -------------------------------------------------------
Route::post('/payments/callback', [RentPaymentController::class, 'mpesaCallback'])
    ->middleware('mpesa.ip');

// -------------------------------------------------------
// Authenticated routes
// -------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {

    // Auth profile
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // --------------- NOTIFICATIONS (all roles) ---------------
    Route::prefix('notifications')->group(function () {
        Route::get('/',               [NotificationController::class, 'index']);
        Route::get('/unread-count',   [NotificationController::class, 'unreadCount']);
        Route::post('/read-all',      [NotificationController::class, 'markAllRead']);
        Route::post('/{id}/read',     [NotificationController::class, 'markRead']);
    });

    // --------------- TENANT routes ----------------------
    Route::middleware('role:tenant')->group(function () {
        Route::post('/properties/{property}/request-viewing', [PropertyController::class, 'requestViewing']);

        // Payments — rate limit: 5 payment initiations per 5 minutes per user
        Route::prefix('payments')->group(function () {
            Route::post('/initiate', [RentPaymentController::class, 'initiate'])->middleware('throttle:5,5');
            Route::get('/history',   [RentPaymentController::class, 'history']);
            Route::get('/{payment}/receipt', [RentPaymentController::class, 'receipt']);
        });

        // Bookings — rate limit: 10 bookings per minute per user
        Route::post('/bookings',  [BookingController::class, 'store'])->middleware('throttle:10,1');
        Route::get('/bookings/my', [BookingController::class, 'myBookings']);

        Route::post('/reviews', [ReviewController::class, 'store']);

        // Tenant Profile & Property History
        Route::prefix('tenant')->group(function () {
            Route::get('/profile',                          [TenantProfileController::class, 'show']);
            Route::put('/profile',                          [TenantProfileController::class, 'update']);
            Route::post('/profile/avatar',                  [TenantProfileController::class, 'uploadAvatar']);
            Route::get('/profile/history',                  [TenantProfileController::class, 'propertyHistory']);
            Route::get('/profile/views/recent',             [TenantProfileController::class, 'recentViews']);
            Route::post('/profile/views/{property}',        [TenantProfileController::class, 'recordView']);
        });
    });

    // --------------- LANDLORD routes --------------------
    Route::middleware('role:landlord')->group(function () {
        Route::get('/landlord/properties',                                       [PropertyController::class, 'myListings']);
        Route::get('/landlord/viewings',                                         [PropertyController::class, 'pendingViewings']);
        Route::post('/properties',                                               [PropertyController::class, 'store']);
        Route::put('/properties/{property}',                                     [PropertyController::class, 'update']);
        Route::delete('/properties/{property}',                                  [PropertyController::class, 'destroy']);
        Route::post('/properties/{property}/viewings/{viewing}/approve',         [PropertyController::class, 'approveViewing']);
        Route::post('/properties/{property}/viewings/{viewing}/decline',         [PropertyController::class, 'declineViewing']);
        Route::get('/payments/landlord/summary',                                 [RentPaymentController::class, 'landlordSummary']);

        // Landlord Profile
        Route::get('/landlord/profile',         [LandlordProfileController::class, 'show']);
        Route::put('/landlord/profile',         [LandlordProfileController::class, 'update']);
        Route::post('/landlord/profile/avatar', [LandlordProfileController::class, 'uploadAvatar']);
    });

    // --------------- PROVIDER routes --------------------
    Route::middleware('role:provider')->group(function () {
        Route::get('/provider/profile',             [ProviderProfileController::class, 'show']);
        Route::put('/provider/profile',             [ProviderProfileController::class, 'update']);
        Route::post('/provider/profile/avatar',     [ProviderProfileController::class, 'uploadAvatar']);

        Route::get('/provider/services',            [ServiceController::class, 'myServices']);
        Route::post('/services',                    [ServiceController::class, 'store']);
        Route::put('/services/{service}',           [ServiceController::class, 'update']);
        Route::delete('/services/{service}',        [ServiceController::class, 'destroy']);

        Route::get('/bookings/provider',            [BookingController::class, 'providerBookings']);
        Route::post('/bookings/{booking}/accept',   [BookingController::class, 'accept']);
        Route::post('/bookings/{booking}/decline',  [BookingController::class, 'decline']);
        Route::post('/bookings/{booking}/complete', [BookingController::class, 'complete']);
    });

    // --------------- MESSAGING (all roles) — rate limit: 30 messages per minute ----
    Route::prefix('messages')->middleware('throttle:30,1')->group(function () {
        Route::get('/conversations',            [MessageController::class, 'conversations']);
        Route::get('/conversations/{userId}',   [MessageController::class, 'thread']);
        Route::post('/send',                    [MessageController::class, 'send']);
    });

    // --------------- ADMIN routes -----------------------
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard',                [AdminController::class, 'dashboard']);

        Route::get('/users',                    [AdminController::class, 'users']);
        Route::post('/users/{user}/suspend',    [AdminController::class, 'suspend']);
        Route::post('/users/{user}/unsuspend',  [AdminController::class, 'unsuspend']);
        Route::post('/users/{user}/verify',     [AdminController::class, 'verifyProvider']);

        Route::get('/properties',               [AdminController::class, 'properties']);
        Route::post('/properties/{property}/approve', [PropertyController::class, 'approve']);
        Route::post('/properties/{property}/reject',  [PropertyController::class, 'reject']);

        Route::get('/services',                 [AdminServiceController::class, 'index']);
        Route::post('/services/{service}/approve', [AdminServiceController::class, 'approve']);
        Route::post('/services/{service}/reject',  [AdminServiceController::class, 'reject']);

        Route::get('/bookings',                 [AdminController::class, 'bookings']);
        Route::get('/payments',                 [AdminController::class, 'payments']);
        Route::get('/revenue',                  [AdminController::class, 'revenue']);
    });
});

<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(protected OtpService $otpService) {}

    // -------------------------------------------------------
    // POST /api/auth/register
    // -------------------------------------------------------
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'role'     => $request->role,
            'password' => $request->password,
        ]);

        $otp = $this->otpService->generate($user);
        \Log::info("OTP for {$user->email}: {$otp}");

        AuditLog::record('auth.register', $user, ['role' => $user->role]);

        return $this->created(
            ['user_id' => $user->id],
            'Registration successful. Check your phone/email for the OTP.'
        );
    }

    // -------------------------------------------------------
    // POST /api/auth/login
    // -------------------------------------------------------
    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->email;
        $lockKey = "login_lock:{$email}";
        $attemptsKey = "login_attempts:{$email}";

        // ---- Account lockout check ----
        if (Cache::has($lockKey)) {
            $seconds = Cache::getTimeToLive($lockKey);
            return $this->error(
                "Too many failed attempts. Account temporarily locked. Try again in {$seconds} seconds.",
                null,
                429
            );
        }

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            // Increment failed attempts
            $attempts = Cache::increment($attemptsKey);
            Cache::put($attemptsKey, $attempts, now()->addMinutes(15));

            if ($attempts >= 5) {
                Cache::put($lockKey, true, now()->addMinutes(15));
                Cache::forget($attemptsKey);
                AuditLog::record('auth.account_locked', $user ?? new User(['email' => $email]), ['ip' => $request->ip()]);
                return $this->error('Too many failed attempts. Account locked for 15 minutes.', null, 429);
            }

            throw ValidationException::withMessages([
                'email' => ['The credentials do not match our records.'],
            ]);
        }

        // Reset counter on success
        Cache::forget($attemptsKey);

        if ($user->is_suspended) {
            return $this->forbidden('Your account has been suspended.');
        }

        if (! $user->email_verified_at) {
            $otp = $this->otpService->generate($user);
            \Log::info("Re-sent OTP for {$user->email}: {$otp}");

            return $this->error('Account not verified. A new OTP has been sent.', [
                'requires_otp' => true,
                'user_id'      => $user->id,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::record('auth.login', $user, ['ip' => $request->ip()]);

        return $this->success([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $this->userResponse($user),
        ], 'Login successful.');
    }

    // -------------------------------------------------------
    // POST /api/auth/verify-otp
    // -------------------------------------------------------
    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'otp'     => ['required', 'string', 'size:6'],
        ]);

        $user = User::findOrFail($data['user_id']);

        if (! $this->otpService->verify($user, $data['otp'])) {
            throw ValidationException::withMessages([
                'otp' => ['The OTP is invalid or has expired.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::record('auth.otp_verified', $user);

        return $this->success([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $this->userResponse($user),
        ], 'OTP verified successfully.');
    }

    // -------------------------------------------------------
    // POST /api/auth/logout
    // -------------------------------------------------------
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        AuditLog::record('auth.logout', $request->user());

        return $this->success(null, 'Logged out successfully.');
    }

    // -------------------------------------------------------
    // GET /api/auth/me
    // -------------------------------------------------------
    public function me(Request $request): JsonResponse
    {
        return $this->success($this->userResponse($request->user()));
    }

    // -------------------------------------------------------
    // Shared user response shape
    // -------------------------------------------------------
    private function userResponse(User $user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'role'              => $user->role,
            'email_verified_at' => $user->email_verified_at,
            'is_suspended'      => $user->is_suspended,
        ];
    }
}

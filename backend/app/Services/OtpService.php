<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;

class OtpService
{
    const OTP_LENGTH  = 6;
    const OTP_TTL_MIN = 10; // minutes

    /**
     * Generate and store a fresh OTP for the given user.
     * Returns the plain OTP (send it via SMS/email).
     */
    public function generate(User $user): string
    {
        $otp = str_pad((string) random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);

        $user->update([
            'otp'            => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(self::OTP_TTL_MIN),
        ]);

        // Send OTP via email (queued so it doesn't block the response)
        try {
            \Illuminate\Support\Facades\Mail::to($user->email)
                ->queue(new \App\Mail\OtpMail($user, $otp, self::OTP_TTL_MIN));
        } catch (\Exception $e) {
            // Fallback: log so development still works without mail config
            \Illuminate\Support\Facades\Log::warning("OTP mail failed for {$user->email}: {$e->getMessage()}");
            \Illuminate\Support\Facades\Log::info("OTP for {$user->email}: {$otp}");
        }

        return $otp;
    }

    /**
     * Verify a given OTP for a user.
     * Clears the OTP on success.
     */
    public function verify(User $user, string $otp): bool
    {
        if (
            $user->otp !== $otp ||
            $user->otp_expires_at === null ||
            Carbon::now()->isAfter($user->otp_expires_at)
        ) {
            return false;
        }

        // Clear used OTP
        $user->update([
            'otp'            => null,
            'otp_expires_at' => null,
            'email_verified_at' => $user->email_verified_at ?? Carbon::now(),
        ]);

        return true;
    }
}

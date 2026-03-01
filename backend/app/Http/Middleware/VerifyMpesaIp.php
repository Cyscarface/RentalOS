<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validates that M-Pesa callback requests originate from Safaricom's
 * known IP ranges. Blocks any spoofed callbacks from unauthorized IPs.
 *
 * Safaricom official M-Pesa callback IPs (as published by Safaricom):
 *   Sandbox: 196.201.214.200, 196.201.214.206, 196.201.213.114, 196.201.214.207
 *             196.201.214.208, 196.201.213.44, 196.201.212.127, 196.201.212.138
 *             196.201.212.129, 196.201.212.136, 196.201.212.74, 196.201.212.69
 *
 * When MPESA_ENV=production, set MPESA_ALLOWED_IPS in .env to the
 * production IP list (same format, comma-separated).
 */
class VerifyMpesaIp
{
    /**
     * Default allowed IPs (sandbox).
     * Override via MPESA_ALLOWED_IPS env variable for production.
     */
    private const SAFARICOM_SANDBOX_IPS = [
        '196.201.214.200',
        '196.201.214.206',
        '196.201.213.114',
        '196.201.214.207',
        '196.201.214.208',
        '196.201.213.44',
        '196.201.212.127',
        '196.201.212.138',
        '196.201.212.129',
        '196.201.212.136',
        '196.201.212.74',
        '196.201.212.69',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // In local/testing environments, bypass the check
        if (app()->environment(['local', 'testing'])) {
            return $next($request);
        }

        $allowedIps = $this->getAllowedIps();
        $callerIp   = $request->ip();

        if (! in_array($callerIp, $allowedIps, true)) {
            Log::warning('M-Pesa callback blocked from unauthorized IP', [
                'ip'       => $callerIp,
                'url'      => $request->fullUrl(),
                'payload'  => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
                'data'    => null,
                'errors'  => null,
            ], 403);
        }

        return $next($request);
    }

    private function getAllowedIps(): array
    {
        $envIps = env('MPESA_ALLOWED_IPS', '');

        if (! empty(trim($envIps))) {
            return array_map('trim', explode(',', $envIps));
        }

        return self::SAFARICOM_SANDBOX_IPS;
    }
}

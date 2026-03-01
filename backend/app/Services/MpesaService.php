<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService
{
    private string $env;
    private string $consumerKey;
    private string $consumerSecret;
    private string $shortcode;
    private string $passkey;
    private string $callbackUrl;

    public function __construct()
    {
        $this->env            = config('services.mpesa.env', 'sandbox');
        $this->consumerKey    = config('services.mpesa.consumer_key', '');
        $this->consumerSecret = config('services.mpesa.consumer_secret', '');
        $this->shortcode      = config('services.mpesa.shortcode', '174379');
        $this->passkey        = config('services.mpesa.passkey', '');
        $this->callbackUrl    = config('services.mpesa.callback_url', '');
    }

    private function baseUrl(): string
    {
        return $this->env === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    // -------------------------------------------------------
    // Get OAuth token (cached for 55 minutes)
    // -------------------------------------------------------
    public function getToken(): string
    {
        return Cache::remember('mpesa_token', 55 * 60, function () {
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get("{$this->baseUrl()}/oauth/v1/generate?grant_type=client_credentials");

            return $response->json('access_token', '');
        });
    }

    // -------------------------------------------------------
    // Trigger STK Push (Lipa Na M-Pesa Online)
    // -------------------------------------------------------
    public function stkPush(string $phone, int $amount, string $reference, string $description): array
    {
        $timestamp = now()->format('YmdHis');
        $password  = base64_encode($this->shortcode . $this->passkey . $timestamp);

        try {
            $response = Http::withToken($this->getToken())
                ->post("{$this->baseUrl()}/mpesa/stkpush/v1/processrequest", [
                    'BusinessShortCode' => $this->shortcode,
                    'Password'          => $password,
                    'Timestamp'         => $timestamp,
                    'TransactionType'   => 'CustomerPayBillOnline',
                    'Amount'            => $amount,
                    'PartyA'            => $phone,
                    'PartyB'            => $this->shortcode,
                    'PhoneNumber'       => $phone,
                    'CallBackURL'       => $this->callbackUrl,
                    'AccountReference'  => $reference,
                    'TransactionDesc'   => $description,
                ]);

            Log::info('M-Pesa STK Push Response', $response->json());

            return $response->json();
        } catch (\Exception $e) {
            Log::error('M-Pesa STK Push Error', ['error' => $e->getMessage()]);
            return [];
        }
    }
}

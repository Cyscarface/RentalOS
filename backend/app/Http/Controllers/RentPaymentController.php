<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentInitiateRequest;
use App\Models\AuditLog;
use App\Models\Property;
use App\Models\RentPayment;
use App\Services\MpesaService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RentPaymentController extends Controller
{
    public function __construct(protected MpesaService $mpesa) {}

    // -------------------------------------------------------
    // POST /api/payments/initiate  (tenant)
    // -------------------------------------------------------
    public function initiate(PaymentInitiateRequest $request): JsonResponse
    {
        $user     = $request->user();
        $property = Property::findOrFail($request->property_id);

        // Create payment in pending state
        $payment = RentPayment::create([
            'tenant_id'    => $user->id,
            'landlord_id'  => $property->landlord_id,
            'property_id'  => $property->id,
            'amount'       => $request->amount,
            'phone_number' => $request->phone,
            'status'       => RentPayment::STATUS_PENDING,
        ]);

        // Trigger STK Push
        $response = $this->mpesa->stkPush(
            phone: $request->phone,
            amount: (int) $request->amount,
            reference: "RENT-{$payment->id}",
            description: "Rent payment for property #{$property->id}"
        );

        if (isset($response['CheckoutRequestID'])) {
            $payment->update(['checkout_request_id' => $response['CheckoutRequestID']]);
        } else {
            $payment->update(['status' => RentPayment::STATUS_FAILED]);
            return $this->error('Failed to initiate payment. Please try again.', null, 502);
        }

        AuditLog::record('payment.initiated', $payment, ['amount' => $request->amount]);

        return $this->success(
            ['payment_id' => $payment->id],
            'STK Push sent to your phone. Enter your M-Pesa PIN to confirm.'
        );
    }

    // -------------------------------------------------------
    // POST /api/payments/callback  (Safaricom webhook — no auth)
    // -------------------------------------------------------
    public function mpesaCallback(Request $request): JsonResponse
    {
        Log::info('M-Pesa Callback', $request->all());

        $body = $request->input('Body.stkCallback');

        if (! $body) {
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Invalid payload']);
        }

        $checkoutRequestId = $body['CheckoutRequestID'];
        $resultCode        = $body['ResultCode'];

        $payment = RentPayment::where('checkout_request_id', $checkoutRequestId)->first();

        if (! $payment) {
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        // Wrap update in DB transaction to prevent partial updates
        DB::transaction(function () use ($payment, $body, $resultCode) {
            if ($resultCode === 0) {
                $items = collect($body['CallbackMetadata']['Item'] ?? [])
                    ->pluck('Value', 'Name');

                $payment->update([
                    'status'          => RentPayment::STATUS_COMPLETED,
                    'mpesa_reference' => $items->get('MpesaReceiptNumber'),
                    'transaction_id'  => $items->get('MpesaReceiptNumber'),
                    'paid_at'         => now(),
                ]);

                AuditLog::record('payment.completed', $payment, [
                    'mpesa_ref' => $items->get('MpesaReceiptNumber'),
                    'amount'    => $items->get('Amount'),
                ], $payment->tenant_id);

                // Notify the tenant of payment success
                NotificationService::paymentSuccess(
                    $payment->tenant,
                    (float) $payment->amount,
                    $payment->property_id
                );

            } else {
                $payment->update([
                    'status'         => RentPayment::STATUS_FAILED,
                    'failure_reason' => $body['ResultDesc'] ?? 'Payment failed',
                ]);
            }
        });

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    // -------------------------------------------------------
    // GET /api/payments/history  (tenant)
    // -------------------------------------------------------
    public function history(Request $request): JsonResponse
    {
        $query = $request->user()
            ->rentPayments()
            ->with('property:id,title,county')
            ->latest();

        // Optional month/year filter
        if ($request->filled('month') && $request->filled('year')) {
            $query->whereMonth('created_at', $request->month)
                  ->whereYear('created_at', $request->year);
        }

        return $this->success($query->paginate(15));
    }

    // -------------------------------------------------------
    // GET /api/payments/landlord/summary  (landlord)
    // -------------------------------------------------------
    public function landlordSummary(Request $request): JsonResponse
    {
        $payments = $request->user()
            ->receivedRentPayments()
            ->with('tenant:id,name,phone', 'property:id,title')
            ->latest()
            ->paginate(15);

        $totalReceived = $request->user()
            ->receivedRentPayments()
            ->where('status', RentPayment::STATUS_COMPLETED)
            ->sum('amount');

        return $this->success([
            'total_received' => $totalReceived,
            'payments'       => $payments,
        ]);
    }

    // -------------------------------------------------------
    // GET /api/payments/{id}/receipt  (tenant — own payment)
    // -------------------------------------------------------
    public function receipt(Request $request, RentPayment $payment): JsonResponse
    {
        if ($payment->tenant_id !== $request->user()->id) {
            return $this->forbidden('You do not have access to this receipt.');
        }

        $payment->load('tenant:id,name,email,phone', 'landlord:id,name', 'property:id,title,county');

        return $this->success([
            'payment_id'      => $payment->id,
            'mpesa_reference' => $payment->mpesa_reference,
            'amount'          => $payment->amount,
            'paid_at'         => $payment->paid_at,
            'tenant'          => $payment->tenant,
            'landlord'        => $payment->landlord,
            'property'        => $payment->property,
        ]);
    }
}

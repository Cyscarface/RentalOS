<?php

namespace App\Services;

use App\Models\RentPayment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class PdfReceiptService
{
    /**
     * Generate a PDF receipt for a completed rent payment.
     * Returns a downloadable HTTP response.
     */
    public function download(RentPayment $payment): Response
    {
        $payment->loadMissing('tenant', 'landlord', 'property');

        $pdf = Pdf::loadView('pdf.receipt', compact('payment'))
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans');

        $filename = 'receipt-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Stream the PDF inline (for browser preview).
     */
    public function stream(RentPayment $payment): Response
    {
        $payment->loadMissing('tenant', 'landlord', 'property');

        $pdf = Pdf::loadView('pdf.receipt', compact('payment'))
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans');

        $filename = 'receipt-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT) . '.pdf';

        return $pdf->stream($filename);
    }
}

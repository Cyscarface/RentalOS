<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentInitiateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'amount'      => ['required', 'numeric', 'min:1', 'max:9999999'],
            'phone'       => ['required', 'string', 'regex:/^(\+?254|0)[17]\d{8}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex'   => 'Phone must be a valid Kenyan number (e.g. 0712345678).',
            'amount.min'    => 'Payment amount must be at least KSh 1.',
        ];
    }
}

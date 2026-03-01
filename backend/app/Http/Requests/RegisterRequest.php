<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'phone'    => ['required', 'string', 'regex:/^(\+?254|0)[17]\d{8}$/', 'max:20'],
            'role'     => ['required', 'in:tenant,landlord,provider'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex'           => 'Phone must be a valid Kenyan number (e.g. 0712345678).',
            'password.confirmed'    => 'Password confirmation does not match.',
            'email.unique'          => 'An account with this email already exists.',
        ];
    }
}

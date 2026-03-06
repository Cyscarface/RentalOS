<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@rentalos.com'],
            [
                'name' => 'Platform Admin',
                'phone' => '0700000000',
                'role' => User::ROLE_ADMIN,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
    }
}

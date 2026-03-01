<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@rentalos.ke'],
            [
                'name'              => 'RentalOS Admin',
                'email'             => 'admin@rentalos.ke',
                'phone'             => '0700000000',
                'role'              => 'admin',
                'password'          => Hash::make('Admin1234!'),
                'email_verified_at' => now(),
                'is_suspended'      => false,
            ]
        );

        $this->command->info('Admin user created: admin@rentalos.ke / Admin1234!');
    }
}

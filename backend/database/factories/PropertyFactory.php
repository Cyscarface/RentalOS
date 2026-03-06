<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PropertyFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Property::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $counties = ['Nairobi', 'Kiambu', 'Mombasa', 'Nakuru', 'Machakos', 'Kisumu'];
        
        // Map some counties to common sub-counties/estates for slightly more realism
        $subCounties = [
            'Nairobi' => ['Westlands', 'Dagoretti', 'Langata', 'Kasarani', 'Embakasi'],
            'Kiambu'  => ['Ruiru', 'Thika', 'Kikuyu', 'Juja', 'Kiambaa'],
            'Mombasa' => ['Nyali', 'Mvita', 'Kisauni', 'Likoni'],
            'Nakuru'  => ['Naivasha', 'Gilgil', 'Rongai', 'Njoro'],
            'Machakos'=> ['Athi River', 'Mavoko', 'Kangundo'],
            'Kisumu'  => ['Kisumu Central', 'Kisumu East', 'Kisumu West'],
        ];

        $county = $this->faker->randomElement($counties);
        $countySubCounties = $subCounties[$county];
        $subCounty = $this->faker->randomElement($countySubCounties);

        $estates = [
            'Westlands' => ['Kileleshwa', 'Kilimani', 'Lavington', 'Parklands'],
            'Langata' => ['Karen', 'South C', 'Nairobi West'],
            'Kasarani' => ['Roysambu', 'Zimmerman', 'Mwiki'],
            'Ruiru' => ['Membley', 'Kihunguro', 'Ruai'],
            'Nyali' => ['Links Road', 'Bamburi'],
        ];

        $estate = isset($estates[$subCounty]) ? $this->faker->randomElement($estates[$subCounty]) : $this->faker->streetName;

        return [
            'landlord_id' => User::factory(), // default fallback, will be overridden in seeder
            'title' => $this->faker->numberBetween(1, 4) . ' Bedroom ' . $this->faker->randomElement(['Apartment', 'House', 'Maisonette', 'Villa']) . ' in ' . $estate,
            'description' => $this->faker->paragraphs(3, true),
            'county' => $county,
            'sub_county' => $subCounty,
            'estate' => $estate,
            'bedrooms' => $this->faker->numberBetween(1, 5),
            'rent_amount' => $this->faker->randomFloat(2, 10000, 150000),
            'status' => Property::STATUS_ACTIVE,
            'rejection_reason' => null,
        ];
    }
}

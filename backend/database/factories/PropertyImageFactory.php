<?php

namespace Database\Factories;

use App\Models\PropertyImage;
use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

class PropertyImageFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = PropertyImage::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // A list of high-quality realistic house/apartment images from Unsplash source
        $imageIds = [
            '1564013799919-ab600027ffc6', // modern living room
            '1512917774080-9991f1c4c750', // home interior
            '1600596542815-ffad4c1539a9', // mansion exterior
            '1580587771525-78b9dba3b914', // luxury apartment
            '1512596489437-db56c703b715', // bedroom
            '1502005229868-9deea3c2fe33', // living room comfy
            '1497366216548-37526070297c', // modern kitchen
            '1484154218962-a197022b58ea', // clean kitchen
            '1522708323590-d24dbb6b0267', // neat apartment
            '1560518883-ce09059eeffa',    // home office/room
            '1556228453-efd6c1ff04f6',    // outdoor house
            '1600607686527-6fb886090705', // sunny apartment
        ];

        $randomId = $this->faker->randomElement($imageIds);
        
        return [
            'property_id' => Property::factory(),
            'path' => "https://images.unsplash.com/photo-{$randomId}?auto=format&fit=crop&w=800&q=80",
            'is_primary' => false,
        ];
    }
}

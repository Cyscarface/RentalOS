<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Database\Seeder;

class PropertySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 5 Landlords
        $landlords = User::factory(5)->create([
            'role' => User::ROLE_LANDLORD,
        ]);

        foreach ($landlords as $landlord) {
            // Each landlord has 2 to 5 properties
            $propertyCount = rand(2, 5);
            
            $properties = Property::factory($propertyCount)->create([
                'landlord_id' => $landlord->id,
            ]);

            foreach ($properties as $property) {
                // Each property gets 3 to 6 images
                $imageCount = rand(3, 6);
                
                $images = PropertyImage::factory($imageCount)->create([
                    'property_id' => $property->id,
                ]);

                // Set the first image as primary
                if ($images->isNotEmpty()) {
                    $firstImage = $images->first();
                    $firstImage->is_primary = true;
                    $firstImage->save();
                }
            }
        }
    }
}

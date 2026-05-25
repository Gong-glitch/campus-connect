<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            // Generate a random 3-word title (e.g., "Blue Canvas Backpack")
            'title' => fake()->words(3, true),
            
            // Generate a random paragraph for the description
            'description' => fake()->paragraph(),
            
            // Randomly pick a category that matches your Figma design
            'category' => fake()->randomElement(['Electronics', 'IDs/Wallets', 'Books', 'Clothing', 'Keys', 'Other']),
            
            // Randomly pick a campus location
            'location' => fake()->randomElement(['CCIS Lab 3', 'Main Cafeteria', 'Library 2nd Floor', 'Engineering Building', 'Gym Locker Room']),
            
            // Randomly assign a status
            'status' => fake()->randomElement(['Lost', 'Found', 'Resolved']),
            
            // Leave image blank for now so Cyril can design the default placeholder
            'image_path' => null,
        ];
    }
}
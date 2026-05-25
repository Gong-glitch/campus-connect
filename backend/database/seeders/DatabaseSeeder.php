<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Item;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Safely grab your existing user account, or create a fake one if it doesn't exist
        $user = User::first() ?? User::factory()->create([
            'name' => 'Test Student',
            'email' => 'test@example.com',
        ]);

        // Generate exactly 10 fake items and attach them to that user
        Item::factory(10)->create([
            'user_id' => $user->id
        ]);
    }
}
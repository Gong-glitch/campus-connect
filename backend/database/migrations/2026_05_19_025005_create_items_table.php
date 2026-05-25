<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            
            // Links the item to the specific student who posted it
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // The core data for your Figma cards
            $table->string('title');
            $table->text('description');
            $table->string('category'); // e.g., 'Electronics', 'Books'
            $table->string('location'); // e.g., 'CCIS Lab 3'
            $table->string('status')->default('Lost'); // 'Lost', 'Found', or 'Resolved'
            $table->string('image_path')->nullable(); // nullable because they might not have a photo
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};

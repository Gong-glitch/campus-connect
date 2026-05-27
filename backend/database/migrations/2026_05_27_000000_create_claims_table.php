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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            // Links the claim directly to the item in your items table
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            // Links to the user (student) who is creating the claim
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            // Detailed text matching verification criteria (e.g. unique descriptions)
            $table->text('proof_text');
            // Tracks operational status: 'Pending', 'Approved', or 'Rejected'
            $table->string('status')->default('Pending');
            // Optional comments filled out by an administrator when resolving requests
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};
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
       Schema::create('students', function (Blueprint $table) {
        $table->id(); // Auto-incrementing primary key
        $table->string('student_id')->unique(); 
        $table->string('first_name');
        $table->string('last_name');
        $table->string('course');
        $table->integer('year_level');
        $table->timestamps(); // Automatically adds 'created_at' and 'updated_at' columns
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};

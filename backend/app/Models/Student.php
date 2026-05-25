<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    // This allows these specific columns to be saved via our API
    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'course',
        'year_level',
    ];
}
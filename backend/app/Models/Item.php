<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    // Allow these fields to be filled via API requests
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category',
        'location',
        'status',
        'image_path'
    ];

    // Establish the relationship: An Item belongs to a User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
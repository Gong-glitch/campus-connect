<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'user_id',
        'proof_text',
        'status',
        'admin_notes',
    ];

    /**
     * Relationship: A claim belongs to a student user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship: A claim belongs to an explicit item asset.
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
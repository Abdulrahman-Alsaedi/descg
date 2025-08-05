<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $fillable = [
        'email', 'code', 'type', 'expires_at', 'used', 'data'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used' => 'boolean',
        'data' => 'array',
    ];
}
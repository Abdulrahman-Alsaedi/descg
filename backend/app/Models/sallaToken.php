<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SallaToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'access_token',
        'refresh_token',
        'scope',
        'token_type',
        'expires_in',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

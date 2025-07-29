<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    //
    protected $fillable = [
        'user_id',
        'name',
        'price',
        'sku',
        'category',
        'features',
        'keywords',
        'tone',
        'length',
        'language',
        'ai_provider',
        'final_description',
    ];

    protected $casts = [
        'features' => 'array',
        'keywords' => 'array',
    ];

     public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function aiDescriptionLogs()
    {
        return $this->hasMany(AiDescriptionLog::class);
    }
}

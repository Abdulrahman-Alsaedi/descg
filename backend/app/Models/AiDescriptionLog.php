<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiDescriptionLog extends Model
{
    // Enable timestamps to track when AI descriptions are generated
    public $timestamps = true;

    protected $fillable = [
        'product_id',         
        'generated_text',
        'request_data',
        'response_data',
        'ai_provider'
    ];

    protected $casts = [
        'request_data' => 'array',
        'response_data' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

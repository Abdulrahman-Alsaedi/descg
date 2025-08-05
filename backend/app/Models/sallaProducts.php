<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class sallaProducts extends Model
{
    protected $table = 'salla_products';

   protected $fillable = [
    'salla_product_id', 'merchant_id', 'name', 'price', 'type','sku',
    'taxed_price', 'tax', 'quantity', 'status', 'is_available', 'url'
];

    public $incrementing = false; // if you're setting id from external source
}

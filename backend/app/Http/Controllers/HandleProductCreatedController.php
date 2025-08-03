<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\sallaProducts;

class HandleProductCreatedController extends Controller
{
    public function handleProductCreated(Request $request)
    {
        $data = $request->all();

        \Log::info('Product Created Event', $data);

        $productData = $data['data'] ?? [];

        // Save product to the database using sallaProducts model
    sallaProducts::create([
    'salla_product_id' => $productData['id'],
    'merchant_id' => $data['merchant'],
    'name' => $productData['name'] ?? 'Unnamed Product',
    'type' => $productData['type'] ?? 'default',
    'price' => $productData['price']['amount'] ?? 0,
    'taxed_price' => $productData['taxed_price']['amount'] ?? 0,
    'tax' => $productData['tax']['amount'] ?? 0,
    'quantity' => $productData['quantity'] ?? 0,
    'status' => $productData['status'] ?? 'hidden',
    'is_available' => $productData['is_available'] ?? false,
    'url' => $productData['url'] ?? '',
    'sku' => $productData['sku'] ?? '',
]);

        return response()->json(['message' => 'Product saved successfully.'], 200);
    }

    
}


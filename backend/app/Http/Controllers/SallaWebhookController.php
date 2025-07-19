<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SallaWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // Log webhook data for debugging
        Log::info('Salla Webhook Received:', $request->all());

        $payload = $request->all();
        
        // Example: Check for the 'products.updated' event from Salla
        if ($payload['event'] === 'product.updated') {
            $productData = $payload['data'];
            
            // Assuming you have a local Product model
           /* \App\Models\Product::updateOrCreate(
                ['salla_id' => $productData['id']],
                [
                    'name' => $productData['name'],
                    'price' => $productData['price'],
                    'stock' => $productData['quantity'] ?? 0
                ]
            );*/
        }

        return response()->json(['message' => 'Webhook received.'], 200);
    }
}

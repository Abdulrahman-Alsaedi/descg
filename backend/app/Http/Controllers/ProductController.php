<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request; // Add this line

class ProductController extends Controller
{
    public function index(Request $request)
    {
        // Get products for the authenticated user
        $products = Product::where('user_id', $request->user()->id)
                          ->get();
        
        // Map final_description to description for frontend compatibility
        $products = $products->map(function ($product) {
            $product->description = $product->final_description;
            return $product;
        });
        
        return $products;
    }

    public function show(Request $request, $id)
    {
        // Get product for the authenticated user only
        $product = Product::where('user_id', $request->user()->id)->find($id);
        
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        
        $product->description = $product->final_description;
        return $product;
    }

    public function store(Request $request)
    {
        // Validate the request
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'features' => 'nullable|array',
            'keywords' => 'nullable|array',
            'tone' => 'nullable|in:professional,friendly,casual,luxury,playful,emotional',
            'length' => 'nullable|in:short,medium,long',
            'language' => 'nullable|in:العربية,English,كلاهما,ar,en', // Accept both formats
            'ai_provider' => 'nullable|in:gemini,deepseek',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048', // Allow URLs or base64 images
        ]);

        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        // Convert frontend language codes to database values
        $language = $request->input('language', 'كلاهما');
        if ($language === 'ar') {
            $language = 'العربية';
        } elseif ($language === 'en') {
            $language = 'English';
        }

        // Create product for the authenticated user
        $product = Product::create([
            'user_id' => $request->user()->id, // Use authenticated user's ID
            'name' => $request->input('name'),
            'price' => $request->input('price'),
            'sku' => $request->input('sku'),
            'category' => $request->input('category'),
            'features' => $request->input('features', []),
            'keywords' => $request->input('keywords', []),
            'tone' => $request->input('tone'),
            'length' => $request->input('length'),
            'language' => $language,
            'ai_provider' => $request->input('ai_provider', 'gemini'),
            'final_description' => $request->input('description'),
            'image_url' => $request->input('image_url'),
        ]);

        // Add description field for frontend compatibility
        $product->description = $product->final_description;

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product
        ], 201);
    }

    public function update(Request $request, $id)
    {
        // Get product for the authenticated user only
        $product = Product::where('user_id', $request->user()->id)->find($id);
        
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        
        // Validate the request
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'features' => 'nullable|array',
            'keywords' => 'nullable|array',
            'tone' => 'nullable|in:professional,friendly,casual,luxury,playful,emotional',
            'length' => 'nullable|in:short,medium,long',
            'language' => 'nullable|in:العربية,English,كلاهما',
            'ai_provider' => 'nullable|in:gemini,deepseek',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048', // Allow URLs or base64 images
        ]);
        
        $product->name = $request->input('name');
        $product->price = $request->input('price');
        $product->category = $request->input('category');
        $product->features = $request->input('features', []);
        $product->keywords = $request->input('keywords', []);
        $product->tone = $request->input('tone');
        $product->length = $request->input('length');
        
        // Convert frontend language codes to database values
        $language = $request->input('language', 'كلاهما');
        if ($language === 'ar') {
            $language = 'العربية';
        } elseif ($language === 'en') {
            $language = 'English';
        }
        $product->language = $language;
        
        $product->ai_provider = $request->input('ai_provider', 'gemini');
        $product->final_description = $request->input('description');
        $product->image_url = $request->input('image_url');
        $product->save();
        
        // Add description field for frontend compatibility
        $product->description = $product->final_description;
        
        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        // Get product for the authenticated user only
        $product = Product::where('user_id', $request->user()->id)->find($id);
        
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully'], 200);
    }
}
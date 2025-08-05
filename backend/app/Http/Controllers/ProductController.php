<?php

namespace App\Http\Controllers;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\SallaToken;

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

public function getProducts(Request $request)
{
    \Log::info('--- getProducts called ---');

    $page = $request->query('page', 1);
    $perPage = $request->query('per_page', 10);
    \Log::info("Requested page: $page, per_page: $perPage");

    $user = auth()->user();

    if (!$user) {
        \Log::error('User not authenticated');
        return response()->json(['error' => 'Not authenticated'], 401);
    }

    \Log::info('Authenticated user ID: ' . $user->id);

    // Check DB cache first
    $products = Product::where('user_id', $user->id)->get();

    if ($products->isNotEmpty() && now()->diffInMinutes($products->first()->updated_at) <= 10) {
        \Log::info("Returning cached products from DB");
        return response()->json($products);
    }

    \Log::info("No recent products in DB, fetching from Salla");

    $tokenRecord = SallaToken::where('user_id', $user->id)->first();

    if (!$tokenRecord || !$tokenRecord->access_token) {
        \Log::error("Salla token NOT found for user ID: {$user->id}");
        return response()->json(['error' => 'Salla access token not found'], 401);
    }

    $accessToken = $tokenRecord->access_token;
    \Log::info("Salla token retrieved for user ID: {$user->id}");

    // Log request being sent to Salla
    \Log::info("Sending request to Salla API for products", [
        'page' => $page,
        'per_page' => $perPage
    ]);

    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . $accessToken,
        'Accept' => 'application/json'
    ])->get('https://api.salla.dev/admin/v2/products', [
        'page' => $page,
        'per_page' => $perPage
    ]);

    if ($response->failed()) {
        \Log::error('Salla API request FAILED', [
            'status' => $response->status(),
            'response' => $response->body()
        ]);
        return response()->json(['error' => 'Failed to fetch products from Salla'], $response->status());
    }

    \Log::info('Salla API request SUCCESS', [
        'status' => $response->status(),
        'response_sample' => substr($response->body(), 0, 500) // Prevent log overload
    ]);

    $sallaProducts = $response->json()['data'] ?? [];

    foreach ($sallaProducts as $prod) {
        \Log::info("Saving product: {$prod['id']} - {$prod['name']}");
    Product::updateOrCreate(
    ['salla_id' => $prod['id'], 'user_id' => $user->id],
    [
        'salla_id' => $prod['id'],
        'user_id' => $user->id,
        'name' => $prod['name'] ?? '',
        'sku' => $prod['sku'] ?? '',
        'thumbnail' => $prod['thumbnail'] ?? '',
        'price' => $prod['price']['amount'] ?? 0,
        'type' => $prod['type'] ?? '',
         'final_description' => $prod['description'] ?? '',
    ]
);
    }

    
    $products = Product::where('user_id', $user->id)->get();

  return response()->json($products);
}



public function updateProduct(Request $request, $id)
{
    \Log::info('🟢 Update product request received', ['id' => $id, 'request' => $request->all()]);

    // Find the product
    $product = Product::findOrFail($id);
    \Log::info('🔍 Product found', ['product' => $product]);

    // Retrieve the real SKU from the database
    $realSku = Product::where('user_id', $product->user_id)->where('id', $id)->value('sku');
    if ($realSku) {
        \Log::info('✅ Real SKU retrieved from database', ['sku' => $realSku]);
    } else {
        \Log::warning('⚠️ Real SKU not found in database for product', ['id' => $id]);
        return response()->json(['error' => 'Real SKU not found'], 404);
    }

    // Retrieve the Salla access token
    $tokenRecord = SallaToken::where('user_id', $product->user_id)->first();
    if (!$tokenRecord || !$tokenRecord->access_token) {
        \Log::error("Salla token NOT found for user ID: {$product->user_id}");
        return response()->json(['error' => 'Salla access token not found'], 401);
    }
    $sallaToken = $tokenRecord->access_token;
    \Log::info("Salla token retrieved for user ID: {$product->user_id}");

    // Don't overwrite the SKU in the database
    $product->fill($request->except('sku'));
    $product->save();
    \Log::info('✅ Product updated locally', ['product' => $product]);

    \Log::info('Sending product to Salla API', ['sku' => $realSku, 'product' => $product]);
    // Then send update to Salla
    try {
        $client = new \GuzzleHttp\Client();
        $response = $client->put("https://api.salla.dev/admin/v2/products/sku/{$realSku}", [
            'headers' => [
                'Authorization' => "Bearer {$sallaToken}",
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'description' => $product->final_description ?? $product->description,
            ],
        ]);

        if (!in_array($response->getStatusCode(), [200, 201])) {
    \Log::error('❌ Failed to update Salla product description', [
        'sku' => $realSku,
        'response' => (string)$response->getBody(),
    ]);
} else {
    \Log::info('✅ Product successfully updated on Salla', [
        'sku' => $realSku,
        'response' => (string)$response->getBody(),
    ]);
}

    } catch (\Exception $e) {
        \Log::error('🔥 Exception during product update', ['id' => $id, 'error' => $e->getMessage()]);
    }

    return response()->json([
        'message' => 'Product updated successfully',
        'product' => $product,
    ]);
}





}
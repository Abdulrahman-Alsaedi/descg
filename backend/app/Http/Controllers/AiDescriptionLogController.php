<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use App\Models\AiDescriptionLog;
use App\Models\Product;
use App\Services\GeminiService;

class AiDescriptionLogController extends Controller
{
    public function index()
    {
        $logs = AiDescriptionLog::with('product')->get();
        return response()->json($logs);
    }

    public function show($id)
    {
        $log = AiDescriptionLog::with('product')->find($id);
        if (!$log) {
            return response()->json(['message' => 'Log not found'], 404);
        }
        return response()->json($log);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'generated_text' => 'required|string',
            'request_data' => 'nullable|array',
            'response_data' => 'nullable|array',
            'created_at' => 'nullable|date',
        ]);

        $log = AiDescriptionLog::create($validated);
        return response()->json([
            'message' => 'Log created successfully',
            'log' => $log
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $log = AiDescriptionLog::find($id);
        if (!$log) {
            return response()->json(['message' => 'Log not found'], 404);
        }
        $validated = $request->validate([
            'generated_text' => 'sometimes|string',
            'request_data' => 'sometimes|array',
            'response_data' => 'sometimes|array',
            'created_at' => 'sometimes|date',
        ]);
        $log->update($validated);
        return response()->json([
            'message' => 'Log updated successfully',
            'log' => $log
        ]);
    }

    public function destroy($id)
    {
        $log = AiDescriptionLog::find($id);
        if (!$log) {
            return response()->json(['message' => 'Log not found'], 404);
        }
        $log->delete();
        return response()->json(['message' => 'Log deleted successfully']);
    }

    public function fetchByProduct(Request $request)
    {
        $productId = $request->input('product_id');
        if (!$productId) {
            return response()->json(['message' => 'Product ID is required'], 400);
        }

        $logs = AiDescriptionLog::where('product_id', $productId)->get();
        if ($logs->isEmpty()) {
            return response()->json(['message' => 'No logs found for the given product'], 404);
        }

        return response()->json(['logs' => $logs], 200);
    }

    public function generateDescription($id/*Request $request*/, GeminiService $geminiService)
    {
        /*$validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'keywords' => 'required|array',
            'tone' => 'required|string',
            'length' => 'required|string',
        ]);*/

        $product = Product::find( $id /*$validated['product_id']*/);

        $apiData = [
            'name' => $product->name,
            'keywords' => $product->keywords , //$validated['keywords'],
            'tone' => $product-> tone,//$validated['tone'],
            'length' => $product-> length,//$validated['length'],
        ];

        try {
            $response = $geminiService->describeProduct($apiData);
            return response()->json(['description' => $response['description']], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function testEnvironment()
    {
        return response()->json([
            'GEMINI_API_KEY' => env('GEMINI_API_KEY'),
            'GEMINI_API_URL' => env('GEMINI_API_URL')
        ]);
    }
}

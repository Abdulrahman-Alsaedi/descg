<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use App\Models\AiDescriptionLog;
use App\Models\Product;
use App\Services\GeminiService;
use App\Services\DeepSeekService;

class AiDescriptionLogController extends Controller
{
    public function index()
    {
        $logs = AiDescriptionLog::with('product')
            ->whereHas('product', function($query) {
                $query->where('user_id', auth()->id());
            })
            ->get();
        return response()->json($logs);
    }

    public function show($product_id)
    {
        $logs = AiDescriptionLog::with('product')
            ->whereHas('product', function($query) use ($product_id) {
                $query->where('user_id', auth()->id())
                      ->where('id', $product_id);
            })
            ->get();
        if ($logs->isEmpty()) {
            return response()->json(['message' => 'No descriptions found for this product'], 404);
        }
        return response()->json($logs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'generated_text' => 'required|string',
            'request_data' => 'nullable|array',
            'response_data' => 'nullable|array',
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
            'product_id' => 'required|exists:products,id',
            'generated_text' => 'sometimes|string',
            'request_data' => 'sometimes|array',
            'response_data' => 'sometimes|array',
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

    public function generateDescription($id, GeminiService $geminiService, DeepSeekService $deepSeekService)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Build a prompt for AI based on language choice
        $style = $product->tone ?: 'professional';
        $length = $product->length ?: 'medium';
        $language = $product->language ?: 'كلاهما';
        $aiProvider = $product->ai_provider ?: 'gemini';
        
        // Convert arrays to strings for prompt
        $featuresText = is_array($product->features) ? implode(', ', $product->features) : ($product->features ?: '');
        $keywordsText = is_array($product->keywords) ? implode(', ', $product->keywords) : ($product->keywords ?: '');
        
        // Define specifications
        $lengthSpecs = [
            'short' => 'قصير (50-100 كلمة)',
            'medium' => 'متوسط (150-250 كلمة)', 
            'long' => 'طويل (300-500 كلمة)'
        ];
        
        $lengthDesc = $lengthSpecs[$length] ?? $lengthSpecs['medium'];
        
        // Create language-specific prompt
        if ($language === 'العربية') {
            $prompt = "اكتب وصفاً تسويقياً احترافياً ومقنعاً باللغة العربية للمنتج التالي:\n\n";
            $prompt .= "اسم المنتج: {$product->name}\n";
            if ($featuresText) {
                $prompt .= "المميزات الرئيسية: {$featuresText}\n";
            }
            if ($keywordsText) {
                $prompt .= "الكلمات المفتاحية: {$keywordsText}\n";
            }
            if ($product->category) {
                $prompt .= "الفئة: {$product->category}\n";
            }
            
            $prompt .= "\nمعايير الكتابة:\n";
            $prompt .= "- استخدم العربية الفصحى البسيطة والواضحة\n";
            $prompt .= "- اكتب بأسلوب {$style} ومقنع\n";
            $prompt .= "- اجعل الطول {$lengthDesc}\n";
            $prompt .= "- ابدأ بجملة جذابة تلفت الانتباه\n";
            $prompt .= "- اذكر 3-4 فوائد رئيسية للعميل\n";
            $prompt .= "- تجنب المبالغة والتكرار\n";
            $prompt .= "- استخدم فقرات قصيرة ومنطقية\n";
            $prompt .= "- اختتم بدعوة واضحة للعمل\n";
            $prompt .= "- تجنب العبارات المكررة مثل 'تخيل' و'أهلاً بك'\n";
            $prompt .= "- ركز على القيمة الحقيقية للمنتج\n\n";
            $prompt .= "ابدأ الوصف مباشرة:";
            
        } elseif ($language === 'English') {
            $prompt = "Write a professional and compelling marketing description in clear English for this product:\n\n";
            $prompt .= "Product Name: {$product->name}\n";
            if ($featuresText) {
                $prompt .= "Key Features: {$featuresText}\n";
            }
            if ($keywordsText) {
                $prompt .= "Keywords: {$keywordsText}\n";
            }
            if ($product->category) {
                $prompt .= "Category: {$product->category}\n";
            }
            
            $prompt .= "\nWriting Standards:\n";
            $prompt .= "- Use clear, professional English\n";
            $prompt .= "- Write in {$style} and persuasive style\n";
            $prompt .= "- Make it {$length} length\n";
            $prompt .= "- Start with an attention-grabbing opening\n";
            $prompt .= "- Highlight 3-4 key customer benefits\n";
            $prompt .= "- Avoid exaggeration and repetition\n";
            $prompt .= "- Use short, logical paragraphs\n";
            $prompt .= "- End with a clear call to action\n";
            $prompt .= "- Focus on real product value\n\n";
            $prompt .= "Start the description directly:";
            
        } else {
            $prompt = "اكتب وصفاً تسويقياً احترافياً ومقنعاً للمنتج التالي باللغتين العربية والإنجليزية:\n\n";
            $prompt .= "اسم المنتج: {$product->name}\n";
            if ($featuresText) {
                $prompt .= "المميزات: {$featuresText}\n";
            }
            if ($keywordsText) {
                $prompt .= "الكلمات المفتاحية: {$keywordsText}\n";
            }
            if ($product->category) {
                $prompt .= "الفئة: {$product->category}\n";
            }
            
            $prompt .= "\nمعايير الكتابة:\n";
            $prompt .= "1. اكتب نسختين منفصلتين ومتساويتين في الجودة والاحترافية\n";
            $prompt .= "2. النسخة العربية: استخدم العربية الفصحى البسيطة والواضحة\n";
            $prompt .= "3. النسخة الإنجليزية: استخدم إنجليزية واضحة ومهنية\n";
            $prompt .= "4. الأسلوب: {$style} ومقنع\n";
            $prompt .= "5. الطول: {$lengthDesc}\n";
            $prompt .= "6. ابدأ كل وصف بجملة جذابة\n";
            $prompt .= "7. اذكر 3-4 فوائد رئيسية في كل لغة\n";
            $prompt .= "8. تجنب التكرار والمبالغة\n";
            $prompt .= "9. استخدم فقرات قصيرة ومنطقية\n";
            $prompt .= "10. اختتم بدعوة واضحة للعمل\n\n";
            $prompt .= "التنسيق المطلوب:\n";
            $prompt .= "=== الوصف العربي ===\n";
            $prompt .= "[اكتب الوصف العربي المحسن هنا]\n\n";
            $prompt .= "=== English Description ===\n";
            $prompt .= "[Write the enhanced English description here]";
        }

        // Choose AI service based on product settings
        $aiService = $aiProvider === 'deepseek' ? $deepSeekService : $geminiService;
        
        // Prepare API data based on AI provider
        if ($aiProvider === 'deepseek') {
            $apiData = ['prompt' => $prompt];
        } else {
            $apiData = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ];
        }

        try {
            $response = $aiService->describeProduct($apiData);
            
            // Extract the actual text from AI response
            $description = '';
            if ($aiProvider === 'deepseek') {
                // DeepSeek response format
                if (isset($response['choices'][0]['message']['content'])) {
                    $description = $response['choices'][0]['message']['content'];
                }
            } else {
                // Gemini response format
                if (isset($response['candidates'][0]['content']['parts'][0]['text'])) {
                    $description = $response['candidates'][0]['content']['parts'][0]['text'];
                }
            }
            
            // Save the AI description log
            $log = AiDescriptionLog::create([
                'product_id' => $product->id,
                'generated_text' => $description,
                'request_data' => $apiData,
                'response_data' => $response
            ]);
            
            return response()->json([
                'success' => true,
                'description' => $description,
                'log_id' => $log->id,
                'product_info' => [
                    'name' => $product->name,
                    'category' => $product->category,
                    'language' => $language
                ],
                'generation_settings' => [
                    'style' => $style,
                    'length' => $length,
                    'language' => $language,
                    'ai_provider' => $aiProvider,
                    'language_name' => $language === 'العربية' ? 'العربية' : ($language === 'English' ? 'English' : 'اللغتين معاً'),
                    'ai_provider_name' => $aiProvider === 'deepseek' ? 'DeepSeek' : 'Google Gemini'
                ],
                'timestamp' => now()->toISOString()
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function testEnvironment()
    {
        return response()->json([
            'gemini' => [
                'GEMINI_API_KEY' => env('GEMINI_API_KEY') ? 'Configured ✓' : 'Not configured ✗'
            ],
            'deepseek' => [
                'DEEPSEEK_API_KEY' => env('DEEPSEEK_API_KEY') ? 'Configured ✓' : 'Not configured ✗',
                'DEEPSEEK_API_URL' => 'https://api.deepseek.com/v1/chat/completions (Fixed)'
            ]
        ]);
    }

    public function testDeepSeek(DeepSeekService $deepSeekService)
    {
        try {
            $testPrompt = "اكتب وصفاً قصيراً لجهاز iPhone 15 Pro";
            $response = $deepSeekService->generateContent($testPrompt);
            
            return response()->json([
                'success' => true,
                'message' => 'DeepSeek API is working correctly',
                'test_response' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Quick connectivity test for DeepSeek API
     */
    public function quickTestDeepSeek(DeepSeekService $deepSeekService)
    {
        try {
            $result = $deepSeekService->quickTest();
            
            return response()->json([
                'service' => 'DeepSeek Quick Test',
                'timestamp' => now()->toISOString(),
                'result' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'service' => 'DeepSeek Quick Test',
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Enhanced environment test with detailed configuration
     */
    public function testEnvironmentEnhanced(DeepSeekService $deepSeekService)
    {
        try {
            $deepSeekStatus = $deepSeekService->getStatus();
            
            return response()->json([
                'timestamp' => now()->toISOString(),
                'server_info' => [
                    'php_version' => PHP_VERSION,
                    'laravel_version' => app()->version(),
                    'memory_usage' => memory_get_usage(true) / 1024 / 1024 . ' MB',
                    'memory_limit' => ini_get('memory_limit'),
                    'max_execution_time' => ini_get('max_execution_time') . ' seconds'
                ],
                'gemini' => [
                    'GEMINI_API_KEY' => env('GEMINI_API_KEY') ? 'Configured ✓' : 'Not configured ✗'
                ],
                'deepseek' => [
                    'status' => $deepSeekStatus,
                    'quick_test' => $deepSeekService->quickTest("مرحبا")
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Environment test failed',
                'message' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    public function getDescriptionByLanguage($logId, $language)
    {
        $log = AiDescriptionLog::find($logId);
        
        if (!$log) {
            return response()->json(['error' => 'Log not found'], 404);
        }
        
        $fullDescription = $log->generated_text;
        
        if ($language === 'العربية') {
            // Extract Arabic description
            if (preg_match('/=== الوصف العربي ===(.*?)(?==== English Description ===|$)/s', $fullDescription, $matches)) {
                $description = trim($matches[1]);
            } else {
                $description = $fullDescription; // If no sections found, return full text
            }
        } elseif ($language === 'English') {
            // Extract English description
            if (preg_match('/=== English Description ===(.*?)$/s', $fullDescription, $matches)) {
                $description = trim($matches[1]);
            } else {
                $description = $fullDescription; // If no sections found, return full text
            }
        } else {
            $description = $fullDescription; // Return both languages
        }
        
        return response()->json([
            'success' => true,
            'description' => $description,
            'language' => $language,
            'log_id' => $logId
        ], 200);
    }
}

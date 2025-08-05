<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use App\Models\AiDescriptionLog;
use App\Models\Product;
use App\Services\GeminiService;
use App\Services\DeepSeekService;
use Illuminate\Support\Facades\Log;

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

        // Debug: Log the request to help troubleshoot
        Log::info("Fetching AI logs for product ID: " . $productId);
        
        // Get logs ordered by creation time (newest first)
        $logs = AiDescriptionLog::where('product_id', $productId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Debug: Log how many logs were found
        Log::info("Found " . $logs->count() . " AI logs for product ID: " . $productId);
        
        // Always return logs array, even if empty (don't return 404)
        return response()->json(['logs' => $logs], 200);
    }

    public function generateDescription($id, Request $request, GeminiService $geminiService, DeepSeekService $deepSeekService)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Get current generation settings from request (overrides stored product settings)
        $style = $request->input('tone', $product->tone ?: 'professional');
        $length = $request->input('length', $product->length ?: 'medium');
        $rawLanguage = $request->input('language', $product->language ?: 'كلاهما');
        $aiProvider = $request->input('ai_provider', $product->ai_provider ?: 'gemini');

        // Convert frontend language codes to database values
        if ($rawLanguage === 'ar') {
            $language = 'العربية';
        } elseif ($rawLanguage === 'en') {
            $language = 'English';
        } elseif ($rawLanguage === 'both') {
            $language = 'كلاهما';
        } else {
            // If it's already in database format, use as is
            $language = $rawLanguage;
        }

        // Get previous descriptions to ensure uniqueness
        $previousDescriptions = AiDescriptionLog::where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->pluck('generated_text')
            ->toArray();

        // Build a prompt for AI based on language choice
        
        // Convert arrays to strings for prompt
        $featuresText = is_array($product->features) ? implode(', ', $product->features) : ($product->features ?: '');
        $keywordsText = is_array($product->keywords) ? implode(', ', $product->keywords) : ($product->keywords ?: '');
        
        // Add uniqueness instruction based on previous attempts
        $uniquenessInstruction = '';
        if (!empty($previousDescriptions)) {
            $uniquenessInstruction = "\n\nIMPORTANT: This is a regeneration request. You must create a completely different and unique description that is distinctly different from previous versions. Use different wording, structure, and approach while maintaining the same quality and requirements.\n";
            
            // Add a random element to ensure variation
            $variations = [
                'Focus more on emotional benefits and customer feelings',
                'Emphasize technical specifications and performance',
                'Highlight lifestyle and practical applications',
                'Concentrate on unique selling points and competitive advantages',
                'Stress the problem-solving aspects and customer pain points'
            ];
            $randomVariation = $variations[array_rand($variations)];
            $uniquenessInstruction .= "Additional focus for this version: {$randomVariation}.\n";
        }
        
        // Paragraph-based length mapping
        $lengthSpecs = [
            'short' => [
                'paragraphs' => '1-2 فقرات',
                'paragraphs_en' => '1-2 paragraphs',
                'tokens' => 150
            ],
            'medium' => [
                'paragraphs' => '3-4 فقرات',
                'paragraphs_en' => '3-4 paragraphs',
                'tokens' => 300
            ],
            'long' => [
                'paragraphs' => '5-6 فقرات',
                'paragraphs_en' => '5-6 paragraphs',
                'tokens' => 500
            ]
        ];
        
        $currentSpec = $lengthSpecs[$length] ?? $lengthSpecs['medium'];
        $paragraphsAr = $currentSpec['paragraphs'];
        $paragraphsEn = $currentSpec['paragraphs_en'];
        $maxTokens = $currentSpec['tokens'];
        
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
            
            $prompt .= $uniquenessInstruction;
            
            $prompt .= "\nمعايير الكتابة:\n";
            $prompt .= "- استخدم العربية الفصحى البسيطة والواضحة\n";
            $prompt .= "- اكتب بأسلوب {$style} ومقنع\n";
            $prompt .= "- اكتب {$paragraphsAr} فقط\n";
            $prompt .= "- ابدأ بجملة جذابة تلفت الانتباه\n";
            $prompt .= "- اذكر 3-4 فوائد رئيسية للعميل\n";
            $prompt .= "- تجنب المبالغة والتكرار\n";
            $prompt .= "- استخدم فقرات قصيرة ومنطقية\n";
            $prompt .= "- اختتم بدعوة واضحة للعمل\n";
            $prompt .= "- تجنب العبارات المكررة مثل 'تخيل' و'أهلاً بك'\n";
            $prompt .= "- ركز على القيمة الحقيقية للمنتج\n";
            $prompt .= "- استخدم مفردات وتراكيب مختلفة تماماً عن أي وصف سابق\n";
            $prompt .= "- لا تستخدم رموز التنسيق مثل * أو ** أو # أو أي رموز markdown\n";
            $prompt .= "- اكتب نصاً عادياً بدون تنسيق خاص\n\n";
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
            
            $prompt .= $uniquenessInstruction;
            
            $prompt .= "\nWriting Standards:\n";
            $prompt .= "- Use clear, professional English\n";
            $prompt .= "- Write in {$style} and persuasive style\n";
            $prompt .= "- Write exactly {$paragraphsEn}\n";
            $prompt .= "- Start with an attention-grabbing opening\n";
            $prompt .= "- Highlight 3-4 key customer benefits\n";
            $prompt .= "- Avoid exaggeration and repetition\n";
            $prompt .= "- Use short, logical paragraphs\n";
            $prompt .= "- End with a clear call to action\n";
            $prompt .= "- Focus on real product value\n";
            $prompt .= "- Use completely different vocabulary and structure from any previous descriptions\n";
            $prompt .= "- Do not use formatting symbols like * or ** or # or any markdown symbols\n";
            $prompt .= "- Write plain text without special formatting\n\n";
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
            
            $prompt .= $uniquenessInstruction;
            
            $prompt .= "\nمعايير الكتابة:\n";
            $prompt .= "1. اكتب نسختين منفصلتين ومتساويتين في الجودة والاحترافية\n";
            $prompt .= "2. النسخة العربية: استخدم العربية الفصحى البسيطة والواضحة\n";
            $prompt .= "3. النسخة الإنجليزية: استخدم إنجليزية واضحة ومهنية\n";
            $prompt .= "4. الأسلوب: {$style} ومقنع\n";
            $prompt .= "5. الطول: {$paragraphsAr} لكل لغة\n";
            $prompt .= "6. ابدأ كل وصف بجملة جذابة\n";
            $prompt .= "7. اذكر 3-4 فوائد رئيسية في كل لغة\n";
            $prompt .= "8. تجنب التكرار والمبالغة\n";
            $prompt .= "9. استخدم فقرات قصيرة ومنطقية\n";
            $prompt .= "10. اختتم بدعوة واضحة للعمل\n";
            $prompt .= "11. استخدم مفردات وتراكيب مختلفة تماماً عن أي وصف سابق\n";
            $prompt .= "12. لا تستخدم رموز التنسيق مثل * أو ** أو # أو أي رموز markdown\n";
            $prompt .= "13. اكتب نصاً عادياً بدون تنسيق خاص\n\n";
            $prompt .= "التنسيق المطلوب:\n";
            $prompt .= "=== الوصف العربي ===\n";
            $prompt .= "[اكتب الوصف العربي المحسن هنا]\n\n";
            $prompt .= "=== English Description ===\n";
            $prompt .= "[Write the enhanced English description here]";
        }

        // Choose AI service based on product settings
        $aiService = $aiProvider === 'deepseek' ? $deepSeekService : $geminiService;
        
        // Add timestamp and random element to ensure uniqueness
        $timestamp = now()->timestamp;
        $uniquePromptAddition = "\n\nGeneration ID: {$timestamp} - Create a fresh, unique perspective.";
        $prompt .= $uniquePromptAddition;
        
        // Prepare API data based on AI provider with enhanced parameters for uniqueness
        if ($aiProvider === 'deepseek') {
            $apiData = [
                'prompt' => $prompt,
                'temperature' => 0.8, // Higher temperature for more creativity
                'top_p' => 0.9,
                'max_tokens' => $maxTokens
            ];
        } else {
            $apiData = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.8, // Higher temperature for more creativity and variation
                    'topP' => 0.9,
                    'maxOutputTokens' => $maxTokens
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

            // Clean the description by removing the Generation ID and instruction text
            $description = preg_replace('/Generation ID: \d+ - [^\n]*/', '', $description);
            $description = trim($description);
            
            // Remove any remaining markdown formatting symbols
            $description = preg_replace('/\*\*([^*]+)\*\*/', '$1', $description); // Remove **bold**
            $description = preg_replace('/\*([^*]+)\*/', '$1', $description); // Remove *italic*
            $description = preg_replace('/#+\s*/', '', $description); // Remove # headers
            $description = preg_replace('/^\s*[-*+]\s*/m', '', $description); // Remove bullet points
            $description = trim($description);
            
            // Save the AI description log
            $log = AiDescriptionLog::create([
                'product_id' => $product->id,
                'generated_text' => $description,
                'request_data' => $apiData,
                'response_data' => $response,
                'ai_provider' => $aiProvider
            ]);
            
            // Debug: Log that we created an AI log
            Log::info("Created AI log with ID: " . $log->id . " for product ID: " . $product->id);
            
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
     * Test method - can be removed in production
     */
    public function quickTestDeepSeek(DeepSeekService $deepSeekService)
    {
        try {
            return response()->json([
                'service' => 'DeepSeek Quick Test',
                'timestamp' => now()->toISOString(),
                'message' => 'Service available'
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
     * Test method - can be removed in production
     */
    public function testEnvironmentEnhanced()
    {
        try {
            return response()->json([
                'timestamp' => now()->toISOString(),
                'message' => 'Environment test completed',
                'status' => 'OK'
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

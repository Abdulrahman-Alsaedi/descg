<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeepSeekService
{
    private $apiKey;
    private $apiUrl;
    private $timeout;
    private $retryAttempts;

    public function __construct()
    {
        $this->apiKey = env('DEEPSEEK_API_KEY');
        $this->apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        $this->timeout = 90; // 90 seconds timeout
        $this->retryAttempts = 3; // Retry 3 times on failure
        
        // Validate configuration
        if (empty($this->apiKey)) {
            throw new \Exception('DEEPSEEK_API_KEY is not configured in .env file');
        }
        
        // Set PHP execution time limit
        set_time_limit(120); // 2 minutes for PHP execution
    }

    public function describeProduct($data)
    {
        $attempt = 0;
        $lastException = null;
        
        while ($attempt < $this->retryAttempts) {
            try {
                $attempt++;
                
                // Debug log
                Log::info('DeepSeek Service Attempt', [
                    'attempt' => $attempt,
                    'api_key' => substr($this->apiKey, 0, 10) . '...',
                    'api_url' => $this->apiUrl,
                    'timeout' => $this->timeout
                ]);
                
                // Build optimized request data for DeepSeek API
                $requestData = [
                    'model' => 'deepseek-chat',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'أنت خبير في كتابة الأوصاف التسويقية الاحترافية. اكتب أوصافاً مقنعة وجذابة بدون مبالغة.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $data['prompt']
                        ]
                    ],
                    'max_tokens' => 1500,
                    'temperature' => 0.7,
                    'top_p' => 0.9,
                    'frequency_penalty' => 0.1,
                    'presence_penalty' => 0.1,
                    'stream' => false
                ];

                // Make HTTP request with extended timeout and optimized settings
                $response = Http::timeout($this->timeout)
                    ->connectTimeout(30)
                    ->retry(2, 1000) // Retry 2 times with 1 second delay
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'Content-Type' => 'application/json',
                        'User-Agent' => 'Laravel-DeepSeek-Client/1.0',
                        'Accept' => 'application/json'
                    ])
                    ->withOptions([
                        'verify' => false, // Disable SSL verification if needed
                        'http_errors' => false
                    ])
                    ->post($this->apiUrl, $requestData);

                if ($response->successful()) {
                    $responseData = $response->json();
                    
                    // Validate response structure
                    if (isset($responseData['choices'][0]['message']['content'])) {
                        Log::info('DeepSeek API Success', [
                            'attempt' => $attempt,
                            'response_size' => strlen($responseData['choices'][0]['message']['content'])
                        ]);
                        return $responseData;
                    } else {
                        throw new \Exception('Invalid response structure from DeepSeek API');
                    }
                } else {
                    $errorMessage = "HTTP {$response->status()}: " . $response->body();
                    Log::error('DeepSeek API HTTP Error', [
                        'attempt' => $attempt,
                        'status' => $response->status(),
                        'response' => $response->body()
                    ]);
                    throw new \Exception($errorMessage);
                }
                
            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning('DeepSeek Service Attempt Failed', [
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                    'remaining_attempts' => $this->retryAttempts - $attempt
                ]);
                
                // If this isn't the last attempt, wait before retrying
                if ($attempt < $this->retryAttempts) {
                    sleep(2 * $attempt); // Progressive delay: 2s, 4s, 6s
                }
            }
        }
        
        // All attempts failed
        Log::error('DeepSeek Service All Attempts Failed', [
            'total_attempts' => $this->retryAttempts,
            'final_error' => $lastException->getMessage()
        ]);
        
        throw new \Exception('DeepSeek API failed after ' . $this->retryAttempts . ' attempts: ' . $lastException->getMessage());
    }

    public function generateContent($prompt)
    {
        return $this->describeProduct(['prompt' => $prompt]);
    }
}

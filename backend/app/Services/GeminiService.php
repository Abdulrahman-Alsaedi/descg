<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('app.gemini_api_key');
        
        if (empty($this->apiKey)) {
            throw new \Exception('GEMINI_API_KEY is not set in the environment variables.');
        }
    }

    public function describeProduct(array $data)
    {
        // Ensure we have the proper structure for Gemini API
        $requestData = [
            'contents' => $data['contents'] ?? [
                [
                    'parts' => [
                        ['text' => $data['prompt'] ?? '']
                    ]
                ]
            ]
        ];
        
        // Add generation configuration if provided
        if (isset($data['generationConfig'])) {
            $requestData['generationConfig'] = $data['generationConfig'];
        }

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-goog-api-key' => $this->apiKey,
        ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', $requestData);

        if ($response->failed()) {
            throw new \Exception('Failed to connect to Gemini API: ' . $response->body());
        }

        return $response->json();
    }

    public function generateContent(array $data)
    {
        
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-goog-api-key' => $this->apiKey,
        ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $data['text']]
                    ]
                ]
            ]
        ]);

        if ($response->failed()) {
            throw new \Exception('Failed to connect to Gemini APIDDDDD: ' . $response->body());
        }

        return $response->json();
    }
}

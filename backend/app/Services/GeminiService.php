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
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', $data);

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
            throw new \Exception('Failed to connect to Gemini API: ' . $response->body());
        }

        return $response->json();
    }
}

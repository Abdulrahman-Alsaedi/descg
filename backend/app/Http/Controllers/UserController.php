<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SallaToken;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;



class UserController extends Controller
{
 

public function register(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|min:6',
        'salla_code' => 'nullable|string',
        'salla_scope' => 'nullable|string', 
        'salla_state' => 'nullable|string',
    ]);

    
    $user = User::create([
        'name' => $request->input('name'),
        'email' => $request->input('email'),
        'password' => Hash::make($request->input('password')),
        'salla_code' => $request->input('salla_code'), 
        'salla_scope' => $request->input('salla_scope'), 
        'salla_state' => $request->input('salla_state'),
    ]);

    $sallaCode = $request->input('salla_code');
    $sallaScope = $request->input('salla_scope');
    $sallaData = null;

    \Log::info('Salla client env', [
    'client_id' => env('SALLA_CLIENT_ID'),
    'client_secret' => env('SALLA_CLIENT_SECRET') ,
    'redirect_uri' => env('SALLA_REDIRECT_URI')
]);
    if ($sallaCode) {
        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'client_id' => env('SALLA_CLIENT_ID'),
            'client_secret' => env('SALLA_CLIENT_SECRET'),
            'grant_type' => 'authorization_code',
            'code' => $sallaCode,
            'scope' => $sallaScope, 
            'redirect_uri' => env('SALLA_REDIRECT_URI'),
        ]);

        if ($response->successful()) {
            $data = $response->json();

            // Save to salla_tokens table
            $user->sallaToken()->create([
                'access_token' => $data['access_token'] ?? '',
                'refresh_token' => $data['refresh_token'] ?? '',
                'scope' => $data['scope'] ?? '',
                'token_type' => $data['token_type'] ?? '',
                'expires_in' => $data['expires_in'] ?? 0,
            ]);
            \Log::info('Salla HTTP status', ['status' => $response->status()]);
            \Log::info('Salla HTTP body', ['body' => $response->body()]);

            $sallaData = $data;
        } else {
            \Log::error('Salla token exchange failed', ['response' => $response->body()]);
        }
    }

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'message' => 'User registered successfully',
        'token' => $token,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'salla_connected' => $user->sallaToken()->exists()
        ],
        'salla' => $sallaData
    ], 201);
}


 function login(Request $request)
    {
        // Validate the request
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // Logic to authenticate a user
        $user = User::where('email', $request->input('email'))->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;
        
        return response()->json([
            'message' => 'Login successful', 
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ]
        ], 200);
    }

}

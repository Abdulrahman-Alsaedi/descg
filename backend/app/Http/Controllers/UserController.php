<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SallaToken;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\SendOtpMail;
use App\Models\Otp;
use Illuminate\Support\Carbon;

class UserController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'min:8',              // Minimum 8 characters
                'regex:/[a-z]/',      // At least one lowercase letter
                'regex:/[A-Z]/',      // At least one uppercase letter
                'regex:/[0-9]/',      // At least one digit
                'regex:/[^a-zA-Z0-9]/' // At least one special character
            ],
            'salla_code' => 'nullable|string',
            'salla_scope' => 'nullable|string',
            'salla_state' => 'nullable|string',
        ]);

        $email = $request->email;

        // Check if user already exists and is verified
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            return response()->json(['message' => 'Email already exists'], 400);
        }

        // Generate OTP
        $otpCode = rand(100000, 999999);
        
        // Delete old registration OTPs for this email
        Otp::where('email', $email)
            ->where('type', 'registration')
            ->delete();

        // Store OTP with temporary user data
        $otpData = [
            'name' => $request->name,
            'email' => $email,
            'password' => $request->password, // We'll hash this during verification
            'salla_code' => $request->salla_code,
            'salla_scope' => $request->salla_scope,
            'salla_state' => $request->salla_state,
        ];
        
        $otp = Otp::create([
            'email' => $email,
            'code' => $otpCode,
            'type' => 'registration',
            'expires_at' => Carbon::now()->addMinutes(5),
            'used' => false,
            'data' => $otpData
        ]);

        // Debug: Log what we stored
        Log::info('OTP created', [
            'otp_id' => $otp->id,
            'data_stored' => $otpData,
            'data_type' => gettype($otp->data)
        ]);

        // Send OTP email
        try {
            Mail::to($email)->send(new SendOtpMail($otpCode, 'registration'));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send verification email'], 500);
        }

        // Return success response with OTP requirement
        $response = [
            'message' => 'Verification code sent to your email',
            'otp_required' => true
        ];
        
        // For development, include OTP in response
        if (config('app.env') === 'local') {
            $response['dev_otp'] = $otpCode;
        }

        return response()->json($response);
    }

    public function verifyRegistrationOTP(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $email = $request->email;
        $otpCode = $request->otp;

        // Find and verify OTP
        $otp = Otp::where('email', $email)
            ->where('code', $otpCode)
            ->where('type', 'registration')
            ->where('used', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Invalid or expired OTP code'], 400);
        }

        // Debug: Log the OTP data
        Log::info('OTP found', [
            'otp_id' => $otp->id,
            'data_field' => $otp->data,
            'data_type' => gettype($otp->data)
        ]);

        // Get temporary user data from OTP
        $tempUserData = $otp->data;
        
        // Debug: Log the decoded data
        Log::info('User data from OTP', [
            'tempUserData' => $tempUserData,
            'data_type' => gettype($tempUserData)
        ]);
        
        if (!$tempUserData) {
            return response()->json(['message' => 'Registration data not found. Please start over.'], 400);
        }

        // Mark OTP as used
        $otp->update(['used' => true]);

        // Create the actual user account
        $user = User::create([
            'name' => $tempUserData['name'],
            'email' => $tempUserData['email'],
            'password' => Hash::make($tempUserData['password']),
        ]);

        // Handle Salla OAuth token exchange if code provided
        if (!empty($tempUserData['salla_code'])) {
            try {
                $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
                    'client_id' => $_ENV['SALLA_CLIENT_ID'],
                    'client_secret' => $_ENV['SALLA_CLIENT_SECRET'],
                    'grant_type' => 'authorization_code',
                    'code' => $tempUserData['salla_code'],
                    'scope' => $tempUserData['salla_scope'],
                    'redirect_uri' => $_ENV['SALLA_REDIRECT_URI'],
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    // Save Salla token relation
                    $user->sallaToken()->create([
                        'access_token' => $data['access_token'],
                        'refresh_token' => $data['refresh_token'] ?? null,
                        'scope' => $data['scope'] ?? null,
                        'token_type' => $data['token_type'] ?? null,
                        'expires_in' => $data['expires_in'] ?? null,
                    ]);
                } else {
                    Log::error('Salla token exchange failed', ['response' => $response->body()]);
                }
            } catch (\Exception $e) {
                Log::error('Salla token exchange error', ['error' => $e->getMessage()]);
            }
        }

        // Delete the OTP record after successful verification
        $otp->delete();

        // Generate auth token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully!',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[^a-zA-Z0-9]/'
            ],
            'otp' => 'nullable|string',
            'type' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // Debug login attempt
        Log::info('Login attempt', [
            'email' => $request->email,
            'user_found' => $user ? true : false,
            'user_id' => $user ? $user->id : null,
            'password_provided' => $request->password ? 'yes' : 'no'
        ]);

        if (!$user || !Hash::check($request->password, $user->password)) {
            Log::info('Login failed', [
                'user_exists' => $user ? true : false,
                'password_check' => $user ? Hash::check($request->password, $user->password) : false,
                'user_password_length' => $user ? strlen($user->password) : 0
            ]);
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        Log::info('Login successful', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        // Check if this is a simple password login (no OTP required)
        if (!$request->has('otp') && !$request->has('type')) {
            // Simple password-based login
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ]);
        }

        // OTP login flow
        if (!$request->otp) {
            $otpCode = rand(100000, 999999);

            Otp::where('email', $request->email)
                ->where('type', "login")
                ->delete();

            $otp = Otp::create([
                'email' => $request->email,
                'code' => $otpCode,
                'type' => "login",
                'expires_at' => Carbon::now()->addMinutes(5),
            ]);

            Mail::to($user->email)->send(new SendOtpMail($otpCode));

            // For local development, include OTP in response
            $response = ['message' => 'OTP sent. Please verify.', 'otp_required' => true];
            if (config('app.env') === 'local') {
                $response['dev_otp'] = $otpCode;
            }

            return response()->json($response);
        }

        // OTP included - verify it
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:login',
            'otp' => 'required',
        ]);

        $otp = Otp::where('email', $request->email)
            ->where('type', "login")
            ->where('code', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        $otp->used = true;
        $otp->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }

    // Password reset with OTP
    public function resetPassword(Request $request)
    {
        $action = $request->input('action', 'send_otp');

        if ($action === 'send_otp') {
            $request->validate([
                'email' => 'required|email',
            ]);

            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['message' => 'No account found with this email address'], 404);
            }

            $otpCode = rand(100000, 999999);

            // Delete old password reset OTPs
            Otp::where('email', $request->email)
                ->where('type', 'password_reset')
                ->delete();

            Otp::create([
                'email' => $request->email,
                'code' => $otpCode,
                'type' => 'password_reset',
                'expires_at' => Carbon::now()->addMinutes(10),
            ]);

            try {
                Mail::to($request->email)->send(new SendOtpMail($otpCode, 'password_reset'));
            } catch (\Exception $e) {
                return response()->json(['message' => 'Failed to send OTP email'], 500);
            }

            return response()->json(['message' => 'Password reset code sent to your email']);
        }

        if ($action === 'verify_otp') {
            $request->validate([
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
            ]);

            $otp = Otp::where('email', $request->email)
                ->where('code', $request->otp)
                ->where('type', 'password_reset')
                ->where('used', false)
                ->where('expires_at', '>', Carbon::now())
                ->first();

            if (!$otp) {
                return response()->json(['message' => 'Invalid or expired OTP code'], 400);
            }

            return response()->json(['message' => 'OTP verified successfully']);
        }

        if ($action === 'reset_password') {
            $request->validate([
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/[a-z]/',
                    'regex:/[A-Z]/',
                    'regex:/[0-9]/',
                    'regex:/[^a-zA-Z0-9]/'
                ],
                'password_confirmation' => 'required|same:password',
            ]);

            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $otp = Otp::where('email', $request->email)
                ->where('code', $request->otp)
                ->where('type', 'password_reset')
                ->where('used', false)
                ->where('expires_at', '>', Carbon::now())
                ->first();

            if (!$otp) {
                return response()->json(['message' => 'Invalid or expired OTP code'], 400);
            }

            // Update password and mark OTP as used
            $user->password = Hash::make($request->password);
            $user->save();

            $otp->update(['used' => true]);

            return response()->json(['message' => 'Password reset successfully']);
        }

        return response()->json(['message' => 'Invalid action'], 400);
    }
}

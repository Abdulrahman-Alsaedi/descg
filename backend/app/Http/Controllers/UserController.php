<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SallaToken;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
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
            'otp' => 'nullable|string',
            'type' => 'nullable|string',
            'salla_code' => 'nullable|string',
            'salla_scope' => 'nullable|string',
            'salla_state' => 'nullable|string',
        ]);

        $email = $request->email;

        // Check if user exists
        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email already exists'], 400);
        }

        // OTP registration flow
        if (!$request->otp) {
            $otpCode = rand(100000, 999999);
            // Delete old registration OTPs
            Otp::where('email', $email)
                ->where('type', "registration")
                ->delete();

            $otp = Otp::create([
                'email' => $email,
                'code' => $otpCode,
                'type' => "registration",
                'expires_at' => Carbon::now()->addMinutes(5),
            ]);
            Mail::to($email)->send(new SendOtpMail($otpCode));

            return response()->json(['message' => 'OTP sent', 'otp_required' => true]);
        }

        // OTP was sent - validate it
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:registration',
            'otp' => 'required',
        ]);

        $otp = Otp::where('email', $email)
            ->where('type', "registration")
            ->where('code', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        $otp->used = true;
        $otp->save();

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $email,
            'password' => Hash::make($request->password),
        ]);

        // Handle Salla OAuth token exchange if code provided
        if ($request->filled('salla_code')) {
            $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
                'client_id' => $_ENV['SALLA_CLIENT_ID'],
                'client_secret' => $_ENV['SALLA_CLIENT_SECRET'],
                'grant_type' => 'authorization_code',
                'code' => $request->input('salla_code'),
                'scope' => $request->input('salla_scope'),
                'redirect_uri' => $_ENV['SALLA_REDIRECT_URI'],
            ]);

            if ($response->successful()) {
                $data = $response->json();

                // Save or update Salla token relation
                $user->sallaToken()->updateOrCreate([], [
                    'access_token' => $data['access_token'],
                    'refresh_token' => $data['refresh_token'] ?? null,
                    'scope' => $data['scope'] ?? null,
                    'token_type' => $data['token_type'] ?? null,
                    'expires_in' => $data['expires_in'] ?? null,
                ]);
            } else {
                \Log::error('Salla token exchange failed', ['response' => $response->body()]);
                return response()->json(['message' => 'Failed to connect with Salla'], 500);
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

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
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

            return response()->json(['message' => 'OTP sent. Please verify.', 'otp_required' => true]);
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

        if (!$user) {
            return response()->json(['message' => 'No account found'], 404);
        }

        if (!$request->otp) {
            $otpCode = rand(100000, 999999);

            Otp::where('email', $request->email)
                ->where('type', "password_reset")
                ->delete();

            $otp = Otp::create([
                'email' => $request->email,
                'code' => $otpCode,
                'type' => "password_reset",
                'expires_at' => Carbon::now()->addMinutes(5),
            ]);

            Mail::to($user->email)->send(new SendOtpMail($otpCode));

            return response()->json(['message' => 'OTP sent', 'otp_required' => true]);
        }

        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:password_reset',
            'otp' => 'required',
        ]);

        $otp = Otp::where('email', $request->email)
            ->where('type', "password_reset")
            ->where('code', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        $otp->used = true;
        $otp->save();

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password has been reset!']);
    }
}
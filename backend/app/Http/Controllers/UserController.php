<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
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
            'otp' => 'nullable|string'
        ]);

        $email = $request->email;

        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email already exists'], 400);
        }

        // Step 1: If no OTP sent, generate and return
        if (!$request->otp) {
            $otpCode = rand(100000, 999999);
            // Delete any old OTPs for this email & type
            Otp::where('email', $request->email)
                ->where('type', "registration")
                ->delete();

            $otp = Otp::create([
                'email' => $request->email,
                'code' => $otpCode,
                'type' => "registration",
                'expires_at' => Carbon::now()->addMinutes(5),
            ]);
            Mail::to($email)->send(new SendOtpMail($otpCode));

            return response()->json(['message' => 'OTP sent', 'otp_required' => true]);
        }

        // Step 2: If OTP included, validate it and create user
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:registration',
            'otp' => 'required'
        ]);

        $otp = Otp::where('email', $request->email)
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
                'min:8',              // Minimum 8 characters
                'regex:/[a-z]/',      // At least one lowercase letter
                'regex:/[A-Z]/',      // At least one uppercase letter
                'regex:/[0-9]/',      // At least one digit
                'regex:/[^a-zA-Z0-9]/' // At least one special character
            ],
            'otp' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Step 1: If OTP is not included, send it
        if (!$request->otp) {
            $otpCode = rand(100000, 999999);
            // Delete any old OTPs for this email & type
            Otp::where('email', $request->email)
                ->where('type', "login")
                ->delete();

            $otp = Otp::create([
                'email' => $request->email,
                'code' => $otpCode,
                'type' => "login",
                'expires_at' => Carbon::now()->addMinutes(5),
            ]);

            // send email
            Mail::to($user->email)->send(new SendOtpMail($otpCode));

            return response()->json(['message' => 'OTP sent. Please verify.', 'otp_required' => true]);
        }

        // Step 2: OTP was included — verify it
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:login',
            'otp' => 'required'
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

        // token generation
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }


    // Reset password
    public function resetPassword(Request $request)
    {
        $request->validate([
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
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'No account found'], 404);
        }

        // Step 1: If OTP is not included, send it
        if (!$request->otp) {
            $otpCode = rand(100000, 999999);
            
            // Delete any old OTPs for this email & type
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
        
        // Step 2: If OTP was included, verify it
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:password_reset',
            'otp' => 'required'
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
        // Update the user's password
        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password has been reset!']);
    }

}

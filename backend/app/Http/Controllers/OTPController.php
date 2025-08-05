<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Otp;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendOtpMail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class OTPController extends Controller
{
    public function sendOTP(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|string|in:registration,password_reset,login'
        ]);

        $email = $request->email;
        $type = $request->type;

        // For password reset, check if user exists
        if ($type === 'password_reset') {
            $user = User::where('email', $email)->first();
            if (!$user) {
                return response()->json(['message' => 'User not found with this email address'], 404);
            }
        }

        // Generate OTP
        $otpCode = rand(100000, 999999);

        // Delete old OTPs of this type for this email
        Otp::where('email', $email)
            ->where('type', $type)
            ->delete();

        // Create new OTP
        Otp::create([
            'email' => $email,
            'code' => $otpCode,
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes(10),
            'used' => false,
        ]);

        // Send OTP via email
        try {
            Mail::to($email)->send(new SendOtpMail($otpCode, $type));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send OTP email'], 500);
        }

        return response()->json(['message' => 'OTP sent successfully']);
    }

    public function verifyOTP(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'type' => 'required|string|in:registration,password_reset,login'
        ]);

        $email = $request->email;
        $otpCode = $request->otp;
        $type = $request->type;

        // Find the OTP
        $otp = Otp::where('email', $email)
            ->where('code', $otpCode)
            ->where('type', $type)
            ->where('used', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return response()->json(['message' => 'Invalid or expired OTP'], 400);
        }

        // Mark OTP as used
        $otp->update(['used' => true]);

        return response()->json(['message' => 'OTP verified successfully']);
    }

    public function resendOTP(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|string|in:registration,password_reset,login'
        ]);

        $email = $request->email;
        $type = $request->type;

        // For registration type, check if there's temporary user data
        if ($type === 'registration') {
            $tempUserData = session("temp_user_{$email}");
            if (!$tempUserData) {
                return response()->json(['message' => 'Registration session expired. Please start over.'], 400);
            }
        }

        // For password reset, check if user exists
        if ($type === 'password_reset') {
            $user = User::where('email', $email)->first();
            if (!$user) {
                return response()->json(['message' => 'User not found with this email address'], 404);
            }
        }

        // Generate new OTP
        $otpCode = rand(100000, 999999);

        // Delete old OTPs of this type for this email
        Otp::where('email', $email)
            ->where('type', $type)
            ->delete();

        // Create new OTP
        Otp::create([
            'email' => $email,
            'code' => $otpCode,
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes($type === 'password_reset' ? 10 : 5),
            'used' => false,
        ]);

        // Send OTP via email
        try {
            Mail::to($email)->send(new SendOtpMail($otpCode, $type));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send OTP email'], 500);
        }

        $response = ['message' => 'OTP sent successfully'];
        
        // For development, include OTP in response
        if (config('app.env') === 'local') {
            $response['dev_otp'] = $otpCode;
        }

        return response()->json($response);
    }
}

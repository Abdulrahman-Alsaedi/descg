<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
            margin-bottom: 30px;
        }
        .logo {
            width: 64px;
            height: 64px;
            background: linear-gradient(45deg, #3b82f6, #8b5cf6);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .otp-code {
            text-align: center;
            margin: 30px 0;
        }
        .otp-box {
            display: inline-block;
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px 30px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #495057;
            margin: 10px 0;
        }
        .type-message {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeeba;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">✨</div>
            <h1>{{ $type === 'password_reset' ? 'Password Reset' : ($type === 'login' ? 'Login Verification' : 'Account Verification') }}</h1>
        </div>

        <div class="type-message">
            @if($type === 'password_reset')
                You requested to reset your password. Use the code below to proceed:
            @elseif($type === 'login')
                Complete your login by entering the verification code below:
            @else
                Complete your account registration by entering the verification code below:
            @endif
        </div>

        <div class="otp-code">
            <div class="otp-box">{{ $otp }}</div>
            <p>This code will expire in {{ $type === 'password_reset' ? '10' : '5' }} minutes.</p>
        </div>

        <div class="warning">
            <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for this code.
        </div>

        <div class="footer">
            <p>If you didn't request this {{ $type === 'password_reset' ? 'password reset' : ($type === 'login' ? 'login' : 'verification') }}, please ignore this email.</p>
            <p>&copy; {{ date('Y') }} DESCG. All rights reserved.</p>
        </div>
    </div>
</body>
</html>Hello,</p>
<p>Your OTP code is: <strong>{{ $otp }}</strong></p>
<p>It will expire in 5 minutes. Don’t share it with anyone.</p>

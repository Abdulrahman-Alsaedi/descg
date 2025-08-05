import React, { useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PasswordInput } from './ui/PasswordInput';
import { Card } from './ui/Card';
import { useToast } from '../contexts/ToastContext';
import { OTPVerification } from './OTPVerification';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { error, success } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.descg.store/api/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send OTP');
      }

      const data = await response.json();
      if (data.otp_required) {
        success('OTP sent to your email!');
        setStep('otp');
      }
    } catch (err: any) {
      error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    // For OTP verification, we'll set the OTP and move to reset step
    // The actual verification happens when resetting the password
    setOtp(otpCode);
    setStep('reset');
    return Promise.resolve();
  };

  const handleResendOTP = async () => {
    const response = await fetch('https://api.descg.store/api/password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to resend OTP');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    // Password strength validation
    const passwordRegex = {
      lowercase: /[a-z]/,
      uppercase: /[A-Z]/,
      number: /[0-9]/,
      special: /[^a-zA-Z0-9]/
    };

    if (!passwordRegex.lowercase.test(newPassword) ||
        !passwordRegex.uppercase.test(newPassword) ||
        !passwordRegex.number.test(newPassword) ||
        !passwordRegex.special.test(newPassword)) {
      error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.descg.store/api/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp, 
          password: newPassword,
          type: 'password_reset'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      success('Password reset successfully! You can now log in with your new password.');
      // Add a small delay to let user see the success message
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: any) {
      error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <OTPVerification
        email={email}
        onVerifySuccess={() => {}}
        onBack={() => setStep('email')}
        onResendOTP={handleResendOTP}
        onVerifyOTP={handleVerifyOTP}
        title="Reset Password"
        description="Enter the 6-digit code sent to your email to reset your password"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
          </h1>
          <p className="text-gray-600">
            {step === 'email' 
              ? 'Enter your email to receive a reset code' 
              : 'Enter your new password below'
            }
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Send Reset Code
            </Button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              showValidation={false}
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Reset Password
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </button>
        </div>
      </Card>
    </div>
  );
};
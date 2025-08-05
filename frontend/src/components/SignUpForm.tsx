import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PasswordInput } from './ui/PasswordInput';
import { Card } from './ui/Card';
import { OTPVerification } from './OTPVerification';

export const SignUpForm: React.FC<{ onSignUpSuccess?: () => void; onShowLogin?: () => void }> = ({ onSignUpSuccess, onShowLogin }) => {
  const [step, setStep] = useState<'signup' | 'otp'>('signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { register, verifyOTP, resendOTP } = useAuth();
  const { error, success } = useToast();

  // Get Salla OAuth params from URL
  const code = getUrlParam('code');
  const scope = getUrlParam('scope');
  const state = getUrlParam('state');

  function getUrlParam(key: string): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      error('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const sallaData = code ? {
        salla_code: code,
        salla_scope: scope,
        salla_state: state
      } : undefined;

      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        sallaData
      );

      if (result && result.otpRequired) {
        setLoading(false); // Set loading to false when transitioning to OTP
        setStep('otp');
        success('Verification code sent to your email');
        return; // Early return to prevent further processing
      } else {
        setLoading(false);
        success('Account created successfully!');
        if (onSignUpSuccess) onSignUpSuccess();
      }
    } catch (err: any) {
      if (err.message.includes('CORS') || err.message.includes('fetch')) {
        error('Unable to connect to server. Please check your internet connection.');
      } else {
        error(err.message || 'Failed to create account');
      }
      setLoading(false); // Only set loading to false on error
    }
    // Remove the finally block that was setting loading to false always
  };

  const handleOTPVerify = async (otp: string) => {
    setLoading(true);
    try {
      const sallaData = code ? {
        salla_code: code,
        salla_scope: scope,
        salla_state: state
      } : undefined;

      await verifyOTP(
        formData.name,
        formData.email,
        formData.password,
        otp,
        sallaData
      );

      success('Account created successfully!');
      if (onSignUpSuccess) onSignUpSuccess();
    } catch (err: any) {
      error(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await resendOTP(formData.email);
      success('Verification code resent to your email');
    } catch (err: any) {
      error(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Show OTP verification step
  if (step === 'otp') {
    return (
      <OTPVerification
        email={formData.email}
        onVerifySuccess={() => {
          if (onSignUpSuccess) onSignUpSuccess();
        }}
        onBack={() => setStep('signup')}
        onResendOTP={handleResendOTP}
        onVerifyOTP={handleOTPVerify}
        title="Verify Your Account"
        description="Enter the 6-digit code sent to your email to complete registration"
      />
    );
  }

  // Show signup form step
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Sign up to start using the platform</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your name"
            required
            disabled={loading}
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />

          <PasswordInput
            label="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign Up
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:underline font-medium"
            onClick={onShowLogin}
          >
            Sign in here
          </button>
        </div>
      </Card>
    </div>
  );
};

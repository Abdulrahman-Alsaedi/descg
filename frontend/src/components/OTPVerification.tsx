import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useToast } from '../contexts/ToastContext';

interface OTPVerificationProps {
  email: string;
  onVerifySuccess: () => void;
  onBack: () => void;
  onResendOTP: () => Promise<void>;
  onVerifyOTP: (otp: string) => Promise<void>;
  title?: string;
  description?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onVerifySuccess,
  onBack,
  onResendOTP,
  onVerifyOTP,
  title = "Verify Your Email",
  description = "Enter the 6-digit code sent to your email"
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { error, success } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await onVerifyOTP(otpString);
      success('Email verified successfully!');
      onVerifySuccess();
    } catch (err) {
      error('Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await onResendOTP();
      success('OTP code resent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-2">{description}</p>
          <p className="text-sm text-gray-500">Sent to: {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                autoComplete="off"
              />
            ))}
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Verify Code
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Didn't receive the code?
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            loading={resendLoading}
            disabled={countdown > 0}
            className="text-blue-600 hover:text-blue-700"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to form
          </button>
        </div>
      </Card>
    </div>
  );
};
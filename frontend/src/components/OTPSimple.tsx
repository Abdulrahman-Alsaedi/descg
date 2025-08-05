import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onBack: () => void;
  onResend?: () => Promise<void>;
  loading?: boolean;
}

export function OTPVerification({ 
  email, 
  onVerify, 
  onBack, 
  onResend, 
  loading = false 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      await onVerify(otp);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to <br />
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-digit code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl font-mono"
              disabled={loading}
              maxLength={6}
            />
          </div>

          <Button 
            type="submit" 
            loading={loading} 
            disabled={otp.length !== 6}
            className="w-full" 
            size="lg"
          >
            Verify Code
          </Button>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={loading}
            >
              Back
            </Button>

            {onResend && (
              <Button
                type="button"
                variant="ghost"
                onClick={onResend}
                disabled={loading}
                className="text-sm"
              >
                Resend Code
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PasswordInput } from './ui/PasswordInput';
import { Card } from './ui/Card';


interface LoginFormProps {
  onShowSignUp?: () => void;
  onShowForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onShowSignUp, onShowForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error, success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!email || !password) {
      error('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      success('Login successful! Welcome back!');
    } catch (err) {
      error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your merchant account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            showValidation={false}
            required
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onShowForgotPassword}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-2 text-center text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:underline font-medium"
            onClick={onShowSignUp}
          >
            Sign up here
          </button>
        </div>
      </Card>
    </div>
  );
};
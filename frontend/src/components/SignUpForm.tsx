import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

export const SignUpForm: React.FC<{ onSignUpSuccess?: () => void }> = ({ onSignUpSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { error, success } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get Salla OAuth params from URL
  const code = getUrlParam('code');
  const scope = getUrlParam('scope');
  const state = getUrlParam('state');

  function getUrlParam(key: string): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!name || !email || !password) {
      error('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.descg.store/api/register', {
    setError('');
    setSuccess('');

    try {
      const payload: any = { name, email, password };

      // Add Salla params to payload if available
      if (code) payload.salla_code = code;
      if (scope) payload.salla_scope = scope;
      if (state) payload.salla_state = state;

      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message?.includes('email')) {
          throw new Error('Email already exists');
        }
        throw new Error('Failed to create account');
      }

      success('Account created successfully! You can now log in.');

      if (!response.ok) throw new Error('Failed to sign up');

      setSuccess('Account created! You can now log in.');
      setName('');
      setEmail('');
      setPassword('');
      if (onSignUpSuccess) onSignUpSuccess();
      
    } catch (err: any) {
      if (err.message === 'Email already exists') {
        error('An account with this email already exists');
      } else {
        error('Failed to create account. Please try again.');
      }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Sign up to start using the platform</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
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
            onClick={onSignUpSuccess}
          >
            Log in here
          </button>
        </div>
      </Card>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showValidation?: boolean;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a-z)',
    test: (password) => /[a-z]/.test(password)
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A-Z)',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    id: 'number',
    label: 'One number (0-9)',
    test: (password) => /[0-9]/.test(password)
  },
  {
    id: 'special',
    label: 'One special character (!@#$%^&*)',
    test: (password) => /[^a-zA-Z0-9]/.test(password)
  }
];

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label = 'Password',
  error,
  className = '',
  showValidation = true,
  value = '',
  onChange,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const validationResults = useMemo(() => {
    const password = value as string;
    return passwordRequirements.map(req => ({
      ...req,
      isValid: req.test(password)
    }));
  }, [value]);

  const allValid = validationResults.every(req => req.isValid);
  const showValidationPanel = showValidation && (isFocused || (value as string).length > 0);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          } ${className}`}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {showValidationPanel && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
          <p className="text-xs font-medium text-gray-600 mb-2">Password must contain:</p>
          <div className="space-y-1">
            {validationResults.map((req) => (
              <div key={req.id} className="flex items-center gap-2 text-xs">
                {req.isValid ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <X className="w-3 h-3 text-red-500" />
                )}
                <span className={req.isValid ? 'text-green-700' : 'text-gray-600'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
          {allValid && (value as string).length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
              <Check className="w-3 h-3" />
              <span className="font-medium">Password meets all requirements!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

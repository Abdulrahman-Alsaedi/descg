import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  showPasswordToggle = false,
  type: initialType = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [type, setType] = useState(initialType);

  const togglePassword = () => {
    setShowPassword(!showPassword);
    setType(showPassword ? 'password' : 'text');
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          } ${showPasswordToggle ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {showPasswordToggle && initialType === 'password' && (
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
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import type { LoginCredentials } from '../types';

interface LoginFormProps {
  onSubmit?: (credentials: LoginCredentials) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  errorMessage = null,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email.trim()) {
      setValidationError('Please enter your email or username.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    if (onSubmit) {
      await onSubmit({ email, password, rememberMe });
    }
  };

  const displayError = validationError || errorMessage;

  return (
    <div className="w-full max-w-[440px] bg-white border border-[#f1f3f5] rounded-xl p-8 shadow-sm transition-all hover:shadow-md">
      {/* Form Header */}
      <div className="mb-6 text-left">
        <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
          Welcome Back
        </h2>
        <p className="text-[14px] font-normal text-[#6c757d] mt-1">
          Please enter your credentials to access your portal.
        </p>
      </div>

      {/* Error Alert Box */}
      {displayError && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-[#93000b] leading-tight">
            {displayError}
          </p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="email"
            className="block text-[13px] font-semibold text-[#271816]"
          >
            Email or Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a3a3a3]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-lg text-[14px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="password"
            className="block text-[13px] font-semibold text-[#271816]"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a3a3a3]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-lg text-[14px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#a3a3a3] hover:text-[#5b403d] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-[#93000b] border-[#f1f3f5] rounded focus:ring-[#93000b] cursor-pointer"
            />
            <span className="text-[13px] font-medium text-[#5b403d]">
              Remember me
            </span>
          </label>

          <Link
            to="/forgot-password"
            className="text-[13px] font-semibold text-[#93000b] hover:text-[#7a0009] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[48px] mt-2 bg-[#93000b] hover:bg-[#7a0009] text-white font-semibold text-[14px] rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Footer Divider & Link */}
      <div className="mt-6 pt-5 border-t border-[#f1f3f5] text-center">
        <p className="text-[13px] text-[#6c757d]">
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            className="font-semibold text-[#93000b] hover:text-[#7a0009] transition-colors"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

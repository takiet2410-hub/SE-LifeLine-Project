import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Building2,
  Heart,
  ArrowRight,
} from 'lucide-react';
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
  const [idDocumentNumber, setIdDocumentNumber] = useState(() => localStorage.getItem('rememberedId') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedId'));
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleQuickFill = () => {
    setIdDocumentNumber('079099000999');
    setPassword('StrongPass123!');
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!idDocumentNumber.trim()) {
      setValidationError('Vui lòng nhập số CCCD (12 chữ số).');
      return;
    }
    if (!password) {
      setValidationError('Vui lòng nhập mật khẩu.');
      return;
    }

    if (onSubmit) {
      await onSubmit({
        idDocumentNumber: idDocumentNumber.trim(),
        password,
        rememberMe,
        role: 'Donor',
      });
    }
  };

  const displayError = validationError || errorMessage;

  return (
    <div className="w-full max-w-[440px] bg-white border border-[#f1f3f5] rounded-2xl p-7 md:p-8 shadow-sm transition-all hover:shadow-md">
      {/* Form Header */}
      <div className="mb-6 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
            Donor Sign In
          </h2>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-50 text-[#93000b] border border-red-100 flex items-center gap-1">
            <Heart className="w-3 h-3 text-[#93000b] fill-current" />
            Cổng Người Hiến Máu
          </span>
        </div>
        <p className="text-[13px] font-normal text-[#6c757d] mt-1">
          Nhập số CCCD và mật khẩu để quản lý lịch hẹn hiến máu cá nhân.
        </p>
      </div>

      {/* Error Alert Box */}
      {displayError && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-[#93000b] leading-tight">
            {displayError}
          </p>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID Document Number Input */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label
              htmlFor="idDocumentNumber"
              className="block text-[13px] font-semibold text-[#271816]"
            >
              Số CCCD (12 chữ số)
            </label>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-bold text-[#93000b] hover:underline cursor-pointer"
            >
              Điền mẫu CCCD Donor
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a3a3a3]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="idDocumentNumber"
              type="text"
              value={idDocumentNumber}
              onChange={(e) => setIdDocumentNumber(e.target.value)}
              placeholder="Ví dụ: 079099000999"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[14px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
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
            Mật khẩu
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
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-xl text-[14px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#a3a3a3] hover:text-[#5b403d] transition-colors cursor-pointer"
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
              Ghi nhớ đăng nhập
            </span>
          </label>

          <Link
            to="/forgot-password"
            className="text-[13px] font-semibold text-[#93000b] hover:text-[#7a0009] transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[48px] mt-2 bg-[#93000b] hover:bg-[#7a0009] text-white font-semibold text-[14px] rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực tài khoản Donor...</span>
            </>
          ) : (
            <span>Đăng Nhập Người Hiến Máu</span>
          )}
        </button>
      </form>

      {/* Direct Banner Link to Blood Center Login */}
      <div className="mt-6 p-3.5 bg-[#1a1a2e] text-white rounded-xl flex items-center justify-between shadow-2xs hover:bg-[#161628] transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#93000b] flex items-center justify-center text-white shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[12px] font-bold leading-tight text-white">Cán bộ Y tế / Kho Máu?</p>
            <p className="text-[10px] text-slate-300">Cổng quản trị Blood Center Staff</p>
          </div>
        </div>
        <Link
          to="/bc/login"
          className="px-3 py-1.5 bg-[#93000b] hover:bg-[#7a0009] text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
        >
          <span>Cổng Staff</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Footer Divider & Link */}
      <div className="mt-5 pt-4 border-t border-[#f1f3f5] text-center">
        <p className="text-[13px] text-[#6c757d]">
          Chưa có tài khoản hiến máu?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#93000b] hover:text-[#7a0009] transition-colors"
          >
            Đăng ký bằng CCCD
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

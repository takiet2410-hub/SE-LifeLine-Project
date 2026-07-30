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
  Shield,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { LoginCredentials } from '../types';

interface LoginFormProps {
  onSubmit?: (credentials: LoginCredentials) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const ROLE_OPTIONS = [
  {
    id: 'Donor',
    label: 'Người Hiến Máu',
    shortLabel: 'Donor',
    description: 'Đặt lịch & theo dõi hồ sơ hiến máu',
    icon: Heart,
    color: 'bg-red-50 text-[#93000b] border-red-200',
    activeBg: 'bg-[#93000b] text-white border-[#93000b]',
    btnColor: 'bg-[#93000b] hover:bg-[#7a0009] text-white',
    placeholder: 'Ví dụ: 079099000999',
  },
  {
    id: 'BloodCenterStaff',
    label: 'Cán bộ TT Máu',
    shortLabel: 'Staff TT Máu',
    description: 'Quản lý chiến dịch, kho máu & tiếp nhận',
    icon: Building2,
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    activeBg: 'bg-blue-700 text-white border-blue-700',
    btnColor: 'bg-blue-700 hover:bg-blue-800 text-white',
    placeholder: 'Ví dụ: 079099000111',
  },
  {
    id: 'HospitalStaff',
    label: 'Cán bộ Bệnh Viện',
    shortLabel: 'Staff Bệnh Viện',
    description: 'Yêu cầu túi máu & điều phối y tế',
    icon: Shield,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    activeBg: 'bg-emerald-700 text-white border-emerald-700',
    btnColor: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    placeholder: 'Ví dụ: 079088000456',
  },
  {
    id: 'Administrator',
    label: 'Quản Trị Viên',
    shortLabel: 'Admin',
    description: 'Quản trị hệ thống & phân quyền',
    icon: UserCheck,
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    activeBg: 'bg-purple-700 text-white border-purple-700',
    btnColor: 'bg-purple-700 hover:bg-purple-800 text-white',
    placeholder: 'Ví dụ: 079077000789',
  },
] as const;

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  errorMessage = null,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(
    () => localStorage.getItem('rememberedRole') || 'Donor'
  );
  const [idDocumentNumber, setIdDocumentNumber] = useState(
    () => localStorage.getItem('rememberedId') || ''
  );
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedId'));
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setValidationError(null);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    if (validationError) setValidationError(null);
  };

  const handleQuickFillDonor = () => {
    setIdDocumentNumber('079099000999');
    setPassword('StrongPass123!');
    setSelectedRole('Donor');
    setValidationError(null);
  };

  const handleQuickFillStaff = () => {
    setIdDocumentNumber('079099000111');
    setPassword('StrongPass123!');
    setSelectedRole('BloodCenterStaff');
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
        role: selectedRole,
      });
    }
  };

  const displayError = validationError || errorMessage;
  const currentRoleConfig = ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[0];

  return (
    <div className="w-full max-w-[480px] bg-white border border-[#f1f3f5] rounded-2xl p-7 md:p-8 shadow-sm transition-all hover:shadow-md">
      {/* Form Header */}
      <div className="mb-6 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
            Đăng Nhập Hệ Thống
          </h2>
          <span
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full border flex items-center gap-1.5 transition-all ${currentRoleConfig.color}`}
          >
            <currentRoleConfig.icon className="w-3.5 h-3.5" />
            {currentRoleConfig.shortLabel}
          </span>
        </div>
        <p className="text-[13px] font-normal text-[#6c757d] mt-1">
          Chọn vai trò làm việc tương ứng để truy cập Cổng công tác thích hợp.
        </p>
      </div>

      {/* Role Selector Section */}
      <div className="mb-6 space-y-2 text-left">
        <div className="flex items-center justify-between">
          <label className="block text-[12px] font-bold uppercase tracking-wider text-[#6c757d]">
            Chọn vai trò đăng nhập (Role)
          </label>
          <span className="text-[11px] font-medium text-[#93000b]">
            {currentRoleConfig.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((opt) => {
            const IconComponent = opt.icon;
            const isSelected = selectedRole === opt.id;
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => handleRoleSelect(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  isSelected
                    ? `${opt.activeBg} shadow-xs scale-[1.01]`
                    : 'bg-[#fafafa] border-[#f1f3f5] text-[#271816] hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#93000b]'}`} />
                  <span className="text-[13px] font-bold truncate">{opt.label}</span>
                </div>
                <span className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-[#6c757d]'}`}>
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert Box */}
      {displayError && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-[#93000b] leading-tight text-left">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickFillDonor}
                className="text-[11px] font-bold text-[#93000b] hover:underline flex items-center gap-1 cursor-pointer"
                title="Tải nhanh tài khoản Mẫu Donor"
              >
                <Zap className="w-3 h-3 text-[#93000b]" />
                <span>Mẫu Donor</span>
              </button>
              <span className="text-[#a3a3a3] text-[10px]">•</span>
              <button
                type="button"
                onClick={handleQuickFillStaff}
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                title="Tải nhanh tài khoản Mẫu Staff"
              >
                <Zap className="w-3 h-3 text-blue-700" />
                <span>Mẫu Staff</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a3a3a3]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="idDocumentNumber"
              type="text"
              value={idDocumentNumber}
              onChange={(e) => handleInputChange(setIdDocumentNumber, e.target.value)}
              placeholder={currentRoleConfig.placeholder}
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
              onChange={(e) => handleInputChange(setPassword, e.target.value)}
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
          className={`w-full h-[48px] mt-2 font-semibold text-[14px] rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${currentRoleConfig.btnColor}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực ({currentRoleConfig.shortLabel})...</span>
            </>
          ) : (
            <span>Đăng Nhập ({currentRoleConfig.label})</span>
          )}
        </button>
      </form>

      {/* Footer Divider & Link */}
      <div className="mt-6 pt-4 border-t border-[#f1f3f5] text-center">
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

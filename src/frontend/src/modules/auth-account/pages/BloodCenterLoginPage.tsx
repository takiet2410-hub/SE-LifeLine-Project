import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Lock,
  CreditCard,
  ArrowRight,
  HeartHandshake,
  Eye,
  EyeOff,
  AlertCircle,
  Activity,
  Award,
  Sparkles,
  Zap
} from 'lucide-react';
import { loginUser } from '../api/authApi';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { toast } from 'sonner';

export const BloodCenterLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [idDocumentNumber, setIdDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRoleTab, setSelectedRoleTab] = useState<'staff' | 'doctor' | 'admin'>('staff');

  // Load remembered ID if available
  useEffect(() => {
    const savedId = localStorage.getItem('rememberedBcId');
    if (savedId) {
      setIdDocumentNumber(savedId);
      setRememberMe(true);
    }
  }, []);

  const handleQuickDemoFill = (role: 'staff' | 'doctor' | 'admin') => {
    setSelectedRoleTab(role);
    if (role === 'staff') {
      setIdDocumentNumber('079099000123');
      setPassword('StrongPass123!');
      toast.info('Đã điền thông tin demo: Kỹ thuật viên Kho máu');
    } else if (role === 'doctor') {
      setIdDocumentNumber('079088000456');
      setPassword('StrongPass123!');
      toast.info('Đã điền thông tin demo: Bác sĩ Tiếp nhận & Khám lâm sàng');
    } else {
      setIdDocumentNumber('079077000789');
      setPassword('StrongPass123!');
      toast.info('Đã điền thông tin demo: Cán bộ Điều phối Quản trị');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idDocumentNumber.trim()) {
      setErrorMessage('Vui lòng nhập Mã Cán bộ / Số CCCD (12 chữ số).');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu cán bộ.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loginUser({
        idDocumentNumber: idDocumentNumber.trim(),
        password,
        rememberMe,
      });

      if (response.success && response.token && response.user) {
        const userRole = response.user.role || 'Donor';
        const roleLower = userRole.toLowerCase();
        const isStaffRole =
          userRole === 'BloodCenterStaff' ||
          userRole === 'Administrator' ||
          userRole === 'HospitalStaff' ||
          roleLower.includes('staff') ||
          roleLower.includes('admin') ||
          roleLower.includes('bloodcenter') ||
          roleLower.includes('hospital');

        // STRICT ACCESS CONTROL: Only Blood Center Staff / Staff roles are allowed
        if (!isStaffRole) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setErrorMessage(
            `Cảnh báo truy cập: Tài khoản CCCD (${idDocumentNumber.trim()}) thuộc vai trò '${userRole}'. Chỉ tài khoản Cán bộ (BloodCenterStaff) mới được phép đăng nhập Cổng Quản trị Trung tâm Truyền máu.`
          );
          setIsLoading(false);
          return;
        }

        const staffUser = {
          id: response.user.id || 'bc-staff-01',
          email: response.user.email || 'staff@lifeline.gov.vn',
          fullName: response.user.fullName || (
            selectedRoleTab === 'doctor'
              ? 'BS. Nguyễn Văn A (Khoa Tiếp Nhận)'
              : selectedRoleTab === 'admin'
              ? 'KTV. Trần Thị B (Trưởng Kho Máu)'
              : 'Cán bộ Y Tế LifeLine'
          ),
          role: userRole,
        };

        login(response.token, staffUser);

        if (rememberMe) {
          localStorage.setItem('rememberedBcId', idDocumentNumber.trim());
        } else {
          localStorage.removeItem('rememberedBcId');
        }

        toast.success('Đăng nhập Cổng Quản trị Trung tâm Truyền máu thành công!');
        setTimeout(() => {
          navigate('/bc/campaigns');
        }, 800);
      } else {
        setErrorMessage(
          response.message || 'Mã Cán bộ hoặc Mật khẩu không chính xác. Vui lòng kiểm tra lại.'
        );
      }
    } catch (err) {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Grid & Neon Flares */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/15 rounded-full blur-[128px] pointer-events-none" />

      {/* Left Branding & System Overview */}
      <div className="md:w-1/2 lg:w-7/12 bg-gradient-to-br from-slate-950 via-slate-900/90 to-red-950/30 p-8 lg:p-16 flex flex-col justify-between relative z-10 border-b md:border-b-0 md:border-r border-slate-800/80 backdrop-blur-xl">
        {/* Top Branding Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/40 ring-4 ring-red-500/10">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">LifeLine</h1>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-red-400" />
                  BloodCenter Staff
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Cổng Điều Phối & Quản Lý Kho Máu Quốc Gia</p>
            </div>
          </div>

          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-xs"
          >
            <HeartHandshake className="w-4 h-4 text-red-400" />
            <span>Cổng Người Hiến Máu</span>
          </Link>
        </div>

        {/* Center Presentation & Core Features */}
        <div className="my-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>Bảo mật Chuẩn Y Tế ISO/IEC 27001</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            Hệ Thống Quản Trị <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
              Trung Tâm Truyền Máu
            </span>
          </h2>

          <p className="mt-4 text-slate-300 text-sm lg:text-base leading-relaxed">
            Công cụ hỗ trợ Bác sĩ, Kỹ thuật viên & Cán bộ y tế thực hiện quy trình tiếp nhận, sàng lọc sức khỏe,
            quản lý kho túi máu thông minh và phát hành E-Ticket tự động.
          </p>

          {/* Quick Staff Roles Overview Badges */}
          <div className="mt-8 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vai trò hệ thống hỗ trợ:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">KTV Kho Máu</p>
                  <p className="text-[10px] text-slate-400">Nhập/Xuất túi máu & Thống kê</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2.5">
                <Award className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">BS Khám Lâm Sàng</p>
                  <p className="text-[10px] text-slate-400">Sàng lọc & Duyệt E-Ticket</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">Cán Bộ Điều Phối</p>
                  <p className="text-[10px] text-slate-400">Tạo đợt hiến & Phát bài viết</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom System Status Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kết nối Server Backend: <strong>ONLINE (Port 3000)</strong></span>
          </div>
          <span className="font-mono text-slate-500">v2.4.0-RELEASE (Build 2026)</span>
        </div>
      </div>

      {/* Right Login Form & Interactive Panel */}
      <div className="md:w-1/2 lg:w-5/12 p-8 lg:p-14 flex flex-col justify-center items-center bg-slate-950/80 relative z-10">
        <div className="w-full max-w-md space-y-7">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Đăng Nhập Cán Bộ Y Tế</h3>
            <p className="text-xs text-slate-400 mt-1">
              Nhập mã định danh 12 số CCCD / Mã Cán bộ và mật khẩu được cấp
            </p>
          </div>

          {/* Quick Demo Credentials Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Chọn nhanh tài khoản Demo Test:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('staff')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-center cursor-pointer ${
                  selectedRoleTab === 'staff'
                    ? 'bg-red-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                KTV Kho Máu
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('doctor')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-center cursor-pointer ${
                  selectedRoleTab === 'doctor'
                    ? 'bg-red-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Bác Sĩ
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('admin')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-center cursor-pointer ${
                  selectedRoleTab === 'admin'
                    ? 'bg-red-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Quản Trị
              </button>
            </div>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-700/70 text-red-200 text-xs flex items-start gap-3 animate-fade-in shadow-md">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">Không thể xác thực</p>
                <p className="mt-0.5 text-red-200/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mã Số Cán Bộ / CCCD (12 Chữ Số)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={idDocumentNumber}
                  onChange={(e) => setIdDocumentNumber(e.target.value)}
                  placeholder="Nhập 12 số CCCD (VD: 079099000123)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Mật Khẩu Cán Bộ
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu tài khoản"
                  className="w-full pl-11 pr-11 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-red-600 focus:ring-red-500 focus:ring-offset-slate-950 bg-slate-900"
                />
                <span className="text-xs text-slate-300">Ghi nhớ đăng nhập cán bộ</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-red-500/30"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Xác Nhận & Đăng Nhập Cổng BC</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Citizen Switch Link */}
          <div className="pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Bạn muốn hiến máu cá nhân?{' '}
              <Link
                to="/login"
                className="font-semibold text-red-400 hover:text-red-300 transition-colors underline underline-offset-4"
              >
                Chuyển sang Cổng Đăng Nhập Người Hiến Máu
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodCenterLoginPage;

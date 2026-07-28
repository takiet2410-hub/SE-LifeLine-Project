import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHeader } from '../components/AuthHeader';
import { BrandIdentity } from '../components/BrandIdentity';
import { LoginForm } from '../components/LoginForm';
import { SuccessToast } from '../components/SuccessToast';
import { AuthFooter } from '../components/AuthFooter';
import type { LoginCredentials } from '../types';
import { loginUser } from '../api/authApi';
import { useAuth } from '../../../shared/contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLoginSubmit = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loginUser(credentials);

      if (response.success && response.user) {
        const userRole = response.user.role || 'Donor';
        const roleLower = userRole.toLowerCase();

        const isUserStaffRole =
          userRole === 'BloodCenterStaff' ||
          userRole === 'Administrator' ||
          userRole === 'HospitalStaff' ||
          roleLower.includes('staff') ||
          roleLower.includes('admin') ||
          roleLower.includes('hospital') ||
          roleLower.includes('bloodcenter');

        if (response.token) {
          login(response.token, response.user);
        }

        // Save Remember Me settings
        if (credentials.rememberMe) {
          localStorage.setItem('rememberedId', credentials.idDocumentNumber);
          if (credentials.role) {
            localStorage.setItem('rememberedRole', credentials.role);
          }
        } else {
          localStorage.removeItem('rememberedId');
          localStorage.removeItem('rememberedRole');
        }

        const targetPortal = isUserStaffRole ? 'Blood Center Management' : 'Donor Portal';
        setToastMessage(`Đăng nhập thành công (${userRole})! Đang chuyển hướng đến ${targetPortal}...`);
        setShowToast(true);

        setTimeout(() => {
          if (isUserStaffRole) {
            navigate('/bc/campaigns', { replace: true });
          } else {
            navigate('/my-appointments', { replace: true });
          }
        }, 800);
      } else {
        setErrorMessage(
          response.message || 'Mật khẩu hoặc Số CCCD không hợp lệ. Vui lòng kiểm tra lại.'
        );
      }
    } catch (err) {
      setErrorMessage('Đã xảy ra lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f7] selection:bg-[#93000b]/20">
      {/* Top Header Navigation */}
      <AuthHeader />

      {/* Floating Success Notification Toast */}
      <SuccessToast
        isVisible={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-[460px] flex flex-col items-center gap-6">
          {/* Brand Logo & Slogan Header */}
          <BrandIdentity />

          {/* Main Login Card Form */}
          <LoginForm
            onSubmit={handleLoginSubmit}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </main>

      {/* Bottom Footer Section */}
      <AuthFooter />
    </div>
  );
};

export default LoginPage;

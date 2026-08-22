import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AuthHeader } from '../components/AuthHeader';
import { AuthFooter } from '../components/AuthFooter';

export const ResetSuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f7] selection:bg-[#93000b]/20">
      <AuthHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-[440px] bg-white border border-[#f1f3f5] rounded-xl p-6 sm:p-10 shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
          </div>
          
          <h2 className="text-[24px] font-bold text-[#271816] tracking-tight mb-2">
            Đặt Lại Mật Khẩu Thành Công
          </h2>
          
          <p className="text-[14px] font-normal text-[#6c757d] mb-8">
            Mật khẩu tài khoản của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
          </p>

          <Link 
            to="/login"
            className="flex h-12 w-full max-w-[200px] items-center justify-center gap-2 rounded-lg bg-[#93000B] text-sm font-semibold leading-[14px] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)]"
          >
            Quay Lại Đăng Nhập
          </Link>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

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
        <div className="w-full max-w-[440px] bg-white border border-[#f1f3f5] rounded-xl p-10 shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
          </div>
          
          <h2 className="text-[24px] font-bold text-[#271816] tracking-tight mb-2">
            Password Reset Successfully
          </h2>
          
          <p className="text-[14px] font-normal text-[#6c757d] mb-8">
            Your password has been successfully updated. You can now login with your new credentials.
          </p>

          <Link
            to="/auth/login"
            className="w-full h-[48px] bg-[#93000b] hover:bg-[#7a0009] text-white font-semibold text-[14px] rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center"
          >
            Back to Login
          </Link>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

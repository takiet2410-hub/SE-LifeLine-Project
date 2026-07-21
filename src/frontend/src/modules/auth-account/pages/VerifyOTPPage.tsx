import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthHeader } from '../components/AuthHeader';
import { AuthFooter } from '../components/AuthFooter';
import { OTPInputGroup } from '../components/OTPInputGroup';
import type { OTPStatus } from '../components/OTPInputGroup';
import { verifyOTP, sendOTP } from '../api/authApi';

export const VerifyOTPPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OTPStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      // If no email in state, redirect back to forgot password
      navigate('/auth/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const handleVerifyOTP = async (code: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setOtpStatus('idle');

    try {
      const response = await verifyOTP({ email, code });
      
      if (response.success) {
        // Success: Navigate to Reset Password
        navigate('/auth/reset-password', { state: { email, code } });
      } else {
        // Handle mock responses for AF states
        if (response.message?.includes('Expired')) {
          setOtpStatus('expired');
        } else {
          setOtpStatus('invalid');
          setErrorMessage(response.message || 'Invalid OTP code.');
        }
      }
    } catch (err) {
      setOtpStatus('invalid');
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setOtpStatus('idle');
    setErrorMessage(null);

    try {
      const response = await sendOTP({ email });
      if (!response.success) {
        setOtpStatus('not-received');
      }
    } catch (err) {
      setOtpStatus('not-received');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f7] selection:bg-[#93000b]/20">
      <AuthHeader />

      <main className="flex-1 relative flex flex-col items-center justify-center px-4 py-12 md:py-16 overflow-hidden">
        {/* Atmospheric background placeholder */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#FFF8F7] to-[#FFF0F0] opacity-50" />
        
        <div className="w-full max-w-[440px] flex flex-col items-center gap-6 z-10">
          <div className="w-full flex justify-start">
            <Link 
              to="/auth/login"
              className="flex items-center gap-2 text-[14px] font-medium text-[#5b403d] hover:text-[#93000b] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>

          <OTPInputGroup
            onSubmit={handleVerifyOTP}
            onResend={handleResend}
            status={otpStatus}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

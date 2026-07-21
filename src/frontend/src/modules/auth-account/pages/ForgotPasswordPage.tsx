import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHeader } from '../components/AuthHeader';
import { AuthFooter } from '../components/AuthFooter';
import { BrandIdentity } from '../components/BrandIdentity';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { sendOTP } from '../api/authApi';

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await sendOTP({ email });
      if (response.success) {
        // Navigate to OTP page, pass email in state
        navigate('/auth/verify-otp', { state: { email } });
      } else {
        setErrorMessage(response.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f7] selection:bg-[#93000b]/20">
      <AuthHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-[440px] flex flex-col items-center gap-8">
          <BrandIdentity />

          <ForgotPasswordForm
            onSubmit={handleForgotPassword}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthHeader } from '../components/AuthHeader';
import { AuthFooter } from '../components/AuthFooter';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { resetPassword } from '../api/authApi';

export const ResetPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || '';
  const code = location.state?.code || '';

  useEffect(() => {
    if (!email || !code) {
      navigate('/login', { replace: true });
    }
  }, [email, code, navigate]);

  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await resetPassword({ email, code, newPassword, confirmPassword });
      
      if (response.success) {
        navigate('/reset-success', { replace: true });
      } else {
        setErrorMessage(response.message || 'Failed to reset password.');
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
          <ResetPasswordForm
            onSubmit={handleResetPassword}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

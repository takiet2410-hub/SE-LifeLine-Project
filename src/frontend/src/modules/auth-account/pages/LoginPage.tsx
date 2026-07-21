import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHeader } from '../components/AuthHeader';
import { BrandIdentity } from '../components/BrandIdentity';
import { LoginForm } from '../components/LoginForm';
import { SuccessToast } from '../components/SuccessToast';
import { AuthFooter } from '../components/AuthFooter';
import type { LoginCredentials } from '../types';
import { loginUser } from '../api/authApi';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLoginSubmit = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await loginUser(credentials);

      if (response.success) {
        setToastMessage('Login successful! Redirecting...');
        setShowToast(true);
        setTimeout(() => {
          navigate('/my-appointments');
        }, 1500);
      } else {
        setErrorMessage(
          response.message || 'Invalid email or password. Please try again.'
        );
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-[440px] flex flex-col items-center gap-8">
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

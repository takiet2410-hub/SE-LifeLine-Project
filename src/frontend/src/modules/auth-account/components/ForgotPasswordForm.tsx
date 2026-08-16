import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSubmit: (data: { idDocumentNumber: string; email: string }) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  initialEmail?: string;
  initialIdDocumentNumber?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading,
  errorMessage,
  initialEmail = '',
  initialIdDocumentNumber = '',
}) => {
  const [idDocumentNumber, setIdDocumentNumber] = useState(initialIdDocumentNumber);
  const [email, setEmail] = useState(initialEmail);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!idDocumentNumber.trim()) {
      setValidationError('Please enter your Citizen ID number.');
      return;
    }

    if (!email.trim()) {
      setValidationError('Please enter your email address.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    await onSubmit({ idDocumentNumber, email });
  };

  const displayError = validationError || errorMessage;

  return (
    <div className="w-full max-w-[440px] bg-white border border-[#f1f3f5] rounded-xl p-8 shadow-sm transition-all hover:shadow-md">
      <div className="mb-6 text-left">
        <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
          Forgot Password?
        </h2>
        <p className="text-[14px] font-normal text-[#6c757d] mt-1">
          Enter your Citizen ID and email address to receive reset instructions.
        </p>
      </div>

      {displayError && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-[#93000b] leading-tight">
            {displayError}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <label htmlFor="idDocumentNumber" className="block text-[13px] font-semibold text-[#271816]">
            Citizen ID Number (CCCD)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a3a3a3]">
              <AlertCircle className="w-4 h-4" /> {/* Fallback icon, could use something better but AlertCircle works as a generic icon */}
            </div>
            <input
              id="idDocumentNumber"
              type="text"
              value={idDocumentNumber}
              onChange={(e) => setIdDocumentNumber(e.target.value)}
              placeholder="Enter 12-digit ID number"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-lg text-[14px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label htmlFor="email" className="block text-[13px] font-semibold text-[#271816]">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a3a3a3]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#f1f3f5] focus:border-[#93000b] rounded-lg text-[14px] text-[#271816] placeholder-[#a3a3a3] outline-none transition-all focus:ring-2 focus:ring-[#93000b]/10"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[48px] mt-2 bg-[#93000b] hover:bg-[#7a0009] text-white font-semibold text-[14px] rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>
    </div>
  );
};

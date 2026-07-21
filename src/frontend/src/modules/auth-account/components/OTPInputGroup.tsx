import React, { useRef, useState, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

export type OTPStatus = 'idle' | 'invalid' | 'expired' | 'not-received';

interface OTPInputGroupProps {
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  status: OTPStatus;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const OTPInputGroup: React.FC<OTPInputGroupProps> = ({
  onSubmit,
  onResend,
  status,
  isLoading,
  errorMessage,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && status !== 'expired') {
      inputRefs.current[0].focus();
    }
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Allow only the last entered char
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-submit if all filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (value && index === 5) {
      // Small timeout to allow state to update before submitting
      setTimeout(() => {
        const fullCode = newOtp.join('');
        if (fullCode.length === 6) {
          onSubmit(fullCode);
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6).split('');
    if (pastedData.some(char => isNaN(Number(char)))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtp(newOtp);
    
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
    
    if (pastedData.length === 6) {
      onSubmit(pastedData.join(''));
    }
  };

  const handleSubmitClick = () => {
    const fullCode = otp.join('');
    if (fullCode.length === 6) {
      onSubmit(fullCode);
    }
  };

  const isExpired = status === 'expired';
  const isInvalid = status === 'invalid';
  const isNotReceived = status === 'not-received';

  return (
    <div className="w-full max-w-[440px] bg-white border border-[#f1f3f5] rounded-xl p-8 shadow-sm transition-all">
      <div className="mb-6 text-left">
        <h2 className="text-[22px] font-bold text-[#271816] tracking-tight">
          Enter Verification Code
        </h2>
        <p className="text-[14px] font-normal text-[#6c757d] mt-1">
          We've sent a 6-digit code to your email. Please enter it below.
        </p>
      </div>

      {/* Warning/Error Banners */}
      {(isInvalid || errorMessage) && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-[#93000b] leading-tight">
            {errorMessage || 'Invalid OTP code. Please check and try again.'}
          </p>
        </div>
      )}

      {(isExpired || isNotReceived) && !isInvalid && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-amber-700 leading-tight">
            {isExpired ? 'Your code has expired. Please request a new one.' : 'Having trouble? Check your spam folder or request a new code.'}
          </p>
        </div>
      )}

      <div className="flex justify-between gap-2 sm:gap-3 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={isLoading || isExpired}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-[24px] font-semibold rounded-lg border outline-none transition-all
              ${isInvalid ? 'border-[#93000b] bg-red-50/50 text-[#93000b]' : ''}
              ${isExpired ? 'border-[#f1f3f5] bg-gray-50 text-[#a3a3a3] cursor-not-allowed' : ''}
              ${!isInvalid && !isExpired ? 'border-[#dee2e6] bg-white text-[#271816] focus:border-[#93000b] focus:ring-2 focus:ring-[#93000b]/10' : ''}
            `}
            maxLength={1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmitClick}
        disabled={isLoading || isExpired || otp.join('').length < 6}
        className="w-full h-[48px] bg-[#93000b] hover:bg-[#7a0009] text-white font-semibold text-[14px] rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mb-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <span>Verify Code</span>
        )}
      </button>

      <div className="pt-5 border-t border-[#f1f3f5] text-center">
        <p className="text-[13px] text-[#6c757d]">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className="font-semibold text-[#93000b] hover:text-[#7a0009] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resend Code
          </button>
        </p>
      </div>
    </div>
  );
};

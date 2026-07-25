import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { verifyEmail } from '../api/authAccountApi';

type VerificationState = 'idle' | 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<VerificationState>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Verification token is missing from the link.');
      return;
    }

    let isActive = true;

    async function runVerification() {
      setState('verifying');
      setMessage('Verifying your email address...');

      try {
        const response = await verifyEmail(token);

        if (!isActive) {
          return;
        }

        setState('success');
        setMessage(response.message ?? 'Your account has been activated. You can now sign in.');
      } catch {
        if (!isActive) {
          return;
        }

        setState('error');
        setMessage('The verification link is invalid or has expired.');
      }
    }

    void runVerification();

    return () => {
      isActive = false;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FFF8F7] px-4 py-12 text-[#271816] sm:px-8 lg:px-24 xl:px-96">
      <div className="flex w-full max-w-[512px] flex-col items-start gap-8">
        <div className="flex w-full flex-col items-center gap-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#93000B] py-3">
            <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[30px] w-6">
              <path
                d="M12 30C8.575 30 5.71875 28.825 3.43125 26.475C1.14375 24.125 0 21.2 0 17.7C0 15.2 0.99375 12.4812 2.98125 9.54375C4.96875 6.60625 7.975 3.425 12 0C16.025 3.425 19.0312 6.60625 21.0187 9.54375C23.0062 12.4812 24 15.2 24 17.7C24 21.2 22.8563 24.125 20.5688 26.475C18.2812 28.825 15.425 30 12 30ZM7.5 24H16.5V21H7.5V24ZM10.5 19.5H13.5V16.5H16.5V13.5H13.5V10.5H10.5V13.5H7.5V16.5H10.5V19.5Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center pt-3">
            <p className="text-[28px] font-bold leading-[36.4px] tracking-[-0.025em] text-[#93000B]">LifeLine</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm leading-[21px] tracking-[0.1em] text-[#6C757D]">EVERY DROP COUNTS</p>
          </div>
        </div>

        <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex w-full flex-col items-start gap-6 p-8">
            <div className="flex w-full flex-col items-center gap-2 text-center">
              <p className="text-[22px] font-semibold leading-[28.6px] text-[#271816]">Verify your email</p>
              <p className="text-sm leading-6 text-[#6C757D]">We are checking the activation link from your inbox.</p>
            </div>

            <div className="w-full rounded-lg border border-[#DEE2E6] bg-[#F8F9FA] px-4 py-3">
              <p className={`text-sm leading-6 ${state === 'error' ? 'text-[#BA1A1A]' : state === 'success' ? 'text-[#1F7A3D]' : 'text-[#343A40]'}`}>
                {message || 'Waiting for verification token...'}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <a
                href="/register"
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#93000B] text-sm font-semibold leading-[14px] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)]"
              >
                {state === 'success' ? 'Continue to sign in' : 'Back to registration'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { registerCitizenId } from '../api/authAccountApi';
import { AuthHeader } from '../components/AuthHeader';
import { AuthFooter } from '../components/AuthFooter';
import { LifeLineLogo } from '../components/LifeLineLogo';

const extractedIdentity = {
  fullName: 'NGUYEN VAN AN',
  dateOfBirth: '01/01/1990',
  idNumber: '001090XXXXXX',
};

const actionButtonShadow = 'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)]';

function isPasswordTooShort(password: string) {
  return password.length > 0 && password.length < 8;
}

function isPasswordMissingDigitOrLetter(password: string) {
  return password.length > 0 && (!/[A-Za-z]/.test(password) || !/\d/.test(password));
}

export function RegisterCitizenIdPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [email, setEmail] = useState('example@lifeline.org');
  const [phoneNumber, setPhoneNumber] = useState('900 000 000');
  const [password, setPassword] = useState('123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');

  const passwordTooShort = isPasswordTooShort(password);
  const passwordMissingRequirements = isPasswordMissingDigitOrLetter(password);
  const passwordError = passwordTooShort || passwordMissingRequirements;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatusTone('error');
      setStatusMessage('Please upload a CCCD QR image first.');
      return;
    }

    setIsSubmitting(true);
    setStatusTone('default');
    setStatusMessage('');

    try {
      const response = await registerCitizenId({
        fullName: extractedIdentity.fullName,
        dateOfBirth: extractedIdentity.dateOfBirth,
        idNumber: extractedIdentity.idNumber,
        email,
        phoneNumber,
        password,
        cccdImage: selectedFile,
      });

      setStatusTone('success');
      setStatusMessage(response.message ?? 'Verification email sent. Check your inbox to activate your account.');
    } catch {
      setStatusTone('error');
      setStatusMessage('Registration could not be completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f7] selection:bg-[#93000b]/20 text-[#271816]">
      <AuthHeader />

      <main className="flex-1 relative flex flex-col items-center justify-center px-4 py-12 md:py-16">
        <div className="pointer-events-none absolute right-0 top-0 w-fit opacity-20 z-0">
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-[400px] w-[400px] overflow-hidden"
          >
            <path
              d="M160 120C160 186.23 213.77 240 280 240C346.23 240 400 186.23 400 120C400 53.7702 346.23 0 280 0C213.77 0 160 53.7702 160 120Z"
              fill="url(#paint0_linear_1_1440)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_1_1440"
                x1="160"
                y1="0"
                x2="400"
                y2="240"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#B91C1C" />
                <stop offset="1" stopColor="#FFF8F7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="flex w-full max-w-[512px] flex-col items-start gap-8 z-10">
        <div className="flex w-full flex-col items-center gap-1">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-[#93000B] py-3">
            <div className="absolute h-[54px] w-16 rounded-xl bg-transparent shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)]" />
            <LifeLineLogo className="z-10 h-[30px] w-6 text-white" />
          </div>
          <div className="flex flex-col items-center pt-3">
            <p className="text-[28px] font-bold leading-[36.4px] tracking-[-0.025em] text-[#93000B]">LifeLine</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm leading-[21px] tracking-[0.1em] text-[#6C757D]">EVERY DROP COUNTS</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col overflow-hidden rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div className="flex w-full flex-col items-start gap-8 p-8">
            <div className="flex w-full flex-col items-center">
              <p className="text-[22px] font-semibold leading-[28.6px] text-[#271816]">Create Your Account</p>
            </div>

            <div className="flex w-full flex-col items-end gap-8">
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    className="flex h-6 w-6 cursor-default items-center justify-center rounded-full bg-[#93000B] pt-1 text-xs font-bold leading-4 text-white"
                  >
                    1
                  </button>
                  <div>
                    <p className="text-lg font-semibold leading-[25.2px] text-[#271816]">Scan CCCD QR Code</p>
                  </div>
                </div>

                <div className="relative flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-[#CED4DA] bg-[#F8F9FA] p-10">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                  >
                    <path
                      d="M0 10V0H10V4H4V10H0ZM0 40V30H4V36H10V40H0ZM30 40V36H36V30H40V40H30ZM36 10V4H30V0H40V10H36ZM31 31H34V34H31V31ZM31 25H34V28H31V25ZM28 28H31V31H28V28ZM25 31H28V34H25V31ZM22 28H25V31H22V28ZM28 22H31V25H28V22ZM25 25H28V28H25V25ZM22 22H25V25H22V22ZM34 6V18H22V6H34ZM18 22V34H6V22H18ZM18 6V18H6V6H18ZM15 31V25H9V31H15ZM15 15V9H9V15H15ZM31 15V9H25V15H31Z"
                      fill="#A3A3A3"
                    />
                  </svg>

                  <div className="flex flex-col items-center pt-2">
                    <p className="text-base font-medium leading-6 text-[#343A40]">Capture or Upload CCCD</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm leading-5 text-[#6C757D]">Scan the QR code on your national ID card</p>
                  </div>

                  <label className="absolute left-0.5 top-0.5 flex h-[180px] w-[442px] items-center gap-1 overflow-hidden pb-[158px]">
                    <span className="flex w-fit justify-center overflow-hidden border-2 border-black bg-[#EFEFEF] px-1.5 py-px text-base leading-6 text-black">
                      Choose File
                    </span>
                    <span className="text-base leading-6 text-[#271816]">{selectedFile?.name ?? 'No file chosen'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        setSelectedFile(event.target.files?.[0] ?? null);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="h-6 w-[435px] border-l-2 border-l-[#DEE2E6]" />

              <div className="flex w-full flex-col gap-[15px]">
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    className="flex h-6 w-6 cursor-default items-center justify-center rounded-full bg-[#93000B] pt-1 text-xs font-bold leading-4 text-white"
                  >
                    2
                  </button>
                  <div>
                    <p className="text-lg font-semibold leading-[25.2px] text-[#271816]">Verify Identity Details</p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-4">
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#6C757D]">Full Name</p>
                    </div>
                    <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#F1F3F5] px-4 py-[11px]">
                      <input
                        value={extractedIdentity.fullName}
                        readOnly
                        className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#343A40] outline-none"
                      />
                      <svg
                        width="12"
                        height="16"
                        viewBox="0 0 12 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute right-3 top-2.5 h-4 w-3"
                      >
                        <path
                          d="M1.5 15.75C1.0875 15.75 0.734375 15.6031 0.440625 15.3094C0.146875 15.0156 0 14.6625 0 14.25V6.75C0 6.3375 0.146875 5.98438 0.440625 5.69063C0.734375 5.39688 1.0875 5.25 1.5 5.25H2.25V3.75C2.25 2.7125 2.61562 1.82812 3.34687 1.09687C4.07812 0.365625 4.9625 0 6 0C7.0375 0 7.92188 0.365625 8.65312 1.09687C9.38437 1.82812 9.75 2.7125 9.75 3.75V5.25H10.5C10.9125 5.25 11.2656 5.39688 11.5594 5.69063C11.8531 5.98438 12 6.3375 12 6.75V14.25C12 14.6625 11.8531 15.0156 11.5594 15.3094C11.2656 15.6031 10.9125 15.75 10.5 15.75H1.5ZM1.5 14.25H10.5V6.75H1.5V14.25ZM6 12C6.4125 12 6.76562 11.8531 7.05937 11.5594C7.35312 11.2656 7.5 10.9125 7.5 10.5C7.5 10.0875 7.35312 9.73438 7.05937 9.44063C6.76562 9.14688 6.4125 9 6 9C5.5875 9 5.23438 9.14688 4.94063 9.44063C4.64688 9.73438 4.5 10.0875 4.5 10.5C4.5 10.9125 4.64688 11.2656 4.94063 11.5594C5.23438 11.8531 5.5875 12 6 12ZM3.75 5.25H8.25V3.75C8.25 3.125 8.03125 2.59375 7.59375 2.15625C7.15625 1.71875 6.625 1.5 6 1.5C5.375 1.5 4.84375 1.71875 4.40625 2.15625C3.96875 2.59375 3.75 3.125 3.75 3.75V5.25ZM1.5 14.25V6.75V14.25Z"
                          fill="#A3A3A3"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex h-[65px] w-full items-start justify-center gap-4">
                    <div className="flex w-[215px] flex-col gap-1">
                      <div className="flex flex-col pb-px">
                        <p className="text-xs font-medium leading-[16.8px] text-[#6C757D]">Date of Birth</p>
                      </div>
                      <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#F1F3F5] px-4 py-[11px]">
                        <input
                          value={extractedIdentity.dateOfBirth}
                          readOnly
                          className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#343A40] outline-none"
                        />
                        <svg
                          width="12"
                          height="16"
                          viewBox="0 0 12 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute right-3 top-2.5 h-4 w-3"
                        >
                          <path
                            d="M1.5 15.75C1.0875 15.75 0.734375 15.6031 0.440625 15.3094C0.146875 15.0156 0 14.6625 0 14.25V6.75C0 6.3375 0.146875 5.98438 0.440625 5.69063C0.734375 5.39688 1.0875 5.25 1.5 5.25H2.25V3.75C2.25 2.7125 2.61562 1.82812 3.34687 1.09687C4.07812 0.365625 4.9625 0 6 0C7.0375 0 7.92188 0.365625 8.65312 1.09687C9.38437 1.82812 9.75 2.7125 9.75 3.75V5.25H10.5C10.9125 5.25 11.2656 5.39688 11.5594 5.69063C11.8531 5.98438 12 6.3375 12 6.75V14.25C12 14.6625 11.8531 15.0156 11.5594 15.3094C11.2656 15.6031 10.9125 15.75 10.5 15.75H1.5ZM1.5 14.25H10.5V6.75H1.5V14.25ZM6 12C6.4125 12 6.76562 11.8531 7.05937 11.5594C7.35312 11.2656 7.5 10.9125 7.5 10.5C7.5 10.0875 7.35312 9.73438 7.05937 9.44063C6.76562 9.14688 6.4125 9 6 9C5.5875 9 5.23438 9.14688 4.94063 9.44063C4.64688 9.73438 4.5 10.0875 4.5 10.5C4.5 10.9125 4.64688 11.2656 4.94063 11.5594C5.23438 11.8531 5.5875 12 6 12ZM3.75 5.25H8.25V3.75C8.25 3.125 8.03125 2.59375 7.59375 2.15625C7.15625 1.71875 6.625 1.5 6 1.5C5.375 1.5 4.84375 1.71875 4.40625 2.15625C3.96875 2.59375 3.75 3.125 3.75 3.75V5.25ZM1.5 14.25V6.75V14.25Z"
                            fill="#A3A3A3"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex w-[215px] flex-col gap-1">
                      <div className="flex flex-col pb-px">
                        <p className="text-xs font-medium leading-[16.8px] text-[#6C757D]">ID Number</p>
                      </div>
                      <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#F1F3F5] px-4 py-[11px]">
                        <input
                          value={extractedIdentity.idNumber}
                          readOnly
                          className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#343A40] outline-none"
                        />
                        <svg
                          width="12"
                          height="16"
                          viewBox="0 0 12 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute right-3 top-2.5 h-4 w-3"
                        >
                          <path
                            d="M1.5 15.75C1.0875 15.75 0.734375 15.6031 0.440625 15.3094C0.146875 15.0156 0 14.6625 0 14.25V6.75C0 6.3375 0.146875 5.98438 0.440625 5.69063C0.734375 5.39688 1.0875 5.25 1.5 5.25H2.25V3.75C2.25 2.7125 2.61562 1.82812 3.34687 1.09687C4.07812 0.365625 4.9625 0 6 0C7.0375 0 7.92188 0.365625 8.65312 1.09687C9.38437 1.82812 9.75 2.7125 9.75 3.75V5.25H10.5C10.9125 5.25 11.2656 5.39688 11.5594 5.69063C11.8531 5.98438 12 6.3375 12 6.75V14.25C12 14.6625 11.8531 15.0156 11.5594 15.3094C11.2656 15.6031 10.9125 15.75 10.5 15.75H1.5ZM1.5 14.25H10.5V6.75H1.5V14.25ZM6 12C6.4125 12 6.76562 11.8531 7.05937 11.5594C7.35312 11.2656 7.5 10.9125 7.5 10.5C7.5 10.0875 7.35312 9.73438 7.05937 9.44063C6.76562 9.14688 6.4125 9 6 9C5.5875 9 5.23438 9.14688 4.94063 9.44063C4.64688 9.73438 4.5 10.0875 4.5 10.5C4.5 10.9125 4.64688 11.2656 4.94063 11.5594C5.23438 11.8531 5.5875 12 6 12ZM3.75 5.25H8.25V3.75C8.25 3.125 8.03125 2.59375 7.59375 2.15625C7.15625 1.71875 6.625 1.5 6 1.5C5.375 1.5 4.84375 1.71875 4.40625 2.15625C3.96875 2.59375 3.75 3.125 3.75 3.75V5.25ZM1.5 14.25V6.75V14.25Z"
                            fill="#A3A3A3"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-6 w-[435px] border-l-2 border-l-[#DEE2E6]" />

              <div className="flex w-full flex-col gap-[15px]">
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    className="flex h-6 w-6 cursor-default items-center justify-center rounded-full bg-[#93000B] pt-1 text-xs font-bold leading-4 text-white"
                  >
                    3
                  </button>
                  <div>
                    <p className="text-lg font-semibold leading-[25.2px] text-[#271816]">Set Account Credentials</p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-[19px]">
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#343A40]">Email Address</p>
                    </div>
                    <div className="flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-white px-4 py-[11px]">
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-base text-[#6B7280] outline-none"
                        type="email"
                        autoComplete="email"
                        placeholder="example@lifeline.org"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#343A40]">Phone Number</p>
                    </div>
                    <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-white pl-16 pr-4 pt-[11px] pb-[11px]">
                      <div className="absolute left-4 top-2.5 flex w-fit border-r border-r-[#DEE2E6] pr-3">
                        <p className="text-base font-medium leading-6 text-[#A3A3A3]">+84</p>
                      </div>
                      <input
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-base text-[#6B7280] outline-none"
                        type="tel"
                        autoComplete="tel"
                        placeholder="900 000 000"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#343A40]">Password</p>
                    </div>
                    <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#BA1A1A] bg-white px-4 py-[11px] shadow-[0_0_0_2px_rgba(186,26,26,0.10)]">
                      <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-base text-[#271816] outline-none"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Enter password"
                      />
                      <svg
                        width="22"
                        height="20"
                        viewBox="0 0 22 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute right-3 top-2.5 h-5 w-[22px]"
                      >
                        <path
                          d="M15.1 10.5L13.65 9.05C13.8 8.26667 13.575 7.53333 12.975 6.85C12.375 6.16667 11.6 5.9 10.65 6.05L9.2 4.6C9.48333 4.46667 9.77083 4.36667 10.0625 4.3C10.3542 4.23333 10.6667 4.2 11 4.2C12.25 4.2 13.3125 4.6375 14.1875 5.5125C15.0625 6.3875 15.5 7.45 15.5 8.7C15.5 9.03333 15.4667 9.34583 15.4 9.6375C15.3333 9.92917 15.2333 10.2167 15.1 10.5ZM18.3 13.65L16.85 12.25C17.4833 11.7667 18.0458 11.2375 18.5375 10.6625C19.0292 10.0875 19.45 9.43333 19.8 8.7C18.9667 7.01667 17.7708 5.67917 16.2125 4.6875C14.6542 3.69583 12.9167 3.2 11 3.2C10.5167 3.2 10.0417 3.23333 9.575 3.3C9.10833 3.36667 8.65 3.46667 8.2 3.6L6.65 2.05C7.33333 1.76667 8.03333 1.55417 8.75 1.4125C9.46667 1.27083 10.2167 1.2 11 1.2C13.5167 1.2 15.7583 1.89583 17.725 3.2875C19.6917 4.67917 21.1167 6.48333 22 8.7C21.6167 9.68333 21.1125 10.5958 20.4875 11.4375C19.8625 12.2792 19.1333 13.0167 18.3 13.65ZM18.8 19.8L14.6 15.65C14.0167 15.8333 13.4292 15.9708 12.8375 16.0625C12.2458 16.1542 11.6333 16.2 11 16.2C8.48333 16.2 6.24167 15.5042 4.275 14.1125C2.30833 12.7208 0.883333 10.9167 0 8.7C0.35 7.81667 0.791667 6.99583 1.325 6.2375C1.85833 5.47917 2.46667 4.8 3.15 4.2L0.4 1.4L1.8 0L20.2 18.4L18.8 19.8ZM4.55 5.6C4.06667 6.03333 3.625 6.50833 3.225 7.025C2.825 7.54167 2.48333 8.1 2.2 8.7C3.03333 10.3833 4.22917 11.7208 5.7875 12.7125C7.34583 13.7042 9.08333 14.2 11 14.2C11.3333 14.2 11.6583 14.1792 11.975 14.1375C12.2917 14.0958 12.6167 14.05 12.95 14L12.05 13.05C11.8667 13.1 11.6917 13.1375 11.525 13.1625C11.3583 13.1875 11.1833 13.2 11 13.2C9.75 13.2 8.6875 12.7625 7.8125 11.8875C6.9375 11.0125 6.5 9.95 6.5 8.7C6.5 8.51667 6.5125 8.34167 6.5375 8.175C6.5625 8.00833 6.6 7.83333 6.65 7.65L4.55 5.6Z"
                          fill="#BA1A1A"
                        />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1 pt-0.5">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                      >
                        <path
                          d="M5.83333 8.75C5.99861 8.75 6.13715 8.6941 6.24896 8.58229C6.36076 8.47049 6.41667 8.33194 6.41667 8.16667C6.41667 8.00139 6.36076 7.86285 6.24896 7.75104C6.13715 7.63924 5.99861 7.58333 5.83333 7.58333C5.66806 7.58333 5.52951 7.63924 5.41771 7.75104C5.3059 7.86285 5.25 8.00139 5.25 8.16667C5.25 8.33194 5.3059 8.47049 5.41771 8.58229C5.52951 8.6941 5.66806 8.75 5.83333 8.75ZM5.25 6.41667H6.41667V2.91667H5.25V6.41667ZM5.83333 11.6667C5.02639 11.6667 4.26806 11.5135 3.55833 11.2073C2.84861 10.901 2.23125 10.4854 1.70625 9.96042C1.18125 9.43542 0.765625 8.81806 0.459375 8.10833C0.153125 7.39861 0 6.64028 0 5.83333C0 5.02639 0.153125 4.26806 0.459375 3.55833C0.765625 2.84861 1.18125 2.23125 1.70625 1.70625C2.23125 1.18125 2.84861 0.765625 3.55833 0.459375C4.26806 0.153125 5.02639 0 5.83333 0C6.64028 0 7.39861 0.153125 8.10833 0.459375C8.81806 0.765625 9.43542 1.18125 9.96042 1.70625C10.4854 2.23125 10.901 2.84861 11.2073 3.55833C11.5135 4.26806 11.6667 5.02639 11.6667 5.83333C11.6667 6.64028 11.5135 7.39861 11.2073 8.10833C10.901 8.81806 10.4854 9.43542 9.96042 9.96042C9.43542 10.4854 8.81806 10.901 8.10833 11.2073C7.39861 11.5135 6.64028 11.6667 5.83333 11.6667ZM5.83333 10.5C7.13611 10.5 8.23958 10.0479 9.14375 9.14375C10.0479 8.23958 10.5 7.13611 10.5 5.83333C10.5 4.53056 10.0479 3.42708 9.14375 2.52292C8.23958 1.61875 7.13611 1.16667 5.83333 1.16667C4.53056 1.16667 3.42708 1.61875 2.52292 2.52292C1.61875 3.42708 1.16667 4.53056 1.16667 5.83333C1.16667 7.13611 1.61875 8.23958 2.52292 9.14375C3.42708 10.0479 4.53056 10.5 5.83333 10.5Z"
                          fill="#BA1A1A"
                        />
                      </svg>
                      <p className="text-xs font-medium leading-4 text-[#BA1A1A]">{passwordError ? 'Too short' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`relative flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#93000B] text-sm font-semibold leading-[14px] text-white ${actionButtonShadow}`}
                >
                  <div className="absolute h-12 w-[446px] rounded-lg bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)]" />
                  <span className="relative">{isSubmitting ? 'Registering...' : 'Register'}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative h-4 w-4"
                  >
                    <path
                      d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z"
                      fill="white"
                    />
                  </svg>
                </button>

                {statusMessage ? (
                  <p
                    className={`text-sm leading-5 ${statusTone === 'error' ? 'text-[#BA1A1A]' : statusTone === 'success' ? 'text-[#1F7A3D]' : 'text-[#6C757D]'}`}
                  >
                    {statusMessage}
                  </p>
                ) : null}

                <div className="flex w-full items-center justify-center gap-2 pb-0.5 pt-[3px]">
                  <p className="text-sm leading-5 text-[#6C757D]">Already have an account?</p>
                  <Link to="/auth/login" className="text-sm font-semibold leading-5 text-[#93000B] hover:text-[#7a0009] transition-colors">
                    Login now
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-6 border-t border-t-[#F1F3F5] bg-[#F8F9FA] px-8 py-4">
            <div className="flex w-fit items-center gap-1.5 bg-white opacity-60">
              <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[15px] w-3">
                <path
                  d="M5.2125 10.1625L9.45 5.925L8.38125 4.85625L5.2125 8.025L3.6375 6.45L2.56875 7.51875L5.2125 10.1625ZM6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15ZM6 13.425C7.3 13.0125 8.375 12.1875 9.225 10.95C10.075 9.7125 10.5 8.3375 10.5 6.825V3.28125L6 1.59375L1.5 3.28125V6.825C1.5 8.3375 1.925 9.7125 2.775 10.95C3.625 12.1875 4.7 13.0125 6 13.425Z"
                  fill="#271816"
                />
              </svg>
              <p className="text-[10px] font-bold leading-[15px] tracking-[0.05em] text-[#271816]">SECURED ENCRYPTION</p>
            </div>

            <div className="flex w-fit items-center gap-1.5 bg-white opacity-60">
              <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[15px] w-3">
                <path
                  d="M5.2125 10.1625L9.45 5.925L8.38125 4.85625L5.2125 8.025L3.6375 6.45L2.56875 7.51875L5.2125 10.1625ZM6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15ZM6 13.425C7.3 13.0125 8.375 12.1875 9.225 10.95C10.075 9.7125 10.5 8.3375 10.5 6.825V3.28125L6 1.59375L1.5 3.28125V6.825C1.5 8.3375 1.925 9.7125 2.775 10.95C3.625 12.1875 4.7 13.0125 6 13.425Z"
                  fill="#271816"
                />
              </svg>
              <p className="text-[10px] font-bold leading-[15px] tracking-[0.05em] text-[#271816]">GDPR COMPLIANT</p>
            </div>
          </div>
        </form>
        </div>
      </main>
      
      <AuthFooter />
    </div>
  );
}
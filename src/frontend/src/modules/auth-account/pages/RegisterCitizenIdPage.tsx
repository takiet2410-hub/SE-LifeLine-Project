import { useState } from 'react';
import { Link } from 'react-router-dom';

import { registerCitizenId } from '../api/authAccountApi';
import { AuthHeader } from '../components/AuthHeader';
import { AuthFooter } from '../components/AuthFooter';
import { LifeLineLogo } from '../components/LifeLineLogo';

import jsQR from 'jsqr';
import vnProvinces from '../../../data/vietnam_provinces.json';

const actionButtonShadow = 'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)]';

function isPasswordTooShort(password: string) {
  return password.length > 0 && password.length < 8;
}

function isPasswordMissingDigitOrLetter(password: string) {
  return password.length > 0 && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(password);
}

export function RegisterCitizenIdPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');

  const [extractedIdentity, setExtractedIdentity] = useState({
    fullName: '',
    dateOfBirth: '',
    idNumber: '',
    permanentAddress: '',
  });
  const [differentLivingAddress, setDifferentLivingAddress] = useState(false);
  const [currentAddressDetails, setCurrentAddressDetails] = useState({
    province: 'Thành phố Hồ Chí Minh',
    district: '',
    ward: '',
    street: ''
  });
  const [qrPayload, setQrPayload] = useState('');

  const selectedProvince = (vnProvinces as any[]).find((p: any) => p.name === currentAddressDetails.province);
  const availableDistricts = selectedProvince ? selectedProvince.districts : [];
  const selectedDistrict = (availableDistricts as any[]).find((d: any) => d.name === currentAddressDetails.district);
  const availableWards = selectedDistrict ? selectedDistrict.wards : [];

  const passwordTooShort = isPasswordTooShort(password);
  const passwordMissingRequirements = isPasswordMissingDigitOrLetter(password);
  const passwordError = password.length > 0 && (passwordTooShort || passwordMissingRequirements);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setStatusMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          const payload = code.data;
          setQrPayload(payload);
          // Format CCCD: ID|CMND_old|FullName|DOB|Gender|Address|DateOfIssue
          const parts = payload.split('|');
          if (parts.length >= 4) {
            setExtractedIdentity({
              idNumber: parts[0] || '',
              fullName: parts[2] || '',
              // Convert ddmmyyyy to dd/mm/yyyy
              dateOfBirth: parts[3] ? `${parts[3].slice(0, 2)}/${parts[3].slice(2, 4)}/${parts[3].slice(4, 8)}` : '',
              permanentAddress: parts[5] || '',
            });
            setStatusTone('success');
            setStatusMessage('Quét mã QR thẻ CCCD thành công!');
          }
        } else {
          setStatusTone('error');
          setStatusMessage('Không tìm thấy mã QR CCCD hợp lệ trong ảnh. Vui lòng thử lại.');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile || !qrPayload) {
      setStatusTone('error');
      setStatusMessage('Vui lòng tải lên ảnh chụp mã QR trên CCCD trước.');
      return;
    }

    if (!email.trim() || !phoneNumber.trim() || !password.trim()) {
      setStatusTone('error');
      setStatusMessage('Vui lòng điền đầy đủ các thông tin bắt buộc (Email, Số điện thoại, Mật khẩu).');
      return;
    }

    if (isPasswordTooShort(password) || isPasswordMissingDigitOrLetter(password)) {
      setStatusTone('error');
      setStatusMessage('Vui lòng nhập mật khẩu hợp lệ đáp ứng đầy đủ yêu cầu bảo mật.');
      return;
    }

    setIsSubmitting(true);
    setStatusTone('default');
    setStatusMessage('');

    try {
      const fullLivingAddr = [
        currentAddressDetails.street,
        currentAddressDetails.ward,
        currentAddressDetails.district,
        currentAddressDetails.province
      ].filter(Boolean).join(', ');

      const response = await registerCitizenId({
        qrPayload,
        email,
        phoneNumber,
        password,
        currentAddress: differentLivingAddress && fullLivingAddr.trim() ? fullLivingAddr.trim() : undefined,
      });

      setStatusTone('success');
      setStatusMessage(response.message ?? 'Đã gửi email xác thực. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.');
    } catch (error: any) {
      setStatusTone('error');
      const errMsgs = error?.response?.data?.errors;
      const backendMsg = errMsgs && errMsgs.length > 0 ? errMsgs[0].message : (error?.response?.data?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
      setStatusMessage(backendMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f7] selection:bg-[#93000b]/20 text-[#271816]">
      <AuthHeader />

      <main className="flex-1 relative flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="pointer-events-none absolute right-0 top-0 w-fit opacity-20 z-0">
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="hidden sm:block h-[400px] w-[400px] overflow-hidden"
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

        <div className="flex w-full max-w-[512px] flex-col items-start gap-5 sm:gap-8 z-10">
        <div className="flex w-full flex-col items-center gap-1">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-[#93000B] py-3">
            <div className="absolute h-[54px] w-16 rounded-xl bg-transparent shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)]" />
            <LifeLineLogo className="z-10 h-[30px] w-6 text-white" />
          </div>
          <div className="flex flex-col items-center pt-3">
            <p className="text-[28px] font-bold leading-[36.4px] tracking-[-0.025em] text-[#93000B]">LifeLine</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm leading-[21px] tracking-[0.1em] text-[#6C757D]">MỖI GIỌT MÁU TRIỆU TẤM LÒNG</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col overflow-hidden rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div className="flex w-full flex-col items-start gap-6 sm:gap-8 p-4 sm:p-8">
            <div className="flex w-full flex-col items-center">
              <p className="text-[22px] font-semibold leading-[28.6px] text-[#271816]">Đăng Ký Tài Khoản</p>
            </div>

            <div className="flex w-full flex-col items-end gap-6 sm:gap-8">
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    className="flex h-6 w-6 cursor-default items-center justify-center rounded-full bg-[#93000B] pt-1 text-xs font-bold leading-4 text-white"
                  >
                    1
                  </button>
                  <div>
                    <p className="text-lg font-semibold leading-[25.2px] text-[#271816]">Quét Mã QR Thẻ Căn Cước (CCCD)</p>
                  </div>
                </div>

                <div className="relative flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-[#CED4DA] bg-[#F8F9FA] p-5 sm:p-10 text-center">
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
                    <p className="text-base font-medium leading-6 text-[#343A40]">Tải ảnh CCCD chứa mã QR</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm leading-5 text-[#6C757D]">Hệ thống tự động trích xuất thông tin người hiến</p>
                    <p className="mt-1 max-w-full truncate text-xs font-medium text-[#93000B]">
                      {selectedFile?.name ?? 'Chạm để chọn ảnh CCCD'}
                    </p>
                  </div>

                  <label className="absolute inset-0 cursor-pointer rounded-lg">
                    <span className="sr-only">
                      Chọn tệp
                    </span>
                    <span className="sr-only">{selectedFile?.name ?? 'Chưa chọn tệp nào'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="h-6 w-full border-l-2 border-l-[#DEE2E6]" />

              <div className="flex w-full flex-col gap-[15px]">
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    className="flex h-6 w-6 cursor-default items-center justify-center rounded-full bg-[#93000B] pt-1 text-xs font-bold leading-4 text-white"
                  >
                    2
                  </button>
                  <div>
                    <p className="text-lg font-semibold leading-[25.2px] text-[#271816]">Xác Nhận Thông Tin Định Danh</p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-4">
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#6C757D]">Họ và tên</p>
                    </div>
                    <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#F1F3F5] px-4 py-[11px]">
                      <input
                        value={extractedIdentity.fullName}
                        readOnly
                        placeholder="NGUYỄN VĂN A"
                        className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#343A40] placeholder:text-[#9CA3AF] outline-none"
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

                  <div className="flex w-full flex-col sm:flex-row items-start justify-center gap-4">
                    <div className="flex w-full sm:w-1/2 flex-col gap-1">
                      <div className="flex flex-col pb-px">
                        <p className="text-xs font-medium leading-[16.8px] text-[#6C757D]">Ngày sinh</p>
                      </div>
                      <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#F1F3F5] px-4 py-[11px]">
                        <input
                          value={extractedIdentity.dateOfBirth}
                          readOnly
                          placeholder="01/01/1990"
                          className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#343A40] placeholder:text-[#9CA3AF] outline-none"
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

                    <div className="flex w-full sm:w-1/2 flex-col gap-1">
                      <div className="flex flex-col pb-px">
                        <p className="text-xs font-medium leading-[16.8px] text-[#6C757D]">Số CCCD</p>
                      </div>
                      <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#F1F3F5] px-4 py-[11px]">
                        <input
                          value={extractedIdentity.idNumber}
                          readOnly
                          placeholder="001090XXXXXX"
                          className="w-full border-0 bg-transparent p-0 text-base font-medium text-[#343A40] placeholder:text-[#9CA3AF] outline-none"
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

                  {/* Permanent Address from CCCD */}
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#6C757D]">Địa chỉ thường trú (Theo CCCD)</p>
                    </div>
                    <div className="relative flex min-h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-[#F1F3F5] px-4 py-[11px]">
                      <input
                        value={extractedIdentity.permanentAddress}
                        readOnly
                        placeholder="Trích xuất tự động từ mã QR CCCD"
                        className="w-full border-0 bg-transparent p-0 text-xs sm:text-sm font-medium text-[#343A40] placeholder:text-[#9CA3AF] outline-none"
                      />
                    </div>
                  </div>

                  {/* Optional Current Address */}
                  <div className="flex w-full flex-col gap-2 rounded-lg border border-[#E9ECEF] bg-white p-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-[#495057] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={differentLivingAddress}
                        onChange={(e) => setDifferentLivingAddress(e.target.checked)}
                        className="w-4 h-4 accent-[#93000B] rounded cursor-pointer"
                      />
                      Nơi ở hiện tại khác với địa chỉ thường trú (Tạm trú / Nhà trọ)
                    </label>

                    {differentLivingAddress && (
                      <div className="flex flex-col gap-2.5 pt-1.5 animate-in fade-in duration-150">
                        <p className="text-[11px] text-[#6C757D]">
                          Chọn nơi ở hiện tại để nhận thông báo hiến máu cấp cứu SOS quanh bạn:
                        </p>
                        
                        {/* 3 Cascading Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Province */}
                          <select
                            value={currentAddressDetails.province}
                            onChange={(e) => {
                              setCurrentAddressDetails(prev => ({
                                ...prev,
                                province: e.target.value,
                                district: '',
                                ward: ''
                              }));
                            }}
                            className="w-full px-2 py-2 bg-white border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#271816] focus:border-[#93000B] outline-none truncate"
                          >
                            <option value="">-- Tỉnh / Thành phố --</option>
                            {(vnProvinces as any[]).map((p: any) => (
                              <option key={p.code || p.name} value={p.name}>{p.name}</option>
                            ))}
                          </select>

                          {/* District */}
                          <select
                            value={currentAddressDetails.district}
                            disabled={!currentAddressDetails.province}
                            onChange={(e) => {
                              setCurrentAddressDetails(prev => ({
                                ...prev,
                                district: e.target.value,
                                ward: ''
                              }));
                            }}
                            className="w-full px-2 py-2 bg-white border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#271816] focus:border-[#93000B] outline-none disabled:bg-gray-100 disabled:text-gray-400 truncate"
                          >
                            <option value="">-- Quận / Huyện --</option>
                            {(availableDistricts as any[]).map((d: any) => (
                              <option key={d.code || d.name} value={d.name}>{d.name}</option>
                            ))}
                          </select>

                          {/* Ward */}
                          <select
                            value={currentAddressDetails.ward}
                            disabled={!currentAddressDetails.district}
                            onChange={(e) => {
                              setCurrentAddressDetails(prev => ({
                                ...prev,
                                ward: e.target.value
                              }));
                            }}
                            className="w-full px-2 py-2 bg-white border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#271816] focus:border-[#93000B] outline-none disabled:bg-gray-100 disabled:text-gray-400 truncate"
                          >
                            <option value="">-- Phường / Xã --</option>
                            {(availableWards as any[]).map((w: any) => (
                              <option key={w.code || w.name} value={w.name}>{w.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Street & House number */}
                        <div className="flex min-h-10 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-white px-3 py-2">
                          <input
                            value={currentAddressDetails.street}
                            onChange={(e) => setCurrentAddressDetails(prev => ({ ...prev, street: e.target.value }))}
                            placeholder="Số nhà, tên đường (VD: 127 Ni Sư Huỳnh Liên)..."
                            className="w-full border-0 bg-transparent p-0 text-xs sm:text-sm text-[#271816] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-6 w-full border-l-2 border-l-[#DEE2E6]" />

              <div className="flex w-full flex-col gap-[15px]">
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    className="flex h-6 w-6 cursor-default items-center justify-center rounded-full bg-[#93000B] pt-1 text-xs font-bold leading-4 text-white"
                  >
                    3
                  </button>
                  <div>
                    <p className="text-lg font-semibold leading-[25.2px] text-[#271816]">Thiết Lập Thông Tin Đăng Nhập</p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-[19px]">
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#343A40]">Địa chỉ Email</p>
                    </div>
                    <div className="flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-white px-4 py-[11px]">
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-base text-[#271816] placeholder:text-[#9CA3AF] outline-none"
                        type="email"
                        autoComplete="email"
                        placeholder="example@lifeline.org"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#343A40]">Số điện thoại</p>
                    </div>
                    <div className="relative flex h-11 w-full items-start overflow-hidden rounded-lg border border-[#DEE2E6] bg-white pl-16 pr-4 pt-[11px] pb-[11px]">
                      <div className="absolute left-4 top-2.5 flex w-fit border-r border-r-[#DEE2E6] pr-3">
                        <p className="text-base font-medium leading-6 text-[#A3A3A3]">+84</p>
                      </div>
                      <input
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-base text-[#271816] placeholder:text-[#9CA3AF] outline-none"
                        type="tel"
                        autoComplete="tel"
                        placeholder="0901234567"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-1">
                    <div className="flex flex-col pb-px">
                      <p className="text-xs font-medium leading-[16.8px] text-[#343A40]">Mật khẩu</p>
                    </div>
                    <div className={`relative flex h-11 w-full items-start overflow-hidden rounded-lg border ${passwordError ? 'border-[#BA1A1A] shadow-[0_0_0_2px_rgba(186,26,26,0.10)]' : 'border-[#DEE2E6]'} bg-white px-4 py-[11px]`}>
                      <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-base text-[#271816] placeholder:text-[#9CA3AF] outline-none"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="LifeLine@2026! (tối thiểu 8 ký tự)"
                      />
                      <svg
                        onClick={() => setShowPassword(!showPassword)}
                        width="22"
                        height="20"
                        viewBox="0 0 22 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute right-3 top-2.5 h-5 w-[22px] cursor-pointer"
                      >
                        <path
                          d="M15.1 10.5L13.65 9.05C13.8 8.26667 13.575 7.53333 12.975 6.85C12.375 6.16667 11.6 5.9 10.65 6.05L9.2 4.6C9.48333 4.46667 9.77083 4.36667 10.0625 4.3C10.3542 4.23333 10.6667 4.2 11 4.2C12.25 4.2 13.3125 4.6375 14.1875 5.5125C15.0625 6.3875 15.5 7.45 15.5 8.7C15.5 9.03333 15.4667 9.34583 15.4 9.6375C15.3333 9.92917 15.2333 10.2167 15.1 10.5ZM18.3 13.65L16.85 12.25C17.4833 11.7667 18.0458 11.2375 18.5375 10.6625C19.0292 10.0875 19.45 9.43333 19.8 8.7C18.9667 7.01667 17.7708 5.67917 16.2125 4.6875C14.6542 3.69583 12.9167 3.2 11 3.2C10.5167 3.2 10.0417 3.23333 9.575 3.3C9.10833 3.36667 8.65 3.46667 8.2 3.6L6.65 2.05C7.33333 1.76667 8.03333 1.55417 8.75 1.4125C9.46667 1.27083 10.2167 1.2 11 1.2C13.5167 1.2 15.7583 1.89583 17.725 3.2875C19.6917 4.67917 21.1167 6.48333 22 8.7C21.6167 9.68333 21.1125 10.5958 20.4875 11.4375C19.8625 12.2792 19.1333 13.0167 18.3 13.65ZM18.8 19.8L14.6 15.65C14.0167 15.8333 13.4292 15.9708 12.8375 16.0625C12.2458 16.1542 11.6333 16.2 11 16.2C8.48333 16.2 6.24167 15.5042 4.275 14.1125C2.30833 12.7208 0.883333 10.9167 0 8.7C0.35 7.81667 0.791667 6.99583 1.325 6.2375C1.85833 5.47917 2.46667 4.8 3.15 4.2L0.4 1.4L1.8 0L20.2 18.4L18.8 19.8ZM4.55 5.6C4.06667 6.03333 3.625 6.50833 3.225 7.025C2.825 7.54167 2.48333 8.1 2.2 8.7C3.03333 10.3833 4.22917 11.7208 5.7875 12.7125C7.34583 13.7042 9.08333 14.2 11 14.2C11.3333 14.2 11.6583 14.1792 11.975 14.1375C12.2917 14.0958 12.6167 14.05 12.95 14L12.05 13.05C11.8667 13.1 11.6917 13.1375 11.525 13.1625C11.3583 13.1875 11.1833 13.2 11 13.2C9.75 13.2 8.6875 12.7625 7.8125 11.8875C6.9375 11.0125 6.5 9.95 6.5 8.7C6.5 8.51667 6.5125 8.34167 6.5375 8.175C6.5625 8.00833 6.6 7.83333 6.65 7.65L4.55 5.6Z"
                          fill={passwordError ? '#BA1A1A' : '#A3A3A3'}
                        />
                      </svg>
                    </div>
                    {passwordError && (
                      <div className="flex items-center gap-1 pt-1">
                        <p className="text-[11.5px] font-medium leading-[16px] text-[#BA1A1A]">Mật khẩu phải từ 8 ký tự trở lên, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt (@$!%*?&).</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`relative flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#93000B] text-sm font-semibold leading-[14px] text-white ${actionButtonShadow}`}
                >
                  <div className="absolute inset-0 rounded-lg bg-transparent shadow-[0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.10)]" />
                  <span className="relative">{isSubmitting ? 'Đang xử lý đăng ký...' : 'Đăng Ký Tài Khoản'}</span>
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

                <div className="flex w-full flex-wrap items-center justify-center gap-2 pb-0.5 pt-[3px] text-center">
                  <p className="text-sm leading-5 text-[#6C757D]">Đã có tài khoản?</p>
                  <Link to="/auth/login" className="text-sm font-semibold leading-5 text-[#93000B] hover:text-[#7a0009] transition-colors">
                    Đăng nhập ngay
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:gap-6 border-t border-t-[#F1F3F5] bg-[#F8F9FA] px-4 sm:px-8 py-4">
            <div className="flex w-fit items-center gap-1.5 bg-white opacity-60">
              <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[15px] w-3">
                <path
                  d="M5.2125 10.1625L9.45 5.925L8.38125 4.85625L5.2125 8.025L3.6375 6.45L2.56875 7.51875L5.2125 10.1625ZM6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15ZM6 13.425C7.3 13.0125 8.375 12.1875 9.225 10.95C10.075 9.7125 10.5 8.3375 10.5 6.825V3.28125L6 1.59375L1.5 3.28125V6.825C1.5 8.3375 1.925 9.7125 2.775 10.95C3.625 12.1875 4.7 13.0125 6 13.425Z"
                  fill="#271816"
                />
              </svg>
              <p className="text-[10px] font-bold leading-[15px] tracking-[0.05em] text-[#271816]">BẢO MẬT MÃ HÓA SSL</p>
            </div>

            <div className="flex w-fit items-center gap-1.5 bg-white opacity-60">
              <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[15px] w-3">
                <path
                  d="M5.2125 10.1625L9.45 5.925L8.38125 4.85625L5.2125 8.025L3.6375 6.45L2.56875 7.51875L5.2125 10.1625ZM6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15ZM6 13.425C7.3 13.0125 8.375 12.1875 9.225 10.95C10.075 9.7125 10.5 8.3375 10.5 6.825V3.28125L6 1.59375L1.5 3.28125V6.825C1.5 8.3375 1.925 9.7125 2.775 10.95C3.625 12.1875 4.7 13.0125 6 13.425Z"
                  fill="#271816"
                />
              </svg>
              <p className="text-[10px] font-bold leading-[15px] tracking-[0.05em] text-[#271816]">CHUẨN BẢO VỆ DỮ LIỆU</p>
            </div>
          </div>
        </form>
        </div>
      </main>
      
      <AuthFooter />
    </div>
  );
}

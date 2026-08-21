import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, XCircle, Calendar, MapPin, AlertCircle, Clock } from 'lucide-react';

interface EligibilityOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  lastDonationDate?: string;
  nextEligibleDate?: string;
}

export const EligibilityOverlay: React.FC<EligibilityOverlayProps> = ({
  isOpen,
  onClose,
  title = 'Không đủ điều kiện hiến máu',
  message = 'Bạn chưa đủ khoảng cách tối thiểu kể từ lần hiến máu gần nhất hoặc thông tin sức khỏe chưa đáp ứng tiêu chuẩn.',
  lastDonationDate,
  nextEligibleDate,
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:p-4">
      <div className="bg-white w-full max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 flex flex-col items-center text-center gap-5 sm:gap-6 animate-in zoom-in-95 border border-[#dee2e6]">
        {/* Red Cancel Icon */}
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-[#93000b]">
          <XCircle className="w-10 h-10" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-[20px] font-bold text-[#271816]">{title}</h2>
          <p className="text-[14px] text-[#6c757d] leading-relaxed">{message}</p>
        </div>

        {/* Information Box */}
        {(lastDonationDate || nextEligibleDate) && (
          <div className="w-full bg-[#f8f9fa] border border-[#f1f3f5] rounded-xl p-4 space-y-2.5 text-sm">
            {lastDonationDate && (
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#6c757d]">Lần hiến máu cuối:</span>
                <span className="font-semibold text-[#271816]">{lastDonationDate}</span>
              </div>
            )}
            {nextEligibleDate && (
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#6c757d]">Ngày đủ điều kiện tiếp theo:</span>
                <span className="font-bold text-[#93000b]">{nextEligibleDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#93000b] text-white rounded-xl font-bold text-[14px] hover:bg-[#7a0009] transition-all shadow-md active:scale-[0.98]"
          >
            Đóng & Điều chỉnh thông tin
          </button>
          <button
            onClick={() => {
              onClose();
              navigate('/my-appointments');
            }}
            className="block w-full py-2.5 text-[13px] font-semibold text-[#93000b] hover:underline"
          >
            Xem lịch sử hiến máu
          </button>
        </div>
      </div>
    </div>
  );
};

interface DuplicateBookingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  activeLocationName?: string;
  activeDate?: string;
  activeTime?: string;
}

export const DuplicateBookingOverlay: React.FC<DuplicateBookingOverlayProps> = ({
  isOpen,
  onClose,
  title = 'Phát hiện đặt lịch trùng lặp',
  message = 'Bạn đã có một lịch hẹn hiến máu khác đã được xác nhận trong thời gian này.',
  activeLocationName = 'Bệnh viện Chợ Rẫy',
  activeDate = '18/08/2025',
  activeTime = '14:00',
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:p-4">
      <div className="bg-white w-full max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 flex flex-col items-center text-center animate-in zoom-in-95 border border-[#dee2e6]">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-5">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <h2 className="text-[20px] font-bold text-[#271816] mb-2">{title}</h2>
        <p className="text-[14px] text-[#6c757d] mb-6 leading-relaxed">{message}</p>

        {/* Active Booking Summary Box */}
        <div className="w-full bg-[#f8f9fa] border border-[#dee2e6] rounded-xl p-4 mb-6 text-left">
          <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider mb-2">
            Lịch hẹn hiện tại
          </p>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-bold text-[#271816]">{activeLocationName}</p>
              <div className="flex items-center gap-4 mt-1 text-[12px] text-[#6c757d]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {activeDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {activeTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('/my-appointments')}
            className="w-full py-3.5 bg-[#93000b] text-white rounded-xl font-bold text-[14px] shadow-sm hover:bg-[#7a0009] transition-all active:scale-[0.98]"
          >
            Xem lịch hẹn của tôi
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white text-[#271816] border border-[#dee2e6] rounded-xl font-semibold text-[14px] hover:bg-[#f8f9fa] transition-all"
          >
            Hủy / Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

interface SlotTakenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const SlotTakenOverlay: React.FC<SlotTakenOverlayProps> = ({
  isOpen,
  onClose,
  title = 'Khung giờ đã hết chỗ',
  message = 'Khung giờ bạn chọn vừa được đăng ký hết chỗ. Vui lòng chọn một khung giờ khác.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:p-4">
      <div className="bg-white w-full max-w-[440px] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-7 flex flex-col items-center text-center animate-in zoom-in-95 border border-[#dee2e6]">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-[#93000b] mb-4">
          <AlertCircle className="w-9 h-9" />
        </div>

        <h2 className="text-[19px] font-bold text-[#271816] mb-2">{title}</h2>
        <p className="text-[13px] text-[#6c757d] mb-6 leading-relaxed">{message}</p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#93000b] text-white rounded-xl font-bold text-[14px] shadow-sm hover:bg-[#7a0009] transition-all active:scale-[0.98]"
        >
          Chọn khung giờ khác
        </button>
      </div>
    </div>
  );
};

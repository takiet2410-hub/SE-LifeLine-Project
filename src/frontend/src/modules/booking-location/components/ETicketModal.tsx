import React from 'react';
import { X, Download, Share2, Mail, CheckCircle2, QrCode } from 'lucide-react';
import type { Appointment } from '../types';
import { toast } from 'sonner';

interface ETicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onDownload?: (id: string) => void;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onDownload,
}) => {
  if (!isOpen || !appointment) return null;

  const ticketCode =
    (appointment as any)._raw?.eTicketId?.ticketCode ||
    `#APT-${appointment.id.slice(-6).toUpperCase()}`;

  const qrUrl =
    appointment.qrCodeUrl ||
    (appointment as any)._raw?.eTicketId?.fileUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      ticketCode
    )}`;

  const isKnownBloodType =
    appointment.bloodType &&
    appointment.bloodType !== 'Unknown' &&
    appointment.bloodType !== 'Chưa rõ' &&
    appointment.bloodType !== 'Chưa cập nhật';

  const rawBloodType = (appointment as any)._raw?.bloodType || (appointment as any)._raw?.donorBloodType;
  const isRawKnown = rawBloodType && rawBloodType !== 'Unknown' && rawBloodType !== 'Chưa rõ' && rawBloodType !== 'Chưa cập nhật';

  const displayBloodType = isKnownBloodType
    ? appointment.bloodType
    : isRawKnown
    ? rawBloodType
    : 'Chưa cập nhật';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `E-Ticket Hiến máu LifeLine - ${ticketCode}`,
          text: `Mã E-Ticket hiến máu tại ${appointment.location.name} vào ${appointment.date} ${appointment.time}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share not allowed
      }
    } else {
      navigator.clipboard.writeText(ticketCode);
      toast.success('Đã sao chép mã E-Ticket vào khay nhớ tạm!');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[480px] max-h-[94dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in zoom-in-95 border border-[#dee2e6] relative sm:my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#5b403d] hover:text-[#93000b] flex items-center justify-center transition-all shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header Banner */}
        <div className="bg-[#16A34A]/10 border-b border-[#16A34A]/20 py-3 pl-4 pr-14 sm:px-6 flex items-center justify-center gap-2 text-center">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
          <span className="text-[#16A34A] text-[14px] font-bold">Đặt Lịch Thành Công! Thẻ E-Ticket Sẵn Sàng</span>
        </div>

        {/* E-Ticket Card Header */}
        <div className="bg-[#fff0ee] px-4 sm:px-6 py-4 sm:py-5 text-center border-b border-[#e4beb9]">
          <h2 className="text-[20px] font-extrabold text-[#152a43] uppercase tracking-wide">
            Thẻ Hẹn E-Ticket Của Bạn
          </h2>
          <p className="text-[13px] text-[#5b403d] font-medium mt-0.5">
            Vui lòng xuất trình mã này tại quầy tiếp đón
          </p>
        </div>

        {/* Ticket Details Body */}
        <div className="p-4 sm:p-6 space-y-5 text-center bg-white">
          <div className="space-y-1">
            <h3 className="text-[18px] font-bold text-[#93000b]">
              {appointment.location.name}
            </h3>
            <p className="text-[13px] text-[#5b403d]">
              {appointment.location.address || 'Trung tâm Hiến máu Nhân đạo LifeLine'}
            </p>
          </div>

          {/* 2x2 Details Grid */}
          <div className="grid grid-cols-2 gap-4 border-y border-[#e4beb9] py-4 bg-[#fff8f7] rounded-xl px-4">
            <div className="text-left">
              <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">NGÀY HẸN</p>
              <p className="text-[15px] font-bold text-[#271816]">{appointment.date}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">GIỜ HẸN</p>
              <p className="text-[15px] font-bold text-[#271816]">{appointment.time}</p>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">NHÓM MÁU</p>
              <p className="text-[15px] font-bold text-[#93000b]">
                {displayBloodType}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider">MÃ VÉ E-TICKET</p>
              <p className="text-[12px] sm:text-[14px] font-mono font-bold text-[#271816] break-all">{ticketCode}</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center py-2">
            <div className="p-3 bg-white border-2 border-[#dee2e6] rounded-2xl shadow-md transition-all hover:scale-105">
              <img
                src={qrUrl}
                alt="Appointment QR Code"
                className="w-[180px] h-[180px] object-contain mx-auto"
              />
            </div>
            <p className="mt-3 text-[12px] text-[#6c757d] font-medium italic flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-[#93000b]" />
              Quét mã để check-in tự động tại điểm hiến máu
            </p>
          </div>

          {/* Email Info Box */}
          <div className="bg-[#00497f]/5 border-l-4 border-[#00497f] rounded-lg p-3.5 text-left flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#00497f] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#00497f] leading-snug">
              Một email xác nhận kèm hướng dẫn chuẩn bị hiến máu đã được gửi tới hộp thư của bạn.
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="bg-[#f8f9fa] p-5 flex flex-col gap-2.5 border-t border-[#dee2e6]">
          {onDownload && (
            <button
              onClick={() => onDownload(appointment.id)}
              className="w-full bg-[#93000b] hover:bg-[#7a0009] text-white font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[14px]"
            >
              <Download className="w-4 h-4" />
              Tải Thẻ E-Ticket (PDF)
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 border-2 border-[#152a43] text-[#152a43] hover:bg-[#152a43] hover:text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[13px]"
            >
              <Share2 className="w-4 h-4" />
              Chia sẻ E-Ticket
            </button>
            <button
              onClick={onClose}
              className="px-6 border border-[#dee2e6] text-[#6c757d] hover:bg-[#dee2e6]/50 font-semibold py-2.5 rounded-xl transition-all text-[13px]"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

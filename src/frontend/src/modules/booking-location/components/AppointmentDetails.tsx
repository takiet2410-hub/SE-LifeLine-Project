import React, { useState } from 'react';
import { CalendarDays, Clock, MapPin, Download, XCircle, Droplet, Activity, Heart, Scale, QrCode, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import type { Appointment } from '../types';
import { DonationCertificateModal } from '../../impact-tracking/components/DonationCertificateModal';
import { getProfile } from '../../auth-account/api/authApi';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onCancel: (id: string) => void;
  onDownload: (id: string) => void;
  onSync?: (id: string) => void;
  onViewETicket?: () => void;
  isCancelling?: boolean;
  isSyncing?: boolean;
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  onCancel,
  onDownload,
  onViewETicket,
  isCancelling = false
}) => {
  const { user } = useAuth();
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [donorProfileData, setDonorProfileData] = useState<any>(null);

  const handleOpenCert = async () => {
    setIsCertOpen(true);
    try {
      const res = await getProfile();
      if (res.success && res.user) {
        setDonorProfileData(res.user);
      }
    } catch (e) {}
  };
  const isNoShow = appointment.status === 'no-show';
  const isCancelled = appointment.status === 'cancelled';
  const isRejected = appointment.status === 'rejected';
  const isCompleted = appointment.status === 'completed';
  const isPending = appointment.status === 'pending';
  const isUpcoming = appointment.status === 'upcoming';

  return (
    <div className="bg-white border border-[#f1f3f5] rounded-2xl overflow-hidden shadow-2xs h-full flex flex-col">
      {/* Header Image Gradient */}
      <div className="h-16 sm:h-20 md:h-24 bg-gradient-to-r from-[#93000b] via-[#b30010] to-[#c70014] relative shrink-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </div>

      <div className="p-4 sm:p-6 md:p-7 flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
        {/* Status & Blood Type Header */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div>
            <h2 className="text-[17px] sm:text-[20px] font-bold text-[#271816] mb-1.5">
              Chi Tiết Lịch Hẹn Hiến Máu
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {isPending && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <Clock className="w-3.5 h-3.5" /> CHỜ TRUNG TÂM XÁC NHẬN
                </span>
              )}
              {isUpcoming && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> ĐÃ XÁC NHẬN & CÓ THẺ HẸN
                </span>
              )}
              {isCompleted && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-bold bg-green-50 text-green-700 border border-green-200">
                  HOÀN THÀNH
                </span>
              )}
              {isRejected && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <XCircle className="w-3.5 h-3.5 text-rose-700" /> ĐÃ TỪ CHỐI
                </span>
              )}
              {isCancelled && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  ĐÃ HỦY
                </span>
              )}
              {isNoShow && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-bold bg-red-100 text-red-800 border border-red-300">
                  <XCircle className="w-3.5 h-3.5 text-red-700" /> VẮNG MẶT / QUÁ HẠN HẸN
                </span>
              )}

              {appointment.bloodType && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-bold bg-[#fff8f7] text-[#93000b] border border-[#93000b]/20">
                  <Droplet className="w-3 h-3 fill-current" />
                  {appointment.bloodType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pending Status Notice Banner */}
        {isPending && (
          <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12.5px] sm:text-[13px] font-bold">Lịch hẹn đang chờ Ngân hàng máu / Bệnh viện phê duyệt</p>
              <p className="text-[11.5px] sm:text-[12px] text-amber-800 leading-snug mt-0.5">
                Hồ sơ đăng ký của bạn đang được Bệnh viện rà soát. Ngay khi Bệnh viện xác nhận, hệ thống sẽ tự động gửi Email kèm Thẻ E-Ticket và mở quyền xem/tải về ngay trên ứng dụng.
              </p>
            </div>
          </div>
        )}

        {/* Cancelled / Rejected Status Notice Banner */}
        {(isCancelled || isRejected) && (
          <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-950 shadow-2xs">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="space-y-1 w-full">
              <p className="text-[12.5px] sm:text-[13px] font-bold text-rose-900">Lịch hẹn không được chấp nhận / Đã hủy</p>
              {appointment.rejectionReason || appointment.screeningNotes ? (
                <div className="p-2.5 sm:p-3 bg-white/90 border border-rose-200 rounded-lg mt-1.5 shadow-2xs">
                  <p className="text-[10.5px] sm:text-[11px] font-bold text-rose-900 uppercase tracking-wider mb-0.5">Lý do từ chối từ Nhân viên y tế:</p>
                  <p className="text-[12.5px] sm:text-[13px] font-semibold text-rose-800 italic">
                    "{appointment.rejectionReason || appointment.screeningNotes}"
                  </p>
                </div>
              ) : (
                <p className="text-[11.5px] sm:text-[12px] text-rose-800 leading-snug">
                  Lịch hẹn hiến máu của bạn không được phê duyệt hoặc đã bị hủy. Nếu cần hỗ trợ thêm, vui lòng liên hệ nhân viên trung tâm truyền máu.
                </p>
              )}
            </div>
          </div>
        )}

        {/* NoShow Status Notice Banner */}
        {isNoShow && (
          <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-950">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#93000b] shrink-0 mt-0.5" />
            <div>
              <p className="text-[12.5px] sm:text-[13px] font-bold">Lịch hẹn đã quá thời gian hẹn và được đánh dấu Vắng Mặt</p>
              <p className="text-[11.5px] sm:text-[12px] text-red-800 leading-snug mt-0.5">
                Do quá thời gian hẹn tiếp nhận mà chưa thực hiện check-in điểm danh, hệ thống đã tự động hủy lịch hẹn và ghi nhận trạng thái vắng mặt. Bạn có thể chọn địa điểm mới để đăng ký lại.
              </p>
            </div>
          </div>
        )}

        {/* Detail Grid: Location & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="p-3.5 sm:p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
            <div className="flex items-center gap-2 text-[#93000b] mb-1.5">
              <CalendarDays className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="font-bold text-[13px] sm:text-[14px]">Ngày & Giờ Hiến Máu</span>
            </div>
            <p className="text-[14px] sm:text-[15px] font-semibold text-[#271816]">{appointment.date}</p>
            <p className="text-[12px] sm:text-[13px] text-[#6c757d] flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {appointment.time}
            </p>
          </div>

          <div className="p-3.5 sm:p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
            <div className="flex items-center gap-2 text-[#93000b] mb-1.5">
              <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="font-bold text-[13px] sm:text-[14px]">Địa Điểm Tiếp Nhận</span>
            </div>
            <p className="text-[14px] sm:text-[15px] font-semibold text-[#271816]">{appointment.location.name}</p>
            <p className="text-[12px] sm:text-[13px] text-[#6c757d] mt-1 leading-snug">
              {appointment.location.address || 'Địa điểm bệnh viện/ngân hàng máu'}
            </p>
          </div>
        </div>

        {/* Health Screening Summary (If applicable) */}
        {appointment.healthSummary && Object.keys(appointment.healthSummary).length > 0 && (
          <div className="mb-6 border-t border-[#f1f3f5] pt-5">
            <h3 className="text-[14.5px] sm:text-[15.5px] font-bold text-[#271816] mb-3">Tóm Tắt Khảo Sát Sức Khỏe</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {appointment.healthSummary.bloodPressure && (
                <div className="flex flex-col gap-0.5 p-2.5 bg-gray-50/70 rounded-lg border border-gray-100">
                  <span className="text-[11px] sm:text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-red-500" /> Huyết áp
                  </span>
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#271816]">{appointment.healthSummary.bloodPressure}</span>
                </div>
              )}
              {appointment.healthSummary.heartRate && (
                <div className="flex flex-col gap-0.5 p-2.5 bg-gray-50/70 rounded-lg border border-gray-100">
                  <span className="text-[11px] sm:text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" /> Nhịp tim
                  </span>
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#271816]">{appointment.healthSummary.heartRate}</span>
                </div>
              )}
              {appointment.healthSummary.weight && (
                <div className="flex flex-col gap-0.5 p-2.5 bg-gray-50/70 rounded-lg border border-gray-100">
                  <span className="text-[11px] sm:text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Scale className="w-3 h-3 text-blue-500" /> Cân nặng
                  </span>
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#271816]">{appointment.healthSummary.weight}</span>
                </div>
              )}
              {appointment.healthSummary.hemoglobin && (
                <div className="flex flex-col gap-0.5 p-2.5 bg-gray-50/70 rounded-lg border border-gray-100">
                  <span className="text-[11px] sm:text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-red-600" /> Hemoglobin
                  </span>
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#271816]">{appointment.healthSummary.hemoglobin}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM: QR Code & Actions Section */}
      <div className="bg-white p-3.5 sm:p-5 md:px-6 border-t border-[#dee2e6] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4 shrink-0 rounded-b-2xl shadow-[0_-3px_8px_-1px_rgba(0,0,0,0.04)] z-10">
          {/* QR Code Card */}
          {isPending ? (
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-200 opacity-90">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-gray-300 rounded-lg flex items-center justify-center p-1 shrink-0">
                <QrCode className="w-8 h-8 sm:w-9 sm:h-9 text-gray-400" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mb-0.5">
                  <Clock className="w-3 h-3" /> E-TICKET CHỜ DUYỆT
                </span>
                <p className="text-[11.5px] font-bold text-gray-700 truncate">Đang chờ Bệnh viện xác nhận</p>
                <p className="text-[10.5px] text-gray-500 line-clamp-1 mt-0.5">
                  Thẻ E-Ticket sẽ tự động cấp sau khi duyệt
                </p>
              </div>
            </div>
          ) : (isUpcoming || isCompleted) ? (
            <div
              onClick={() => onViewETicket && onViewETicket()}
              className="flex items-center gap-3 bg-[#fff8f7] hover:bg-[#ffe9e6] p-2.5 sm:p-3 rounded-xl border border-[#f9dcd8] hover:border-[#93000b] cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
              title="Bấm để mở giao diện Thẻ E-Ticket"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-[#dee2e6] rounded-lg flex items-center justify-center p-1 group-hover:scale-105 transition-transform shrink-0">
                <img
                  src={
                    appointment.qrCodeUrl ||
                    (appointment as any)._raw?.eTicketId?.fileUrl ||
                    'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LifeLineAppt'
                  }
                  alt="QR Code"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain opacity-90"
                />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#93000b] bg-red-100/80 px-2 py-0.5 rounded-full mb-0.5">
                  <QrCode className="w-3 h-3" /> THẺ E-TICKET SẴN SÀNG
                </span>
                <p className="text-[11.5px] sm:text-[12px] font-bold text-[#271816] group-hover:text-[#93000b] transition-colors truncate">
                  Xem Thẻ E-Ticket →
                </p>
                <p className="text-[10.5px] text-[#6c757d] line-clamp-1 mt-0.5">
                  Bấm để mở vé quét tại quầy
                </p>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-stretch sm:justify-end w-full xl:w-auto">
            {isPending && (
              <button
                onClick={() => onCancel(appointment.id)}
                disabled={isCancelling}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#dee2e6] text-[#271816] hover:bg-red-50 hover:text-[#93000b] hover:border-[#93000b]/30 text-[13px] font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Hủy Lịch Hẹn
              </button>
            )}

            {isUpcoming && (
              <>
                {onViewETicket && (
                  <button
                    onClick={onViewETicket}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#152a43] hover:bg-[#0f1d2e] text-white text-[13px] font-semibold rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    Xem Thẻ E-Ticket
                  </button>
                )}
                <button
                  onClick={() => onDownload(appointment.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-semibold rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải Thẻ E-Ticket
                </button>
                <button
                  onClick={() => onCancel(appointment.id)}
                  disabled={isCancelling}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#dee2e6] text-[#271816] hover:bg-red-50 hover:text-[#93000b] hover:border-[#93000b]/30 text-[13px] font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Hủy Lịch Hẹn
                </button>
              </>
            )}

            {isCompleted && (
              <button
                onClick={handleOpenCert}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-semibold rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300" />
                Xem / In Giấy Chứng Nhận Hiến Máu
              </button>
            )}
          </div>
        </div>

      <DonationCertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        data={{
          donorName: donorProfileData?.personalInfo?.fullName || donorProfileData?.profileInfo?.fullName || user?.fullName || 'Người Hiến Máu LifeLine',
          idDocumentNumber: donorProfileData?.personalInfo?.idDocumentNumber || (user as any)?.idDocumentNumber || '079099xxxxxx',
          dateOfBirth: donorProfileData?.personalInfo?.dateOfBirth || (user as any)?.dateOfBirth,
          bloodType: appointment.bloodType || donorProfileData?.personalInfo?.bloodType || donorProfileData?.profileInfo?.bloodType || 'O+',
          volume: (appointment.donationVolume || (appointment as any)._raw?.donationVolume) ? `${appointment.donationVolume || (appointment as any)._raw?.donationVolume} ml` : '350 ml',
          donationDate: (appointment as any)._raw?.appointmentDate || appointment.date,
          locationName: appointment.location?.name || 'Trung tâm Hiến máu LifeLine',
          certificateNo: `CERT-${new Date().getFullYear()}-LL${(appointment.id || '').slice(-6).toUpperCase()}`
        }}
      />
    </div>
  );
};

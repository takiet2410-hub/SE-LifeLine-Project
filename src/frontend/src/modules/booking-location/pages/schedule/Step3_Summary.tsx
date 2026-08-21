import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScheduleContext } from '../../context/ScheduleContext';
import { CalendarDays, Clock, MapPin, CheckCircle2, ArrowLeft, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { createAppointment, mapHealthAnswersToBackend, type HealthAnswers } from '../../api/bookingApi';
import { toast } from 'sonner';
import { EligibilityOverlay, DuplicateBookingOverlay, SlotTakenOverlay } from '../../components/BookingOverlays';

export const Step3_Summary: React.FC = () => {
  const navigate = useNavigate();
  const { data, resetData } = useScheduleContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Overlay states
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<{
    title?: string;
    message?: string;
    lastDonationDate?: string;
    nextEligibleDate?: string;
  }>({});

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{
    title?: string;
    message?: string;
    activeLocationName?: string;
    activeDate?: string;
    activeTime?: string;
  }>({});

  const [showSlotTakenModal, setShowSlotTakenModal] = useState(false);

  // Get location data from context (set in Step1)
  const loc = data.locationData;

  const handleConfirm = async () => {
    if (!data.date || !data.locationId || !data.timeSlot) {
      toast.error('Thiếu thông tin đặt lịch. Vui lòng thử lại.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const healthAnswers = data.healthAnswers as HealthAnswers;
      const screeningAnswers = mapHealthAnswersToBackend(healthAnswers);

      const payload = {
        campaignId: data.locationId,
        appointmentDate: data.date,
        timeSlot: data.timeSlot,
        answers: screeningAnswers,
      };

      const res = await createAppointment(payload);

      if (res.success) {
        const bookedTimeSlot = data.timeSlot;
        resetData();
        toast.success('Tạo lịch hẹn hiến máu thành công!');
        navigate('/my-appointments/schedule/success', { state: { timeSlot: bookedTimeSlot } });
      } else {
        const msg = res.message || '';
        setError(msg || 'Lỗi đặt lịch hẹn. Vui lòng thử lại.');

        if (msg.includes('ELIGIBILITY_FAILED_SCREENING')) {
          setEligibilityData({
            title: 'Không đủ điều kiện hiến máu',
            message: 'Kết quả phiếu khảo sát sức khỏe của bạn chưa đáp ứng đủ tiêu chuẩn y tế để hiến máu trong đợt này.',
          });
          setShowEligibilityModal(true);
        } else if (
          msg.includes('ELIGIBILITY') ||
          msg.includes('84') ||
          msg.includes('khoảng cách') ||
          res.data?.code === 'ELIGIBILITY_FAILED_INTERVAL'
        ) {
          const rawLast = res.data?.lastDonationDate;
          const rawNext = res.data?.nextEligibleDate;

          const formatDateStr = (d?: string) => {
            if (!d) return undefined;
            try {
              const dt = new Date(d);
              if (isNaN(dt.getTime())) return d;
              const day = String(dt.getDate()).padStart(2, '0');
              const month = String(dt.getMonth() + 1).padStart(2, '0');
              const year = dt.getFullYear();
              return `${day}/${month}/${year}`;
            } catch {
              return d;
            }
          };

          const formattedLast = formatDateStr(rawLast);
          const formattedNext = formatDateStr(rawNext);

          const intervalDays =
            res.data?.donationIntervalDays ||
            (rawLast && rawNext ? Math.round((new Date(rawNext).getTime() - new Date(rawLast).getTime()) / (24 * 3600 * 1000)) : 84);

          const errorMsg = `Bạn chưa đủ khoảng cách tối thiểu ${intervalDays} ngày kể từ lần hiến máu gần nhất.`;
          setError(errorMsg);

          setEligibilityData({
            title: 'Chưa đủ thời gian giãn cách',
            message: errorMsg,
            lastDonationDate: formattedLast,
            nextEligibleDate: formattedNext,
          });
          setShowEligibilityModal(true);
        } else if (msg.includes('DUPLICATE') || msg.includes('trùng') || msg.includes('đã có')) {
          setDuplicateData({
            title: 'Phát hiện đặt lịch trùng lặp',
            message: 'Bạn đã có một lịch hẹn hiến máu khác đã được xác nhận trong thời gian này.',
            activeLocationName: loc?.name || 'Bệnh viện Chợ Rẫy',
            activeDate: data.date,
            activeTime: data.timeSlot,
          });
          setShowDuplicateModal(true);
        } else if (msg.includes('FULL') || msg.includes('đầy') || msg.includes('hết chỗ') || msg.includes('SLOT')) {
          setShowSlotTakenModal(true);
        } else {
          toast.error(msg || 'Lỗi đặt lịch hẹn. Vui lòng thử lại.');
        }
      }
    } catch (err) {
      const msg = 'Lỗi hệ thống. Vui lòng thử lại sau.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if they answered YES to any risky questions (works with new HealthAnswers structure)
  const hasRiskyAnswers = data.healthAnswers && checkRiskyAnswers(data.healthAnswers);

  function checkRiskyAnswers(answers: HealthAnswers): boolean {
    const riskyKeys: (keyof HealthAnswers)[] = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    return riskyKeys.some(key => {
      const val = answers[key];
      if (val === 'yes') return true;
      if (Array.isArray(val) && val.length > 0 && !val.includes('none')) return true;
      return false;
    });
  }

  if (!data.date || !data.locationId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[14px] text-[#6c757d] mb-4">Incomplete information. Please start over.</p>
        <button
          onClick={() => navigate('/my-appointments/schedule')}
          className="px-6 py-2 bg-[#93000b] text-white rounded-lg text-[14px] font-semibold"
        >
          Back to Start
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
      {/* Top Banner */}
      <div className="bg-[#fff8f7] border border-[#f1f3f5] rounded-xl p-6 shadow-sm text-center">
        <CheckCircle2 className="w-12 h-12 text-[#93000b] mx-auto mb-3" />
        <h2 className="text-[20px] font-bold text-[#271816] mb-1">Almost Done!</h2>
        <p className="text-[14px] text-[#5b403d]">Please review your booking details before confirming.</p>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col: Date & Time */}
        <div className="bg-white border border-[#f1f3f5] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#f8f9fa] border-b border-[#f1f3f5] px-5 py-4">
            <h3 className="text-[14px] font-bold text-[#271816]">Date & Time</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fff8f7] flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-[#93000b]" />
              </div>
              <div>
                <p className="text-[12px] text-[#6c757d] uppercase font-bold tracking-wide">Date</p>
                <p className="text-[15px] font-semibold text-[#271816]">{data.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fff8f7] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#93000b]" />
              </div>
              <div>
                <p className="text-[12px] text-[#6c757d] uppercase font-bold tracking-wide">Time Slot</p>
                <p className="text-[15px] font-semibold text-[#271816]">{data.timeSlot}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Location */}
        <div className="bg-white border border-[#f1f3f5] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#f8f9fa] border-b border-[#f1f3f5] px-5 py-4">
            <h3 className="text-[14px] font-bold text-[#271816]">Location</h3>
          </div>
          <div className="p-5 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fff8f7] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#93000b]" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#271816] mb-1">{loc?.name}</p>
              <p className="text-[13px] text-[#6c757d] leading-snug">{loc?.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Review Section */}
      <div className="bg-white border border-[#f1f3f5] rounded-xl shadow-sm p-6 flex items-start gap-4">
        {hasRiskyAnswers ? (
          <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
        ) : (
          <ShieldCheck className="w-8 h-8 text-[#93000b] shrink-0" />
        )}
        <div>
          <h3 className="text-[15px] font-bold text-[#271816] mb-1">Health Screening Review</h3>
          {hasRiskyAnswers ? (
            <p className="text-[13px] text-amber-700 font-medium">
              You answered YES to some screening questions. A medical professional will consult with you on-site before proceeding.
            </p>
          ) : (
            <p className="text-[13px] text-[#6c757d]">
              All screening questions passed. Please maintain a healthy diet before your appointment.
            </p>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => navigate('/my-appointments/schedule/step-2')}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 border border-[#dee2e6] text-[#271816] hover:bg-[#f8f9fa] text-[15px] font-semibold rounded-xl transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Edit Answers
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#93000b] hover:bg-[#7a0009] text-white text-[15px] font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Appointment'
          )}
        </button>
      </div>

      {/* Backend Validation Error Overlays */}
      <EligibilityOverlay
        isOpen={showEligibilityModal}
        onClose={() => setShowEligibilityModal(false)}
        title={eligibilityData.title}
        message={eligibilityData.message}
        lastDonationDate={eligibilityData.lastDonationDate}
        nextEligibleDate={eligibilityData.nextEligibleDate}
      />
      <DuplicateBookingOverlay
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title={duplicateData.title}
        message={duplicateData.message}
        activeLocationName={duplicateData.activeLocationName}
        activeDate={duplicateData.activeDate}
        activeTime={duplicateData.activeTime}
      />
      <SlotTakenOverlay
        isOpen={showSlotTakenModal}
        onClose={() => setShowSlotTakenModal(false)}
      />
    </div>
  );
};

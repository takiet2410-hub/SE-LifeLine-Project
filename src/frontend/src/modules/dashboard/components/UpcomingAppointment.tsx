import React, { useEffect, useState } from 'react';
import { CalendarClock, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAppointments, type Appointment } from '../../booking-location/api/bookingApi';
import { useTranslation } from 'react-i18next';

export const UpcomingAppointment: React.FC = () => {
  const { t } = useTranslation();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAppointments = async () => {
      const res = await fetchAppointments();
      if (res.success && res.data) {
        // Lấy lịch hẹn sắp tới hoặc đang chờ xác nhận
        const upcoming = res.data.filter(a => a.status === 'upcoming' || a.status === 'pending');
        if (upcoming.length > 0) {
          // Có thể sắp xếp để ưu tiên hiển thị cái gần nhất, hiện tại tạm lấy cái đầu tiên
          setAppointment(upcoming[0]);
        }
      }
      setLoading(false);
    };
    getAppointments();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5] mb-6 flex items-center justify-center h-[160px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#93000b]" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5] mb-6 flex flex-col items-center justify-center gap-2 h-[160px]">
        <CalendarClock className="w-10 h-10 text-[#dee2e6]" />
        <p className="text-[#6c757d] font-medium">{t('dashboard.upcoming.noAppointment')}</p>
        <Link to="/my-appointments/schedule" className="text-[#93000b] text-[14px] font-semibold hover:underline">
          {t('dashboard.upcoming.bookNow')}
        </Link>
      </div>
    );
  }

  const qrUrl = appointment.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${appointment.id}`;

  const isPending = appointment.status === 'pending';
  const badgeLabel = isPending ? t('dashboard.upcoming.pending') : t('dashboard.upcoming.scheduled');
  const badgeClass = isPending
    ? 'bg-orange-50 text-orange-700 border-orange-200'
    : 'bg-green-50 text-green-700 border-green-200';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f1f3f5] mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] font-bold text-[#271816]">{t('dashboard.upcoming.title')}</h2>
        <span className={`px-3 py-1 text-[12px] font-bold rounded-full border ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center">
        {/* QR Code or Pending Placeholder */}
        {isPending ? (
          <div className="w-24 h-24 bg-orange-50 border border-orange-100 rounded-xl flex flex-col items-center justify-center shrink-0 p-2 text-orange-600 gap-1.5 shadow-inner">
            <CalendarClock className="w-7 h-7 opacity-80" />
            <span className="text-[9px] font-bold uppercase leading-tight opacity-80 text-center">
              {t('dashboard.upcoming.pending')}
            </span>
          </div>
        ) : (
          <div className="w-24 h-24 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-2">
            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain opacity-90 mix-blend-multiply" />
          </div>
        )}
        
        {/* Details */}
        <div className="flex-1 w-full">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
            <span className="font-semibold text-[#271816] text-[15px]">{appointment.location.name}</span>
          </div>
          <div className="flex items-start gap-3 mb-4">
            <CalendarClock className="w-5 h-5 text-[#93000b] shrink-0 mt-0.5" />
            <span className="text-[#6c757d] text-[15px]">{appointment.time} - {appointment.date}</span>
          </div>
          
          <div className="flex gap-3 mt-4">
            <Link 
              to="/my-appointments" 
              className="flex items-center gap-1 text-[13px] font-semibold text-[#93000b] hover:text-[#7a0009] transition-colors"
            >
              {t('dashboard.upcoming.viewDetails')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};


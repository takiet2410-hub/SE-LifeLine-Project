import React, { useState, useEffect } from 'react';
import { fetchAppointments, type Appointment, parseDate } from '../../booking-location/api/bookingApi';
import { getProfile } from '../../auth-account/api/authApi';
import { DonationCertificateModal, type CertificateData } from './DonationCertificateModal';
import { Award } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface DonationTimelineProps {
  userId?: string;
}

export const DonationTimeline: React.FC<DonationTimelineProps> = ({ userId }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [certModal, setCertModal] = useState<{ isOpen: boolean; data: CertificateData | null }>({
    isOpen: false,
    data: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [res, profileRes] = await Promise.all([
          fetchAppointments(),
          getProfile()
        ]);

        if (profileRes.success && profileRes.user) {
          setFullProfile(profileRes.user);
        }

        if (res.success && res.data) {
          const completed = res.data.filter(a => a.status === 'completed');
          completed.sort((a, b) => {
            const timeA = parseDate((a as any)._raw?.appointmentDate || a.date)?.getTime() || 0;
            const timeB = parseDate((b as any)._raw?.appointmentDate || b.date)?.getTime() || 0;
            return timeB - timeA;
          });
          setAppointments(completed);
        }
      } catch (error) {
        console.error("Error loading timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) loadData();
  }, [userId]);

  const handleOpenCertificate = (evt: Appointment) => {
    const rawDate = (evt as any)._raw?.appointmentDate || evt.date;
    const locationName = (evt as any).locationName || evt.location?.name || 'Trung tâm Hiến máu LifeLine';

    const pInfo = fullProfile?.personalInfo;
    const pInfoProfile = fullProfile?.profileInfo;

    setCertModal({
      isOpen: true,
      data: {
        donorName: pInfo?.fullName || pInfoProfile?.fullName || user?.fullName || 'Người Hiến Máu LifeLine',
        idDocumentNumber: pInfo?.idDocumentNumber || (user as any)?.idDocumentNumber || '079099xxxxxx',
        dateOfBirth: pInfo?.dateOfBirth || (user as any)?.dateOfBirth,
        bloodType: evt.bloodType || pInfo?.bloodType || pInfoProfile?.bloodType || (user as any)?.bloodType || 'O+',
        volume: '350 ml',
        donationDate: rawDate,
        locationName: locationName,
        certificateNo: `CERT-${new Date(rawDate || Date.now()).getFullYear()}-LL${(evt.id || '').slice(-6).toUpperCase()}`
      }
    });
  };

  return (
    <>
      <div className="flex flex-col items-start p-6 gap-8 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-[#271816] font-inter text-lg font-semibold leading-[25.2px]">Lịch Sử & Giấy Chứng Nhận Hiến Máu</h2>
          {appointments.length > 0 && (
            <span className="text-[#6C757D] text-xs font-semibold uppercase tracking-wider">{appointments.length} LẦN HIẾN THÀNH CÔNG</span>
          )}
        </div>
        
        <div className="flex pl-8 flex-col items-start gap-12 w-full relative min-h-[100px]">
          {isLoading ? (
            <p className="text-[#6C757D] text-sm py-4">Đang tải lịch sử...</p>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col w-full h-full justify-center items-start -ml-4">
              <p className="text-[#6C757D] font-inter text-sm italic">Bạn chưa có lịch sử hiến máu nào được ghi nhận.</p>
            </div>
          ) : (
            <>
              <div className="absolute left-[11px] top-2 bg-[#DEE2E6] w-0.5 h-[calc(100%-24px)]"></div>
              {appointments.map((evt, idx) => {
                const rawDate = (evt as any)._raw?.appointmentDate || evt.date;
                const dateObj = parseDate(rawDate);
                const formattedDate = dateObj
                  ? dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : evt.date;
                return (
                  <div key={idx} className="flex flex-col items-start w-full relative group">
                    <div className="flex flex-wrap justify-between items-start w-full gap-2">
                      <div className="flex flex-col items-start">
                        <p className="text-[#271816] font-inter text-base font-semibold leading-6">Hiến máu toàn phần định kỳ</p>
                        <p className="text-[#6C757D] font-inter text-sm leading-[21px]">{(evt as any).locationName || (evt as any).location?.name || 'Chiến dịch Hiến máu LifeLine'}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenCertificate(evt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          Giấy Chứng Nhận
                        </button>

                        <div className="flex flex-col items-end gap-1">
                          <p className="text-[#271816] font-inter text-sm font-bold">{formattedDate}</p>
                          <div className={`flex py-0.5 px-2 justify-end items-start rounded bg-[rgba(22,163,74,0.10)]`}>
                            <p className={`font-inter text-xs font-medium leading-[16.8px] text-[#16A34A]`}>Đã hoàn thành</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`absolute -left-[30px] top-1 rounded-full border-4 bg-[#FFF] w-6 h-6 border-[#93000B]`}></div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {certModal.data && (
        <DonationCertificateModal
          isOpen={certModal.isOpen}
          onClose={() => setCertModal({ isOpen: false, data: null })}
          data={certModal.data}
        />
      )}
    </>
  );
};

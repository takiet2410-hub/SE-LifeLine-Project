import React, { useState, useEffect } from 'react';
import { parseDate } from '../../booking-location/api/bookingApi';
import { getProfile } from '../../auth-account/api/authApi';
import { DonationCertificateModal, type CertificateData } from './DonationCertificateModal';
import { Award, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import type { ProfileData } from './ProfileHeaderCard';

interface DonationTimelineProps {
  userId?: string;
  profileData?: ProfileData | null;
}

export const DonationTimeline: React.FC<DonationTimelineProps> = ({ userId, profileData }) => {
  const { user } = useAuth();
  const [timelineItems, setTimelineItems] = useState<any[]>(profileData?.donationTimeline || []);
  const [fullProfile, setFullProfile] = useState<any>(profileData || null);
  const [isLoading, setIsLoading] = useState(!profileData);
  const [certModal, setCertModal] = useState<{ isOpen: boolean; data: CertificateData | null }>({
    isOpen: false,
    data: null
  });

  useEffect(() => {
    if (profileData?.donationTimeline) {
      setTimelineItems(profileData.donationTimeline);
      setFullProfile(profileData);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const profileRes = await getProfile();
        if (profileRes.success && profileRes.user) {
          setFullProfile(profileRes.user);
          if (profileRes.user.donationTimeline) {
            setTimelineItems(profileRes.user.donationTimeline);
          }
        }
      } catch (error) {
        console.error("Error loading timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) loadData();
  }, [userId, profileData]);

  const handleOpenCertificate = (evt: any) => {
    const rawDate = evt.date;
    const locationName = evt.locationName || 'Trung tâm Hiến máu LifeLine';

    const pInfo = fullProfile?.personalInfo;
    const pInfoProfile = fullProfile?.profileInfo;

    setCertModal({
      isOpen: true,
      data: {
        donorName: pInfo?.fullName || pInfoProfile?.fullName || user?.fullName || 'Người Hiến Máu LifeLine',
        idDocumentNumber: pInfo?.idDocumentNumber || (user as any)?.idDocumentNumber || '079099xxxxxx',
        dateOfBirth: pInfo?.dateOfBirth || (user as any)?.dateOfBirth,
        bloodType: evt.bloodType || pInfo?.bloodType || pInfoProfile?.bloodType || (user as any)?.bloodType || 'O+',
        volume: evt.volume || '350 ml',
        donationDate: rawDate,
        locationName: locationName,
        certificateNo: evt.certificateNo || `CERT-${new Date(rawDate || Date.now()).getFullYear()}-LL${(evt.id || '').slice(-6).toUpperCase()}`
      }
    });
  };

  return (
    <>
      <div className="flex flex-col items-start p-6 gap-8 rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-[#271816] font-inter text-lg font-semibold leading-[25.2px]">Lịch Sử & Giấy Chứng Nhận Hiến Máu</h2>
          {timelineItems.length > 0 && (
            <span className="text-[#6C757D] text-xs font-semibold uppercase tracking-wider">{timelineItems.length} LẦN HIẾN THÀNH CÔNG</span>
          )}
        </div>
        
        <div className="flex pl-8 flex-col items-start gap-12 w-full relative min-h-[100px]">
          {isLoading ? (
            <p className="text-[#6C757D] text-sm py-4">Đang tải lịch sử...</p>
          ) : timelineItems.length === 0 ? (
            <div className="flex flex-col w-full h-full justify-center items-start -ml-4">
              <p className="text-[#6C757D] font-inter text-sm italic">Bạn chưa có lịch sử hiến máu nào được ghi nhận.</p>
            </div>
          ) : (
            <>
              <div className="absolute left-[11px] top-2 bg-[#DEE2E6] w-0.5 h-[calc(100%-24px)]"></div>
              {timelineItems.map((evt, idx) => {
                const dateObj = parseDate(evt.date);
                const formattedDate = dateObj
                  ? dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : evt.date;
                const isSOS = evt.type === 'SOSDirectDonation';

                return (
                  <div key={idx} className="flex flex-col items-start w-full relative group">
                    <div className="flex flex-wrap justify-between items-start w-full gap-2">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <p className="text-[#271816] font-inter text-base font-semibold leading-6">{evt.title || 'Hiến máu toàn phần'}</p>
                          {isSOS && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                              <ShieldAlert className="w-3 h-3" />
                              SOS Cấp Cứu
                            </span>
                          )}
                        </div>
                        <p className="text-[#6C757D] font-inter text-sm leading-[21px]">{evt.locationName || 'Chiến dịch Hiến máu LifeLine'}</p>
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
                    <div className={`absolute -left-[30px] top-1 rounded-full border-4 bg-[#FFF] w-6 h-6 ${isSOS ? 'border-red-600' : 'border-[#93000B]'}`}></div>
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

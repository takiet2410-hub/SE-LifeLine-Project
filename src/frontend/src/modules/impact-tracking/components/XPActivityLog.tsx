import React, { useState, useEffect } from 'react';
import { parseDate } from '../../booking-location/api/bookingApi';
import { getProfile } from '../../auth-account/api/authApi';
import type { ProfileData } from './ProfileHeaderCard';

interface XPActivityLogProps {
  userId?: string;
  profileData?: ProfileData | null;
}

export const XPActivityLog: React.FC<XPActivityLogProps> = ({ userId, profileData }) => {
  const [xpActivities, setXpActivities] = useState<any[]>(profileData?.xpActivityLog || []);
  const [isLoading, setIsLoading] = useState(!profileData);

  useEffect(() => {
    if (profileData?.xpActivityLog) {
      setXpActivities(profileData.xpActivityLog);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await getProfile();
        if (res.success && res.user && res.user.xpActivityLog) {
          setXpActivities(res.user.xpActivityLog);
        }
      } catch (error) {
        console.error("Error loading XP activities:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) loadData();
  }, [userId, profileData]);

  return (
    <div className="flex flex-col items-start rounded-xl border border-[#F1F3F5] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] w-full overflow-hidden min-h-[150px]">
      <div className="flex p-6 flex-col border-b border-[#F1F3F5] w-full">
        <h2 className="text-[#271816] font-inter text-lg font-semibold leading-[25.2px]">XP Activity Log</h2>
      </div>
      
      <div className="flex flex-col items-start w-full">
        {isLoading ? (
          <div className="flex py-8 px-6 w-full justify-center">
            <span className="text-[#6C757D] text-sm">Đang tải dữ liệu...</span>
          </div>
        ) : xpActivities.length === 0 ? (
          <div className="flex py-10 px-6 w-full justify-center">
            <span className="text-[#6C757D] text-sm italic">Bạn chưa có hoạt động nào để nhận XP. Hãy tham gia hiến máu!</span>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="flex w-full border-b border-[#F1F3F5] bg-[#F8F9FA]">
              <div className="flex py-4 px-6 w-[40%]"><span className="text-[#6C757D] text-xs font-medium tracking-wide">HOẠT ĐỘNG</span></div>
              <div className="flex py-4 px-6 w-[20%]"><span className="text-[#6C757D] text-xs font-medium tracking-wide">NGÀY THỰC HIỆN</span></div>
              <div className="flex py-4 px-6 w-[20%]"><span className="text-[#6C757D] text-xs font-medium tracking-wide">ĐIỂM THƯỞNG</span></div>
              <div className="flex py-4 px-6 w-[20%] justify-end"><span className="text-[#6C757D] text-xs font-medium tracking-wide">TÁC ĐỘNG</span></div>
            </div>
            
            {/* Dynamic Rows */}
            {xpActivities.map((evt, idx) => {
              const dateObj = parseDate(evt.date);
              const formattedDate = dateObj
                ? dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : evt.date;

              return (
                <div key={evt.id || idx} className="flex w-full items-center border-b border-[#F1F3F5] last:border-b-0 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col px-6 w-[40%]">
                    <span className="text-[#271816] text-base font-medium">{evt.activity || 'Hiến máu'}</span>
                    <span className="text-[#A3A3A3] text-xs font-medium">{evt.locationName || 'LifeLine'}</span>
                  </div>
                  <div className="flex px-6 w-[20%] text-[#271816] text-sm font-semibold">{formattedDate}</div>
                  <div className="flex px-6 w-[20%] text-[#16A34A] text-base font-bold">+{evt.xp || 150} XP</div>
                  <div className="flex px-6 w-[20%] justify-end gap-1 text-[#271816] font-semibold text-base">{evt.impact || '♥️ x3'}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
